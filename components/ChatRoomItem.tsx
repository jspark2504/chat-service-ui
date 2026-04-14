"use client";

import type { ChatRoom } from "@/types/chat";

type Props = {
  room: ChatRoom;
  selected: boolean;
  onSelect: (id: string) => void;
};

export function ChatRoomItem({ room, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(room.id)}
      className={`flex w-full items-center gap-2 border-b border-black/5 px-3 py-3 text-left text-sm transition-colors hover:bg-black/[0.03] ${
        selected ? "bg-[#E8F4FE]" : "bg-white"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B2C7D9] text-xs font-semibold text-white">
        {room.title.slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium text-neutral-900">{room.title}</span>
    </button>
  );
}
