"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { tasksAPI, projectsAPI } from "@/lib/api"
import { Calendar, User, FolderOpen, Clock, CheckCircle, AlertCircle, Edit, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

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

interface TeamMember {
  user: {
    id: string
    name: string
    email: string
  }
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [task, setTask] = useState<Task | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO")
  const [assignedTo, setAssignedTo] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const taskId = params.id as string

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    loadTask()
  }, [taskId, user])

  const loadTask = async () => {
    try {
      const response = await tasksAPI.getTask(taskId)
      const taskData = response.data
      setTask(taskData)
      setTitle(taskData.title)
      setDescription(taskData.description || "")
      setStatus(taskData.status)
      setAssignedTo(taskData.assignee?.id || "")
      setDueDate(taskData.dueDate ? taskData.dueDate.split("T")[0] : "")

      // Load team members
      const projectResponse = await projectsAPI.getProject(taskData.project.id)
      setTeamMembers(projectResponse.data.teamMemberships)
    } catch (error) {
      console.error("Failed to load task:", error)
      setError("Failed to load task")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setError("")
    setSaving(true)

    try {
      await tasksAPI.updateTask(taskId, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined,
      })
      await loadTask() // Reload to get updated data
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message || "Failed to update task")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setStatus(task.status)
      setAssignedTo(task.assignee?.id || "")
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "")
    }
    setIsEditing(false)
    setError("")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "TODO":
        return <Clock className="h-5 w-5 text-muted-foreground" />
      case "IN_PROGRESS":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "DONE":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
          <div className="h-96 bg-muted rounded animate-pulse"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !task) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">Task not found</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link href="/dashboard/tasks">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  if (!task) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/tasks">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tasks
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Task Details</h1>
              <p className="text-muted-foreground">View and manage task information</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)} disabled={saving}>
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? "Cancel Edit" : "Edit Task"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
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

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="task-description">Description</Label>
                  {isEditing ? (
                    <Textarea
                      id="task-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter task description"
                      rows={6}
                    />
                  ) : (
                    <div className="min-h-[120px] p-3 border rounded-md bg-muted/30">
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {task.description || "No description provided"}
                      </p>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex space-x-2 pt-4">
                    <Button onClick={handleSave} disabled={saving || !title.trim()}>
                      {saving ? (
                        "Saving..."
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} disabled={saving} className="bg-transparent">
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Link href={`/dashboard/projects/${task.project.id}`}>
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground hover:text-primary">{task.project.name}</span>
                    </div>
                  </Link>
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
                    <div className="flex items-center space-x-2 p-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(task.assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium text-foreground">{task.assignee.name}</div>
                        <div className="text-xs text-muted-foreground">{task.assignee.email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 p-2 text-muted-foreground">
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
                    <div className="flex items-center space-x-2 p-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{formatDate(task.dueDate)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 p-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>No due date</span>
                    </div>
                  )}
                </div>

                {/* Created Date */}
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground">Created on {formatDate(task.createdAt)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
