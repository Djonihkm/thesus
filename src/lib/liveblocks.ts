// src/lib/liveblocks.ts
import { Liveblocks } from "@liveblocks/node";

export const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY ?? "",
});

export function documentRoomId(memoireId: string): string {
  return `memoire-${memoireId}`;
}
