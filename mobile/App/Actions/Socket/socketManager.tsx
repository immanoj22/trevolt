import { io, Socket } from "socket.io-client";

type SocketOptions = Parameters<typeof io>[1];

type ListenerEntry = {
    event: string;
    handlers: Set<(...args: any[]) => void>;
    attachedHandlers: Set<(...args: any[]) => void>;
};

type EmitterEntry = {
    event: string;
    data: any;
    attached: boolean;
};

class SocketService {
    private static instance: SocketService | null = null;
    private socket: Socket | null = null;
    private listeners: Map<string, ListenerEntry> = new Map();
    private emitters: Map<string, EmitterEntry> = new Map();
    private isConneted: Boolean = false;

    private constructor() { }

    static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    connect(url: string, options: SocketOptions = {}): Socket {
        if (!this.socket) {
            this.socket = io(url, {
                // Try a real WebSocket FIRST, fall back to HTTP long-polling only if
                // that fails. socket.io's default order is ['polling','websocket'] -
                // it opens on polling and *then* upgrades, which on a mobile RTT means
                // ~1-3s of laggy, batched price updates at every app start before the
                // upgrade lands ("prices slow at startup, then sync"). A React Native
                // client has none of the CORS/proxy constraints that make polling-first
                // worthwhile on the web, so going straight to WebSocket is both faster
                // to real-time and cleaner. `rememberUpgrade` skips the polling probe
                // entirely on later reconnects once a WS handshake has succeeded once.
                transports: ['websocket', 'polling'],
                rememberUpgrade: true,
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 500,
                reconnectionDelayMax: 5000,
                ...options,
            });

            this.socket.on("connect", () => {
                console.log("🚀 Socket connected:", this.socket?.id);
                this.isConneted = true;
                for (const entry of this.listeners.values()) {
                    for (const handler of entry.handlers) {
                        if (!entry.attachedHandlers.has(handler)) {
                            this.socket?.on(entry.event, handler);
                            entry.attachedHandlers.add(handler);
                        }
                    }
                }
                for (const [event, entry] of this.emitters.entries()) {
                    if (!entry.attached) {
                        this.socket?.emit(event, entry.data);
                        this.emitters.set(event, { ...entry, attached: true });
                    }
                }
            });

            this.socket.on("disconnect", (reason: string) => {
                console.log("⚠️ Socket disconnected:", reason);
                if (reason == 'io server disconnect') {
                    // setConnectionState('notconnected')
                    this.socket?.connect()
                }
                else if (reason == 'io client disconnect') {
                    // setConnectionState('notconnected')
                    this.socket?.connect()
                }
                if (!this.socket?.active) {
                    this.socket?.connect();
                }
            });

            this.socket.on("connect_error", (reason: Error) => {
                console.log("⚠️ Socket connect error:", reason);
                if (!this.socket?.active) {
                    this.socket?.connect();
                }
            });
        }

        return this.socket;
    }

    on(event: string, handler: (...args: any[]) => void): void {
        let entry = this.listeners.get(event);
        if (!entry) {
            entry = { event, handlers: new Set(), attachedHandlers: new Set() };
            this.listeners.set(event, entry);
        }

        if (entry.handlers.has(handler)) return;
        entry.handlers.add(handler);

        if (this.socket) {
            this.socket.on(event, handler);
            entry.attachedHandlers.add(handler);
        }
    }

    // `handler` is optional so existing call sites that only pass the event
    // name (matching the pre-refactor API) still remove every listener they
    // registered for that event, instead of silently no-op'ing.
    off(event: string, handler?: (...args: any[]) => void): void {
        const entry = this.listeners.get(event);
        if (!entry) return;

        if (handler) {
            this.socket?.off(entry.event, handler);
            entry.handlers.delete(handler);
            entry.attachedHandlers.delete(handler);
        } else {
            for (const h of entry.handlers) {
                this.socket?.off(entry.event, h);
            }
            entry.handlers.clear();
            entry.attachedHandlers.clear();
        }

        if (entry.handlers.size === 0) {
            this.listeners.delete(event);
        }
    }

    emit<T = unknown>(event: string, data?: T): void {
        this.emitters.set(event, { event, data, attached: false });
        if (this.socket) {
            this.socket?.emit(event, data);
            this.emitters.set(event, { event, data, attached: true })
        }

    }

    getSocket(): Socket | null {
        return this.socket;
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.listeners.clear();
            console.log("🔌 Socket disconnected manually");
        }
    }

    getConnectionStatus(): Boolean {
        return this.isConneted;
    }
}

export const socketService = SocketService.getInstance();