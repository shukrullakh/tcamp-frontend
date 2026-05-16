import { createContext, useContext, useState, ReactNode } from "react";

export type NotificationType = "like" | "reply" | "answer";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: Date;
  link: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (type: NotificationType, message: string, link: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "like",
      message: "Someone liked your question about React Hooks",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      link: "/question/1"
    },
    {
      id: "2",
      type: "answer",
      message: "John Doe answered your question",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      link: "/question/1"
    }
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const addNotification = (type: NotificationType, message: string, link: string) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      isRead: false,
      createdAt: new Date(),
      link
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
