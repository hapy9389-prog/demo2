"use client";

import { Character } from "@/types";

export function CharacterSwitcher({
  characters,
  activeCharacterId,
  onSelect,
}: {
  characters: Character[];
  activeCharacterId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-3">
      {characters.map((c) => {
        const active = c.id === activeCharacterId;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            <span className="text-base leading-none">{c.emoji}</span>
            <span>{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}
