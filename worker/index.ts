import { DurableObject } from 'cloudflare:workers'

interface Env {
    ROOMS: DurableObjectNamespace<Room>
}

interface Session {
    id: string
}

export class Room extends DurableObject<Env> {
    private sessions = new Map<WebSocket, Session>();

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

        this.broadcast({
            type: "presence",
            connections: this.sessions.size,
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
        const session = this.sessions.get(socket) ?? (socket.deserializeAttachment() as Session);

        const text = typeof message === "string" ? message : new TextDecoder().decode(message);

        this.broadcast({
            type: "message",
            sessionId: session.id,
            text,
            connections: this.sessions.size,
        });
    }

    async webSocketClose(
        socket: WebSocket,
        code: number,
        reason: string
    ): Promise<void> {
        this.sessions.delete(socket);

        this.broadcast({
            type: "presence",
            connections: this.sessions.size,
        });

        socket.close(code, reason);
    }

    private broadcast(message: object): void {
        const data = JSON.stringify(message);

        for (const socket of this.ctx.getWebSockets()) {
            socket.send(data);
        }
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