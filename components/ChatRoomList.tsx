"use client";

import { useState, type FormEvent } from "react";
import type { ChatRoom } from "@/types/chat";
import { ChatRoomItem } from "@/components/ChatRoomItem";

type Props = {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  onSelectRoom: (id: string) => void;
  onCreateRoom: (otherUserId: number) => void | Promise<void>;
  loading?: boolean;
  createLoading?: boolean;
  error?: string | null;
};

export function ChatRoomList({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onCreateRoom,
  loading,
  createLoading,
  error,
}: Props) {
  const [otherUserId, setOtherUserId] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = Number(otherUserId);
    if (!Number.isInteger(parsed) || parsed <= 0) return;
    void onCreateRoom(parsed);
    setOtherUserId("");
  };

  return (
    <aside className="flex h-full w-full max-w-[280px] shrink-0 flex-col border-r border-black/10 bg-white">
      <div className="border-b border-black/10 bg-[#513736] px-3 py-3 text-sm font-semibold text-white">채팅</div>
      <form onSubmit={onSubmit} className="border-b border-black/10 bg-white px-3 py-3">
        <p className="mb-2 text-[11px] font-medium text-neutral-600">새 채팅 시작 (상대 userId)</p>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={otherUserId}
            onChange={(e) => setOtherUserId(e.target.value)}
            className="w-full rounded-md border border-black/15 px-2 py-1.5 text-xs outline-none focus:border-[#4A6FA5]"
            placeholder="예: 2"
          />
          <button
            type="submit"
            disabled={createLoading || !otherUserId.trim()}
            className="shrink-0 rounded-md bg-[#FEE500] px-3 py-1.5 text-xs font-semibold text-neutral-900 disabled:opacity-50"
          >
            생성
          </button>
        </div>
      </form>
      <div className="flex-1 overflow-y-auto">
        {loading && <p className="px-3 py-4 text-center text-xs text-neutral-500">불러오는 중…</p>}
        {error && <p className="px-3 py-2 text-xs text-red-600">{error}</p>}
        {!loading && !error && rooms.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-neutral-500">채팅방이 없습니다. 새 채팅을 시작해보세요.</p>
        )}
        {rooms.map((room) => (
          <ChatRoomItem
            key={room.id}
            room={room}
            selected={selectedRoomId === room.id}
            onSelect={onSelectRoom}
          />
        ))}
      </div>
    </aside>
  );
}
