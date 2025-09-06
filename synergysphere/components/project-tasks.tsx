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
    <div className="w-full space-y-8">
      {/* Header Section */}
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Tasks</h2>
            <p className="text-muted-foreground">Organize and track project tasks</p>
          </div>
          {canManage && (
            <Button 
              onClick={() => setCreateDialogOpen(true)} 
              className="w-full sm:w-auto h-12 text-base bg-primary hover:bg-primary/90"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Task
            </Button>
          )}
        </div>
      </div>

      {/* Tasks Kanban Board */}
      {tasks?.length === 0 ? (
        <div className="w-full bg-card/50 backdrop-blur-sm rounded-xl border p-16 text-center">
          <div className="mx-auto w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-primary" />
          </div>
          <h3 className="text-2xl font-semibold text-foreground mb-4">No tasks yet</h3>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            {canManage
              ? "Create your first task to start organizing work and collaborating with your team."
              : "No tasks have been created for this project yet."}
          </p>
          {canManage && (
            <Button 
              onClick={() => setCreateDialogOpen(true)} 
              size="lg" 
              className="h-12 text-base bg-primary hover:bg-primary/90"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Task
            </Button>
          )}
        </div>
      ) : (
        <div className="w-full grid gap-6 grid-cols-1 lg:grid-cols-3 full-width-grid">
          {Object.entries(groupedTasks).map(([status, statusTasks]) => {
            const statusConfig = {
              TODO: { 
                title: "To Do", 
                icon: <Clock className="h-5 w-5" />, 
                color: "text-gray-600 dark:text-gray-400",
                bgColor: "bg-gray-50 dark:bg-gray-900/50",
                borderColor: "border-gray-200 dark:border-gray-800"
              },
              IN_PROGRESS: { 
                title: "In Progress", 
                icon: <AlertCircle className="h-5 w-5" />, 
                color: "text-yellow-600 dark:text-yellow-400",
                bgColor: "bg-yellow-50 dark:bg-yellow-900/50",
                borderColor: "border-yellow-200 dark:border-yellow-800"
              },
              DONE: { 
                title: "Done", 
                icon: <CheckCircle className="h-5 w-5" />, 
                color: "text-green-600 dark:text-green-400",
                bgColor: "bg-green-50 dark:bg-green-900/50",
                borderColor: "border-green-200 dark:border-green-800"
              }
            }
            
            const config = statusConfig[status as keyof typeof statusConfig]
            
            return (
              <div key={status} className="space-y-4">
                {/* Column Header */}
                <div className={`${config.bgColor} ${config.borderColor} rounded-lg border p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={config.color}>
                        {config.icon}
                      </div>
                      <h3 className={`font-semibold text-lg ${config.color}`}>
                        {config.title}
                      </h3>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`${config.color} bg-white/50 dark:bg-black/50 font-semibold px-3 py-1`}
                    >
                      {statusTasks?.length || 0}
                    </Badge>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-3 min-h-[200px]">
                  {statusTasks?.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                          {config.icon}
                        </div>
                        <p className="text-sm">No tasks</p>
                      </div>
                    </div>
                  ) : (
                    statusTasks?.map((task) => (
                      <Card 
                        key={task.id} 
                        className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer border-0 shadow-sm bg-card/50 backdrop-blur-sm hover:scale-[1.02]"
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Task Title */}
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-base">
                                {task?.title}
                              </h4>
                              <Badge 
                                variant={getStatusColor(task?.status) as any} 
                                className="text-xs font-medium px-2 py-1 flex-shrink-0"
                              >
                                {task?.status?.replace("_", " ")}
                              </Badge>
                            </div>

                            {/* Task Description */}
                            {task?.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                {task?.description}
                              </p>
                            )}

                            {/* Task Meta */}
                            <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                              {/* Assignee */}
                              <div className="flex items-center space-x-2">
                                {task?.assignee ? (
                                  <>
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                                        {getInitials(task?.assignee?.name || '')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-muted-foreground font-medium">
                                      {task?.assignee?.name}
                                    </span>
                                  </>
                                ) : (
                                  <div className="flex items-center space-x-2 text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span className="text-sm">Unassigned</span>
                                  </div>
                                )}
                              </div>

                              {/* Due Date */}
                              {task?.dueDate && (
                                <div className="flex items-center space-x-1 text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  <span className="text-sm font-medium">
                                    {formatDate(task?.dueDate)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )
          })}
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
