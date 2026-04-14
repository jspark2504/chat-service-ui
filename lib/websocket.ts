export type ChatSocketHandlers = {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
  onMessage?: (data: unknown) => void;
};

export type ChatSocketController = {
  send: (payload: Record<string, string | number>) => void;
  close: () => void;
  getReadyState: () => number;
};

export function createChatWebSocket(url: string, handlers: ChatSocketHandlers): ChatSocketController {
  const socket = new WebSocket(url);

  socket.onopen = () => handlers.onOpen?.();
  socket.onclose = () => handlers.onClose?.();
  socket.onerror = (event) => handlers.onError?.(event);
  socket.onmessage = (event) => {
    try {
      const parsed: unknown = JSON.parse(event.data as string);
      handlers.onMessage?.(parsed);
    } catch {
      handlers.onMessage?.(event.data);
    }
  };

  return {
    send(payload) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
      }
    },
    close() {
      socket.close();
    },
    getReadyState() {
      return socket.readyState;
    },
  };
}

export function getDefaultChatWebSocketUrl(): string {
  return process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws/chat";
}

export function buildChatWebSocketUrl(token: string): string {
  const base = getDefaultChatWebSocketUrl();
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}token=${encodeURIComponent(token)}`;
}
