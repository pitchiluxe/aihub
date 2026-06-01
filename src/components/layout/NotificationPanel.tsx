"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NewsArticle } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Bell, X, ExternalLink, Sparkles, Newspaper,
  AlertCircle, CheckCheck, Trash2,
} from "lucide-react";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  interface Notification {
    id: string;
    title: string;
    source: string;
    url: string;
    time: string;
    read: boolean;
    type: "breaking" | "news" | "model" | "research";
  }

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/news?limit=12", { cache: "no-store" });
      const data = await res.json();
      const articles: NewsArticle[] = data.articles ?? [];
      const notifs: Notification[] = articles.slice(0, 10).map((a) => ({
        id: a.id,
        title: a.title,
        source: a.source,
        url: a.url,
        time: a.publishedAt,
        read: false,
        type: a.isBreaking ? "breaking" : "news",
      }));
      setNotifications(notifs);
      setUnread(notifs.filter((n) => !n.read).length);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnread((prev) => Math.max(0, prev - 1));
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnread((prev) => Math.max(0, prev - 1));
  }

  const iconColor: Record<string, string> = {
    breaking: "text-red-500",
    news: "text-blue-500",
    model: "text-violet-500",
    research: "text-green-500",
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) loadNotifications();
        }}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
            className="absolute right-0 top-10 z-50 w-96 rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">AI Alerts</span>
                {unread > 0 && (
                  <span className="rounded-full bg-primary/10 text-primary text-xs px-1.5 py-0.5 font-medium">
                    {unread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
                >
                  <CheckCheck className="h-3 w-3" />
                  All read
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[440px] overflow-y-auto">
              {loading ? (
                <div className="space-y-0">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3 px-4 py-3 border-b border-border">
                      <div className="h-4 w-4 rounded-full bg-muted animate-pulse flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-muted animate-pulse rounded w-full" />
                        <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`group flex items-start gap-3 px-4 py-3 border-b border-border transition-colors hover:bg-accent/50 ${
                        !notif.read ? "bg-primary/3" : ""
                      }`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 ${iconColor[notif.type]}`}>
                        {notif.type === "breaking" ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <Newspaper className="h-4 w-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs leading-snug line-clamp-2 ${
                            !notif.read ? "font-medium" : "text-muted-foreground"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{notif.source}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{formatDate(notif.time)}</span>
                          {!notif.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <a
                          href={notif.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markRead(notif.id)}
                          className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <button
                          onClick={() => dismiss(notif.id)}
                          className="p-1 rounded hover:bg-background text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" />
                Powered by live AI RSS feeds · Updates every 5 min
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
