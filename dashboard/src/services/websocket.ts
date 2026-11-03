const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/dashboard';

export type SocketMessage = {
  type?: string;
  event_type?: string;
  event?: string;
  topic?: string;
  experiment_id?: string;
  step_id?: string;
  device_id?: string;
  status?: string;
  payload?: Record<string, unknown>;
  data?: Record<string, unknown>;
  timestamp?: string;
  [key: string]: unknown;
};

export interface SocketClientOptions {
  onMessage?: (message: SocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
  autoReconnect?: boolean;
}

export class MissionControlSocket {
  private url: string;
  private ws: WebSocket | null = null;
  private options: SocketClientOptions;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 15;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isDestroyed = false;

  constructor(url: string = WS_URL, options: SocketClientOptions = {}) {
    this.url = url;
    this.options = { autoReconnect: true, ...options };
    this.connect();
  }

  private connect() {
    if (this.isDestroyed) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.options.onOpen?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data as string) as SocketMessage;
          this.options.onMessage?.(parsed);
        } catch {
          this.options.onMessage?.({ type: 'raw', payload: { value: event.data } });
        }
      };

      this.ws.onerror = (err) => {
        this.options.onError?.(err);
      };

      this.ws.onclose = () => {
        this.options.onClose?.();
        if (this.options.autoReconnect && !this.isDestroyed) {
          this.scheduleReconnect();
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Periodic background retry
      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts = 0;
        this.connect();
      }, 10000);
      return;
    }

    const backoff = Math.min(1000 * Math.pow(1.4, this.reconnectAttempts), 8000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => this.connect(), backoff);
  }

  public send(data: Record<string, unknown> | string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }

  public disconnect() {
    this.isDestroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export function createSocketClient(onMessage: (message: SocketMessage) => void) {
  return new MissionControlSocket(WS_URL, { onMessage });
}
