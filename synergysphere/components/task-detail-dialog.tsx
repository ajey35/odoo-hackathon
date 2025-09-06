"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { tasksAPI, projectsAPI } from "@/lib/api"
import { Calendar, User, FolderOpen, Clock, CheckCircle, AlertCircle, Edit, Save, X } from "lucide-react"

interface Task {
  id: string
  title: string
  description?: string
  status: "TODO" | "IN_PROGRESS" | "DONE"
  dueDate?: string
  project: {
    id: string
    name: string
  }
  assignee?: {
    id: string
    name: string
    email: string
  }
  createdAt: string
}

interface TaskDetailDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated: () => void
}

interface TeamMember {
  user: {
    id: string
    name: string
    email: string
  }
}

export function TaskDetailDialog({ task, open, onOpenChange, onTaskUpdated }: TaskDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "")
  const [status, setStatus] = useState(task.status)
  const [assignedTo, setAssignedTo] = useState(task.assignee?.id || "")
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.split("T")[0] : "")
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      loadTeamMembers()
      // Reset form when task changes
      setTitle(task.title)
      setDescription(task.description || "")
      setStatus(task.status)
      setAssignedTo(task.assignee?.id || "")
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "")
      setIsEditing(false)
      setError("")
    }
  }, [open, task])

  const loadTeamMembers = async () => {
    try {
      const response = await projectsAPI.getProject(task.project.id)
      setTeamMembers(response.data.teamMemberships)
    } catch (error) {
      console.error("Failed to load team members:", error)
    }
  }

  const handleSave = async () => {
    setError("")
    setLoading(true)

    try {
      await tasksAPI.updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined,
      })
      onTaskUpdated()
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message || "Failed to update task")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setTitle(task.title)
    setDescription(task.description || "")
    setStatus(task.status)
    setAssignedTo(task.assignee?.id || "")
    setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "")
    setIsEditing(false)
    setError("")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "TODO":
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case "IN_PROGRESS":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "DONE":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "secondary"
      case "IN_PROGRESS":
        return "default"
      case "DONE":
        return "outline"
      default:
        return "secondary"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl">Task Details</DialogTitle>
              <DialogDescription>View and manage task information</DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} disabled={loading}>
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            {isEditing ? (
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
              />
            ) : (
              <h2 className="text-lg font-semibold text-foreground">{task.title}</h2>
            )}
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            {isEditing ? (
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                rows={4}
              />
            ) : (
              <p className="text-muted-foreground">{task.description || "No description provided"}</p>
            )}
          </div>

          <Separator />

          {/* Task Metadata */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              {isEditing ? (
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center space-x-2">
                  {getStatusIcon(task.status)}
                  <Badge variant={getStatusColor(task.status) as any}>{task.status.replace("_", " ")}</Badge>
                </div>
              )}
            </div>

            {/* Project */}
            <div className="space-y-2">
              <Label>Project</Label>
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{task.project.name}</span>
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <Label>Assignee</Label>
              {isEditing ? (
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user.id} value={member.user.id}>
                        {member.user.name} ({member.user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : task.assignee ? (
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(task.assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground">{task.assignee.name}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Unassigned</span>
                </div>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date</Label>
              {isEditing ? (
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              ) : task.dueDate ? (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{formatDate(task.dueDate)}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>No due date</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Created Date */}
          <div className="text-sm text-muted-foreground">Created on {formatDate(task.createdAt)}</div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSave} disabled={loading || !title.trim()} className="flex-1">
                {loading ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={loading} className="flex-1 bg-transparent">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
