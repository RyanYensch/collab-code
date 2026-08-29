import { DurableObject } from "cloudflare:workers";
import * as Y from "yjs";

import { CODE_TEXT_KEY, STARTER_CODE } from "../shared/editor.ts";

import {
    MESSAGE_AWARENESS_UPDATE,
    MESSAGE_DOCUMENT_UPDATE,
    decodeBinaryMessage,
    encodeBinaryMessage
} from "../shared/protocol.ts"
interface Env {
    ROOMS: DurableObjectNamespace<Room>
}

interface Session {
    id: string
}

const DOCUMENT_STORAGE_KEY = "yjs-document";

export class Room extends DurableObject<Env> {
    private sessions = new Map<WebSocket, Session>();

    private readonly ydoc = new Y.Doc();

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);

        // Restore WebSocket metadata if durable
        for (const socket of this.ctx.getWebSockets()) {
            const session = socket.deserializeAttachment() as Session | null;

            if (session) {
                this.sessions.set(socket, session);
            }
        }

        this.ctx.setWebSocketAutoResponse(
            new WebSocketRequestResponsePair("ping", "pong"),
        );

        // Restore Yjs document from durable object storage
        // Block other requests during initialisation
        this.ctx.blockConcurrencyWhile(
            async () => {
                const stored = await this.ctx.storage.get<ArrayBuffer>(
                    DOCUMENT_STORAGE_KEY
                );

                if (stored) {
                    Y.applyUpdate(
                        this.ydoc,
                        new Uint8Array(stored),
                        "storage"
                    );

                    return;
                }

                // New room
                const code = this.ydoc.getText(
                    CODE_TEXT_KEY,
                );

                code.insert(0, STARTER_CODE);

                await this.persistDocument();
            }
        )
    }

    async fetch(request: Request): Promise<Response> {
        const upgrade = request.headers.get('Upgrade');

        if (upgrade?.toLowerCase() !== "websocket") {
            return new Response("Expected WebSocket Connection", {
                status: 426,
            });
        }

        const pair = new WebSocketPair();

        const [client, server] = Object.values(pair);

        // Cloudflares hibernatable WebSocket API
        this.ctx.acceptWebSocket(server);

        const session: Session = {
            id: crypto.randomUUID(),
        };

        server.serializeAttachment(session);

        this.sessions.set(server, session);

        server.send(
            JSON.stringify({
                type: "connected",
                sessionId: session.id,
                connections: this.sessions.size,
            })
        );

        // Send complete document
        const documentState = Y.encodeStateAsUpdate(this.ydoc);
        server.send(
            encodeBinaryMessage(
                MESSAGE_DOCUMENT_UPDATE,
                documentState,
            )
        );

        // WebSocket messages preserver order so it has full document
        server.send(
            JSON.stringify({
                type: "synced"
            })
        );

        this.broadcastPresence();

        this.broadcastJson({
            type: "awareness-request"
        });

        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }

    async webSocketMessage(
        socket: WebSocket,
        message: string | ArrayBuffer
    ): Promise<void> {
        // Only accepts binary updates
        if (typeof message === "string") {
            return;
        }

        const decoded = decodeBinaryMessage(message);

        if (!decoded) {
            return;
        }

        if (decoded.type === MESSAGE_DOCUMENT_UPDATE) {
            try {
                // Apply change to authoritative document
                Y.applyUpdate(
                    this.ydoc,
                    decoded.payload,
                    socket,
                );

                // Persist so it can hibernate
                await this.persistDocument();

                this.broadcastBinary(
                    encodeBinaryMessage(
                        MESSAGE_DOCUMENT_UPDATE,
                        decoded.payload
                    ),
                    socket,
                );
            } catch (error) {
                console.error(
                    "Invalid Yjs update:",
                    error,
                );

                socket.close(
                    1003,
                    "Invalid collaboration update",
                );
            }

            return;
        }

        // Temporary user/cursor state
        if (decoded.type === MESSAGE_AWARENESS_UPDATE) {
            this.broadcastBinary(
                encodeBinaryMessage(
                    MESSAGE_AWARENESS_UPDATE,
                    decoded.payload,
                ),
                socket,
            )
        }
    }

    async webSocketClose(
        socket: WebSocket,
        _code: number,
        _reason: string
    ): Promise<void> {
        this.sessions.delete(socket);
        this.broadcastPresence();
    }

    async webSocketError(
        socket: WebSocket,
    ): Promise<void> {
        this.sessions.delete(socket);
        this.broadcastPresence();
    }

    private async persistDocument(): Promise<void> {
        const state = Y.encodeStateAsUpdate(this.ydoc);

        await this.ctx.storage.put(
            DOCUMENT_STORAGE_KEY,
            this.toArrayBuffer(state),
        );
    }

    private broadcastBinary(
        message: ArrayBuffer,
        sender?: WebSocket,
    ): void {
        for (const socket of this.ctx.getWebSockets()) {
            if (sender && socket === sender) {
                continue;
            }

            socket.send(message);
        }
    }

    private broadcastJson(
        message: object,
    ): void {
        const data = JSON.stringify(message);

        for (const socket of this.ctx.getWebSockets()) {
            socket.send(data);
        }
    }

    private broadcastPresence(): void {
        const message =
            JSON.stringify({
                type: "presence",
                connections: this.sessions.size,
            });

        for (const socket of this.ctx.getWebSockets()) {
            socket.send(message);
        }
    }

    private toArrayBuffer(
        value: Uint8Array,
    ): ArrayBuffer {
        // Same size copy roather than rely on buffer bounds
        const copy = new Uint8Array(value.byteLength);
        copy.set(value);

        return copy.buffer;
    }
}

export default {
    async fetch(
        request: Request,
        env: Env,
    ): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === "/api/health") {
            return Response.json({
                ok: true,
            });
        }

        /**
         * Websocket:
         *
         * /ws/rooms/abc123
         * /ws/rooms/hello
         */
        const roomMatch = url.pathname.match(/^\/ws\/rooms\/([a-zA-Z0-9_-]{1,64})$/);

        if (roomMatch) {
            if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
                return new Response("Expected WebSocket Connection", {
                    status: 462,
                });
            }

            const roomId = roomMatch[1].toLowerCase();
            const room = env.ROOMS.getByName(roomId);

            return room.fetch(request);
        }

        return new Response("Not Found", {
            status: 404,
        });
    },
} satisfies ExportedHandler<Env>