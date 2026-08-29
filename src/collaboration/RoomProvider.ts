import * as Y from "yjs";

export type RoomConnectionStatus =
    | "Connecting"
    | "Syncing"
    | "Connected"
    | "Disconnected";

interface RoomProviderOptions {
    onStatusChange?: (status: RoomConnectionStatus) => void;
    onConnectionsChange?: (connections: number) => void;
}

interface ServerMessage {
    type: string;
    sessionId?: string;
    connections?: number;
}

export class RoomProvider {
    private socket: WebSocket | null = null;
    private pendingUpdates: Uint8Array[] = [];
    private flushTimer: number | null = null;
    private readonly roomId: string;
    private readonly document: Y.Doc;
    private readonly options: RoomProviderOptions;

    constructor(
        roomId: string,
        document: Y.Doc,
        options: RoomProviderOptions = {},
    ) {
        this.roomId = roomId;
        this.document = document;
        this.options = options;

        if (!/^[a-z0-9_-]{1,64}$/.test(roomId)) {
            throw new Error(`Invalid Room ID: ${roomId}`);
        }

        this.document.on(
            "update",
            this.handleDocumentUpdate,
        );
    }

    connect(): void {
        if (this.socket &&
            (
                this.socket.readyState === WebSocket.OPEN ||
                this.socket.readyState === WebSocket.CONNECTING
            )
        ) {
            return;
        }

        this.options.onStatusChange?.("Connecting");

        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const socket = new WebSocket(
            `${protocol}://${window.location.host}/ws/rooms/${this.roomId}`,
        );

        // Yjs is binary
        socket.binaryType = "arraybuffer";

        this.socket = socket;

        socket.addEventListener("open", this.handleSocketOpen);

        socket.addEventListener("message", this.handleSocketMessage);

        socket.addEventListener("close", this.handleSocketClose);

        socket.addEventListener("error", this.handleSocketError);
    }

    destroy(): void {
        if (this.flushTimer !== null) {
            window.clearTimeout(this.flushTimer);
            this.flushTimer = null;
            this.flushPendingUpdates();
        }

        this.document.off(
            "update",
            this.handleDocumentUpdate,
        );

        this.socket?.removeEventListener(
            "open",
            this.handleSocketOpen,
        );

        this.socket?.removeEventListener(
            "message",
            this.handleSocketMessage,
        );

        this.socket?.removeEventListener(
            "close",
            this.handleSocketClose,
        );

        this.socket?.removeEventListener(
            "error",
            this.handleSocketError,
        );

        this.socket?.close();
        this.socket = null;
    }

    private readonly handleSocketOpen =
    (): void => {
        this.options.onStatusChange?.("Syncing");
        this.flushPendingUpdates();
    };

    private readonly handleSocketClose =
    (): void => {
        this.options.onStatusChange?.("Disconnected");
        this.options.onConnectionsChange?.(0);
    };

    private readonly handleSocketError =
    (): void => {
        this.options.onStatusChange?.("Disconnected");
    };


    private readonly handleDocumentUpdate = (
        update: Uint8Array,
        origin: unknown,
    ): void => {
        // Dont send back to updater
        if (origin === this) {
            return;
        }

        this.pendingUpdates.push(update);
        this.scheduleFlush();
    };

    private readonly handleSocketMessage = (
        event: MessageEvent,
    ): void => {
        // Contains connected, presence, synced
        if (typeof event.data === "string") {
            this.handleServerMessage(event.data);
            return;
        }

        // Binary message is Yjs update
        if (event.data instanceof ArrayBuffer) {
            const update = new Uint8Array(event.data);

            Y.applyUpdate(
                this.document,
                update,
                this,
            );
        }
    };

    private handleServerMessage(data: string): void {
        let message: ServerMessage;

        try {
            message = JSON.parse(data) as ServerMessage;
        } catch {
            return;
        }

        if (typeof message.connections === "number") {
            this.options.onConnectionsChange?.(
                message.connections
            );
        }

        if (message.type === "synced") {
            this.options.onStatusChange?.("Connected");
        }
    }

    private scheduleFlush(): void {
        if (this.flushTimer !== null) {
            return;
        }

        // Combine Yjs operations into one message
        this.flushTimer = window.setTimeout(() => {
            this.flushTimer = null;
            this.flushPendingUpdates();
        }, 50);
    }

    private flushPendingUpdates(): void {
        if (this.pendingUpdates.length === 0) {
            return;
        }

        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }

        const update = Y.mergeUpdates(
            this.pendingUpdates,
        );

        this.pendingUpdates = [];

        this.socket.send(this.toArrayBuffer(update));
    }

    private toArrayBuffer(
        value: Uint8Array,
    ): ArrayBuffer {
        const buffer = new ArrayBuffer(value.byteLength);
        const view = new Uint8Array(buffer);
        view.set(value);
        return buffer;
    }
}