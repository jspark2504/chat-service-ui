"use client";

import type { ChatMessage } from "@/types/chat";
import { MessageList } from "@/components/MessageList";
import { MessageInput } from "@/components/MessageInput";

type Props = {
  roomTitle: string | null;
  messages: ChatMessage[];
  selfId: string | null;
  connected: boolean;
  socketError: string | null;
  onSend: (text: string) => void;
};

export function ChatWindow({ roomTitle, messages, selfId, connected, socketError, onSend }: Props) {
  const hasRoom = Boolean(roomTitle);

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-white">
      <header className="flex items-center justify-between border-b border-black/10 bg-[#513736] px-4 py-3 text-sm font-semibold text-white">
        <span className="truncate">{roomTitle ?? "채팅방을 선택하세요"}</span>
        {hasRoom && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${connected ? "bg-emerald-500/20 text-emerald-100" : "bg-white/10 text-white/80"}`}>
            {connected ? "연결됨" : "연결 중…"}
          </span>
        )}
      </header>

      {socketError && (
        <div className="border-b border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{socketError}</div>
      )}

      {!hasRoom ? (
        <div className="flex flex-1 items-center justify-center bg-[#B2C7D9] text-sm text-neutral-600">왼쪽에서 채팅방을 선택하세요.</div>
      ) : (
        <>
          <MessageList messages={messages} selfId={selfId} />
          <MessageInput onSend={onSend} disabled={!connected} />
        </>
      )}
    </section>
  );
}
