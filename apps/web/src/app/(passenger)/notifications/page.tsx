"use client";

import { webFirestore } from "@/lib/firebase-client";
import {
  deleteNotification,
  markNotificationRead,
  subscribeMyNotifications,
} from "@the-ride/firebase/client";
import {
  Badge,
  Button,
  EmptyState,
  Heading,
  Illustration,
  LoadingState,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import type { Notification } from "@the-ride/types";
import { useEffect, useMemo, useState } from "react";

function formatDate(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toLocaleString();
  }
  if (value instanceof Date) return value.toLocaleString();
  return "—";
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    return subscribeMyNotifications(webFirestore, session.uid, setNotifications, () =>
      setNotifications([]),
    );
  }, [session]);

  const unread = useMemo(() => (notifications ?? []).filter((n) => !n.isRead), [notifications]);

  async function handleMarkRead(id: string) {
    setBusyId(id);
    try {
      await markNotificationRead(webFirestore, id);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await deleteNotification(webFirestore, id);
    } finally {
      setBusyId(null);
    }
  }

  if (notifications === null) {
    return <LoadingState title={t("common.loading")} />;
  }

  function renderList(items: Notification[]) {
    if (items.length === 0) {
      return (
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={t("notifications.noNotifications")}
        />
      );
    }
    return (
      <ul className="flex flex-col gap-2">
        {items.map((notification) => (
          <li
            key={notification.id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  {notification.title}
                </p>
                {!notification.isRead && <Badge tone="brand">{t("notifications.unread")}</Badge>}
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{notification.body}</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                {formatDate(notification.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              {!notification.isRead && (
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={busyId === notification.id}
                  onClick={() => void handleMarkRead(notification.id)}
                >
                  {t("notifications.markRead")}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                isLoading={busyId === notification.id}
                onClick={() => void handleDelete(notification.id)}
              >
                {t("common.delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("passengerNav.notifications")}</Heading>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">{t("notifications.all")}</TabsTrigger>
          <TabsTrigger value="unread">{t("notifications.unread")}</TabsTrigger>
        </TabsList>
        <TabsContent value="all">{renderList(notifications)}</TabsContent>
        <TabsContent value="unread">{renderList(unread)}</TabsContent>
      </Tabs>
    </div>
  );
}
