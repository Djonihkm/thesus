// src/lib/tiptap/use-collaboration-provider.ts
//
// @y-sweet/react fournissait useConnectionStatus/usePresence/usePresenceSetter tout faits ;
// y-partykit/react ne fournit que le provider lui-même (useYProvider). Ces trois hooks
// recréent le même comportement au-dessus des primitives Yjs standard (awareness, et
// l'évènement "status" émis par WebsocketProvider, dont YPartyKitProvider hérite — voir
// provider.d.ts de y-partykit) : rien de spécifique à PartyKit, donc pas de raison qu'ils
// aient à rechanger si le transport change encore un jour.
import { useCallback, useEffect, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import type YPartyKitProvider from "y-partykit/provider";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export function useConnectionStatus(provider: YPartyKitProvider | null): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    if (!provider) return;
    setStatus(provider.wsconnected ? "connected" : "connecting");

    function handleStatus({ status }: { status: string }) {
      setStatus(status as ConnectionStatus);
    }
    provider.on("status", handleStatus);
    return () => provider.off("status", handleStatus);
  }, [provider]);

  return status;
}

export function usePresenceSetter<T extends Record<string, unknown>>(
  awareness: Awareness | null,
): (state: T) => void {
  return useCallback(
    (state: T) => {
      awareness?.setLocalStateField("presence", state);
    },
    [awareness],
  );
}

export function usePresence<T>(awareness: Awareness | null): Map<number, T> {
  const [others, setOthers] = useState<Map<number, T>>(new Map());

  useEffect(() => {
    if (!awareness) return;

    function update() {
      const next = new Map<number, T>();
      awareness!.getStates().forEach((state, clientId) => {
        if (clientId === awareness!.clientID) return;
        const presence = (state as { presence?: T } | undefined)?.presence;
        if (presence) next.set(clientId, presence);
      });
      setOthers(next);
    }

    update();
    awareness.on("change", update);
    return () => awareness.off("change", update);
  }, [awareness]);

  return others;
}
