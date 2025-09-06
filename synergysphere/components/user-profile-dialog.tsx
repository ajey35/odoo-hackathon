"use client"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authAPI } from "@/lib/api"
import { LogOut, User, Mail, Shield, Bell, Loader2, CheckCircle } from "lucide-react"

interface UserProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  const { user, logout } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [taskNotifications, setTaskNotifications] = useState(true)
  const [projectNotifications, setProjectNotifications] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (open && user) {
      setName(user.name)
      setEmail(user.email)
      setError("")
      setSuccess("")
    }
  }, [open, user])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleSave = async () => {
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const updateData: { name?: string; email?: string } = {}

      if (name.trim() !== user?.name) {
        updateData.name = name.trim()
      }

      if (email.trim() !== user?.email) {
        updateData.email = email.trim()
      }

      if (Object.keys(updateData).length > 0) {
        await authAPI.updateProfile(updateData)
        setSuccess("Profile updated successfully!")

        // Update local storage with new user data
        const currentUser = JSON.parse(localStorage.getItem("synergy_user") || "{}")
        const updatedUser = { ...currentUser, ...updateData }
        localStorage.setItem("synergy_user", JSON.stringify(updatedUser))

        // Force a page refresh to update the auth context
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setSuccess("No changes to save")
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    onOpenChange(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    setError("")
    setSuccess("")
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>Manage your account settings and preferences.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Profile Picture */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {user ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-foreground">{user?.name}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex items-center space-x-1 mt-1">
                <Shield className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Profile Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">
                <User className="h-4 w-4 inline mr-2" />
                Full Name
              </Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">
                <Mail className="h-4 w-4 inline mr-2" />
                Email Address
              </Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
          </div>

          <Separator />

          {/* Notification Preferences */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <h4 className="font-medium text-foreground">Notification Preferences</h4>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} disabled={loading} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive browser push notifications</p>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} disabled={loading} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Task Updates</Label>
                  <p className="text-xs text-muted-foreground">Notifications for task assignments and updates</p>
                </div>
                <Switch checked={taskNotifications} onCheckedChange={setTaskNotifications} disabled={loading} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Project Updates</Label>
                  <p className="text-xs text-muted-foreground">Notifications for project invitations and updates</p>
                </div>
                <Switch checked={projectNotifications} onCheckedChange={setProjectNotifications} disabled={loading} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2">
              <Button onClick={handleSave} className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent" disabled={loading}>
                Cancel
              </Button>
            </div>
            <Button variant="destructive" onClick={handleLogout} className="w-full" disabled={loading}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
