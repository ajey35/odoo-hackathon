"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TaskDetailDialog } from "@/components/task-detail-dialog"
import { tasksAPI } from "@/lib/api"
import { Search, Calendar, Clock, CheckCircle, AlertCircle, Filter, SortAsc } from "lucide-react"

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

export function TasksOverview() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("dueDate")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)

  useEffect(() => {
    loadTasks()
  }, [])

  useEffect(() => {
    filterAndSortTasks()
  }, [tasks, searchQuery, statusFilter, sortBy])

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getTasks({ assignedTo: user?.id })
      setTasks(response.data.tasks)
    } catch (error) {
      console.error("Failed to load tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortTasks = () => {
    let filtered = [...(tasks || [])]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case "status":
          const statusOrder = { TODO: 0, IN_PROGRESS: 1, DONE: 2 }
          return statusOrder[a.status] - statusOrder[b.status]
        case "project":
          return a.project.name.localeCompare(b.project.name)
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

    setFilteredTasks(filtered)
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

  const getPriorityColor = (dueDate?: string) => {
    if (!dueDate) return "text-muted-foreground"

    const due = new Date(dueDate)
    const now = new Date()
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "text-red-500" // Overdue
    if (diffDays <= 1) return "text-orange-500" // Due soon
    if (diffDays <= 3) return "text-yellow-500" // Due this week
    return "text-muted-foreground" // Normal
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day(s)`
    if (diffDays === 0) return "Due today"
    if (diffDays === 1) return "Due tomorrow"
    return `Due in ${diffDays} day(s)`
  }

  const getTaskStats = () => {
    const total = tasks?.length
    const todo = tasks?.filter((t) => t.status === "TODO").length
    const inProgress = tasks?.filter((t) => t.status === "IN_PROGRESS").length
    const done = tasks?.filter((t) => t.status === "DONE").length
    const overdue = tasks?.filter((t) => t.dueDate && new Date(t.dueDate) < new Date()).length

    return { total, todo, inProgress, done, overdue }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setTaskDetailOpen(true)
  }

  const handleTaskUpdated = () => {
    loadTasks()
  }

  const stats = getTaskStats()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
            <p className="text-muted-foreground">Track and manage your assigned tasks</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="w-full">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">My Tasks</h1>
          <p className="text-lg text-muted-foreground">Track and manage your assigned tasks</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="w-full grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-600 dark:text-blue-400 font-medium">Total Tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20 border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400 font-medium">To Do</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.todo}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-yellow-600 dark:text-yellow-400 font-medium">In Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-600 dark:text-gree n-400 font-medium">Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.done}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-red-600 dark:text-red-400 font-medium">Overdue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="w-full bg-card/50 backdrop-blur-sm rounded-lg border p-6">
        <div className="flex flex-col lg:flex-row gap-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-12 text-base"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 lg:flex-shrink-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-12">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="DONE">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48 h-12">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="created">Created</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="w-full">
        {filteredTasks?.length === 0 ? (
          <div className="w-full bg-card/50 backdrop-blur-sm rounded-lg border p-12 text-center">
            <div className="mx-auto w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              {searchQuery || statusFilter !== "all" ? "No tasks found" : "No tasks assigned"}
            </h3>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters to find what you're looking for."
                : "You don't have any tasks assigned yet. Check back later or ask your team lead for assignments."}
            </p>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {filteredTasks?.map((task) => (
              <Card
                key={task.id}
                className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer border-0 shadow-sm bg-card/50 backdrop-blur-sm w-full"
                onClick={() => handleTaskClick(task)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-lg">
                            {task.title}
                          </h3>
                          {task?.description && (
                            <p className="text-muted-foreground line-clamp-2 mt-2">{task.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <Badge variant="outline" className="text-xs font-medium px-3 py-1">
                          {task?.project?.name}
                        </Badge>
                        <Badge variant={getStatusColor(task?.status) as any} className="text-xs font-medium px-3 py-1">
                          {task?.status.replace("_", " ")}
                        </Badge>
                        {task?.dueDate && (
                          <div className={`flex items-center space-x-1 text-sm font-medium ${getPriorityColor(task?.dueDate)}`}>
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(task?.dueDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Task Detail Dialog */}
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={taskDetailOpen}
          onOpenChange={setTaskDetailOpen}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </div>
  )
}
