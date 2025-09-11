"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { notificationsAPI } from "@/lib/api"
import { Search, Check, X, Bell, Loader2 } from "lucide-react"

interface Notification {
  id: string
  type: "TASK_ASSIGNED" | "TASK_UPDATED" | "PROJECT_INVITATION" | "DEADLINE_APPROACHING" | "NEW_MESSAGE"
  message: string
  read: boolean
  createdAt: string
}

interface NotificationsPanelProps {
  onClose: () => void
}

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null)
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false)

  // Load notifications on mount
  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications({ limit: 50 })
      setNotifications(response.notifications)
    } catch (error) {
      console.error("Failed to load notifications:", error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const filteredNotifications = notifications.filter((n) =>
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const markAsRead = async (id: string) => {
    if (markingAsRead) return
    setMarkingAsRead(id)
    try {
      await notificationsAPI.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    } finally {
      setMarkingAsRead(null)
    }
  }

  const markAllAsRead = async () => {
    if (markingAllAsRead) return
    setMarkingAllAsRead(true)
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    } finally {
      setMarkingAllAsRead(false)
    }
  }

  const formatTime = (dateString: string) => {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000 / 60)
    if (diff < 1) return "Just now"
    if (diff < 60) return `${diff}m ago`
    if (diff < 60 * 24) return `${Math.floor(diff / 60)}h ago`
    return `${Math.floor(diff / (60 * 24))}d ago`
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNED": return "📋"
      case "TASK_UPDATED": return "✏️"
      case "PROJECT_INVITATION": return "👥"
      case "DEADLINE_APPROACHING": return "⏰"
      case "NEW_MESSAGE": return "💬"
      default: return "📢"
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Card className="absolute right-0 top-full mt-2 w-96 z-50 border-border/50 bg-card/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
            {unreadCount > 0 && <Badge variant="secondary" className="text-xs">{unreadCount}</Badge>}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={markingAllAsRead || unreadCount === 0}>
              {markingAllAsRead ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Mark all read
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-80">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-1 p-3">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No notifications found" : "No notifications"}
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div key={n.id} className={`p-3 rounded-lg border transition-colors ${n.read ? "bg-muted/30 border-border/50" : "bg-card border-border hover:bg-muted/50"}`}>
                    <div className="flex items-start space-x-3">
                      <div className="text-lg flex-shrink-0">{getNotificationIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.read ? "text-muted-foreground" : "text-foreground"}`}>{n.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">{formatTime(n.createdAt)}</span>
                          {!n.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => markAsRead(n.id)}
                              disabled={markingAsRead === n.id}
                            >
                              {markingAsRead === n.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark read"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
