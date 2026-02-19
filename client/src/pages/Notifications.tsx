import { useNotifications } from "@/components/NotificationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Trash2, Bell } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function Notifications() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="max-w-3xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Notifications</h1>
        {notifications.some(n => !n.isRead) && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-20" />
              <p>You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors",
                    !notification.isRead && "bg-blue-50/40 dark:bg-blue-900/10"
                  )}
                >
                  <div className={cn(
                    "mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0",
                    !notification.isRead ? "bg-blue-500" : "bg-transparent"
                  )} />
                  
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                    {notification.link && (
                      <Link href={notification.link}>
                        <a className="text-sm text-primary hover:underline mt-1 inline-block">
                          View details
                        </a>
                      </Link>
                    )}
                  </div>
                  
                  {!notification.isRead && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
