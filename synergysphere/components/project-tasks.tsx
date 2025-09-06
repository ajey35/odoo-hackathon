"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { tasksAPI } from "@/lib/api"
import { Plus, Calendar, User, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface Task {
  id: string
  title: string
  description?: string
  status: "TODO" | "IN_PROGRESS" | "DONE"
  dueDate?: string
  assignee?: {
    id: string
    name: string
    email: string
  }
  createdAt: string
}

interface ProjectTasksProps {
  projectId: string
  canManage: boolean
}

export function ProjectTasks({ projectId, canManage }: ProjectTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  console.log("ProjectTasks received projectId:", projectId)

  useEffect(() => {
    loadTasks()
  }, [projectId])

  const loadTasks = async () => {
    try {
      console.log("Loading tasks for project:", projectId);
      
      const response = await tasksAPI.getTasks({ projectId })
      console.log("Tasks API response:", response);
      
      const tasks =  response?.data || []
      console.log("Extracted tasks:", tasks);
      
      setTasks(tasks)
    } catch (error) {
      console.error("Failed to load tasks:", error)
    } finally {
      setLoading(false)
    }
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
      month: "short",
      day: "numeric",
    })
  }

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      ?.map((n) => n?.[0])
      ?.join("")
      ?.toUpperCase() || ''
  }

  const groupedTasks = {
    TODO: tasks?.filter((t) => t?.status === "TODO") || [],
    IN_PROGRESS: tasks?.filter((t) => t?.status === "IN_PROGRESS") || [],
    DONE: tasks?.filter((t) => t?.status === "DONE") || [],
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tasks</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-16 bg-muted rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Tasks</h2>
        {canManage && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        )}
      </div>

      {tasks?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No tasks yet</h3>
            <p className="text-muted-foreground mb-4">
              {canManage
                ? "Create your first task to start organizing work."
                : "No tasks have been created for this project yet."}
            </p>
            {canManage && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {Object.entries(groupedTasks).map(([status, statusTasks]) => (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getStatusIcon(status)}
                  <span className="capitalize">{status.replace("_", " ").toLowerCase()}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {statusTasks?.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">   
                {statusTasks?.map((task) => (
                  <Card key={task.id} className="p-3 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm text-foreground line-clamp-2">{task?.title}</h4>
                        <Badge variant={getStatusColor(task?.status) as any} className="text-xs ml-2 flex-shrink-0">
                          {task?.status?.replace("_", " ")}
                        </Badge>
                      </div>

                      {task?.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{task?.description}</p>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        {task?.assignee ? (
                          <div className="flex items-center space-x-1">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {getInitials(task?.assignee?.name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground">{task?.assignee?.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>Unassigned</span>
                          </div>
                        )}

                        {task?.dueDate && (
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(task?.dueDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTaskDialog
        projectId={projectId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onTaskCreated={loadTasks}
      />
    </div>
  )
}
