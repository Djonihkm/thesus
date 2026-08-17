// src/components/dashboard/NotificationsBell.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/notifications";

interface NotificationItem {
  id: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  unreadCount: number;
  items: NotificationItem[];
}

interface NotificationsBellProps {
  initialUnreadCount: number;
}

const POLL_INTERVAL_MS = 30000;

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function NotificationsBell({ initialUnreadCount }: NotificationsBellProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) return;
      const data: NotificationsResponse = await response.json();
      setUnreadCount(data.unreadCount);
      setItems(data.items);
    } catch {
      // Échec silencieux : le prochain cycle de polling réessaiera.
    }
  }, []);

  useEffect(() => {
    // Fetch au montage puis polling régulier — pas de source "externe" à s'abonner ici,
    // juste un rafraîchissement périodique volontaire, cas d'usage hors du champ de la règle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(item: NotificationItem) {
    if (!item.isRead) {
      setItems((current) => current.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      setUnreadCount((count) => Math.max(0, count - 1));
      markNotificationReadAction(item.id);
    }
    setIsOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  }

  async function handleMarkAllRead() {
    setIsMarkingAll(true);
    setItems((current) => current.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsReadAction();
    setIsMarkingAll(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-label="Notifications"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-neutral hover:text-ink"
      >
        <Bell size={17} strokeWidth={1.8} />
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-flag ring-2 ring-surface-light" />
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border-neutral bg-surface-light shadow-lg shadow-ink/10">
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <p className="text-sm font-medium text-ink">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="text-xs font-medium text-accent-dark transition hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                Tout marquer comme lu
              </button>
            ) : null}
          </div>

          <div className="my-1 h-px bg-border-neutral" />

          <div className="max-h-96 overflow-y-auto py-1">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">Aucune notification.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`flex w-full flex-col gap-1 px-3.5 py-2.5 text-left transition hover:bg-surface-neutral ${
                    item.isRead ? "" : "bg-accent/5"
                  }`}
                >
                  <span className="flex items-start gap-2">
                    {!item.isRead ? (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-dark" />
                    ) : null}
                    <span className="text-sm text-ink">{item.message}</span>
                  </span>
                  <span className="pl-3.5 text-xs text-ink-muted">
                    {dateFormatter.format(new Date(item.createdAt))}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
