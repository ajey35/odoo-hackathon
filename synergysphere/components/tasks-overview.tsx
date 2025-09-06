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
    let filtered = [...tasks]

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
    const total = tasks.length
    const todo = tasks.filter((t) => t.status === "TODO").length
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length
    const done = tasks.filter((t) => t.status === "DONE").length
    const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date()).length

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
          <p className="text-muted-foreground">Track and manage your assigned tasks</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>To Do</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.todo}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.done}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
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
          <SelectTrigger className="w-full sm:w-40">
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

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery || statusFilter !== "all" ? "No tasks found" : "No tasks assigned"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "You don't have any tasks assigned yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleTaskClick(task)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(task.status)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {task.project.name}
                      </Badge>
                      <Badge variant={getStatusColor(task.status) as any} className="text-xs">
                        {task.status.replace("_", " ")}
                      </Badge>
                      {task.dueDate && (
                        <div className={`flex items-center space-x-1 text-xs ${getPriorityColor(task.dueDate)}`}>
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(task.dueDate)}</span>
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
