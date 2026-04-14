"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "@/types/chat";
import { buildChatWebSocketUrl, createChatWebSocket, type ChatSocketController } from "@/lib/websocket";
import { getToken } from "@/lib/api";

function normalizeIncomingMessage(data: unknown): ChatMessage | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const type = typeof o.type === "string" ? o.type : "";
  if (type && type !== "CHAT") return null;
  const roomId = o.chatRoomId != null ? String(o.chatRoomId) : o.roomId != null ? String(o.roomId) : "";
  const senderId = o.senderId != null ? String(o.senderId) : "";
  const content = typeof o.content === "string" ? o.content : "";
  if (!roomId || !senderId) return null;
  return {
    id: typeof o.messageId === "number" ? o.messageId : typeof o.id === "number" ? o.id : undefined,
    roomId,
    senderId,
    content,
    timestamp: typeof o.timestamp === "string" ? o.timestamp : undefined,
  };
}

export function useChat(roomId: string, senderId: string, initialMessages: ChatMessage[]) {
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);
  const controllerRef = useRef<ChatSocketController | null>(null);
  const initialMessageIdsRef = useRef<Set<number>>(new Set());
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);

  const sortMessages = useCallback((list: ChatMessage[]) => {
    return [...list].sort((a, b) => {
      const ta = a.timestamp ? Date.parse(a.timestamp) : Number.NaN;
      const tb = b.timestamp ? Date.parse(b.timestamp) : Number.NaN;
      const va = Number.isNaN(ta) ? Number.MAX_SAFE_INTEGER : ta;
      const vb = Number.isNaN(tb) ? Number.MAX_SAFE_INTEGER : tb;
      if (va !== vb) return va - vb;
      const ia = typeof a.id === "number" ? a.id : Number.MAX_SAFE_INTEGER;
      const ib = typeof b.id === "number" ? b.id : Number.MAX_SAFE_INTEGER;
      return ia - ib;
    });
  }, []);

  useEffect(() => {
    initialMessageIdsRef.current = new Set(
      initialMessages.filter((m) => typeof m.id === "number").map((m) => m.id as number),
    );
  }, [initialMessages]);

  const messages = useMemo(
    () => sortMessages([...initialMessages, ...liveMessages]),
    [initialMessages, liveMessages, sortMessages],
  );

  useEffect(() => {
    reconnectAttemptRef.current = 0;
    let disposed = false;
    const connect = () => {
      const token = getToken();
      if (!token) {
        setSocketError("로그인이 필요합니다.");
        return;
      }
      const ctrl = createChatWebSocket(buildChatWebSocketUrl(token), {
        onOpen: () => {
          if (disposed) return;
          reconnectAttemptRef.current = 0;
          setConnected(true);
          setSocketError(null);
        },
        onClose: () => {
          if (disposed) return;
          setConnected(false);
          const attempt = reconnectAttemptRef.current + 1;
          reconnectAttemptRef.current = attempt;
          const delay = Math.min(1000 * 2 ** (attempt - 1), 10000);
          setSocketError(`연결이 끊겼습니다. ${Math.round(delay / 1000)}초 후 재연결합니다.`);
          reconnectTimerRef.current = window.setTimeout(connect, delay);
        },
        onError: () => {
          if (disposed) return;
          setSocketError("WebSocket 연결 오류");
        },
        onMessage: (data) => {
          const msg = normalizeIncomingMessage(data);
          if (!msg || msg.roomId !== roomId) return;
          setLiveMessages((prev) => {
            if (typeof msg.id === "number") {
              if (initialMessageIdsRef.current.has(msg.id)) return prev;
              if (prev.some((m) => m.id === msg.id)) return prev;
            }
            return [...prev, msg];
          });
        },
      });
      controllerRef.current = ctrl;
    };
    connect();

    return () => {
      disposed = true;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      const ctrl = controllerRef.current;
      ctrl?.close();
      controllerRef.current = null;
    };
  }, [roomId, senderId]);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const payload: ChatMessage = { roomId, senderId, content: trimmed };
      const ctrl = controllerRef.current;
      if (!ctrl || ctrl.getReadyState() !== WebSocket.OPEN) {
        setSocketError("연결이 끊어졌습니다. 잠시 후 다시 시도하세요.");
        return;
      }

      ctrl.send({
        type: "CHAT",
        chatRoomId: Number(payload.roomId),
        content: payload.content,
      });
    },
    [roomId, senderId],
  );

  return { messages, connected, socketError, sendMessage };
}
