"use client"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { projectsAPI } from "@/lib/api"
import { Plus, Users, Calendar, BarChart3 } from "lucide-react"
import Link from "next/link"

interface Project {
  id: string
  name: string
  description?: string
  owner: {
    id: string
    name: string
    email: string
  }
  teamMemberships: Array<{
    user: {
      id: string
      name: string
      email: string
    }
    role: string
  }>
  _count: {
    tasks: number
    teamMemberships: number
  }
  createdAt: string
}

export function ProjectsOverview() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const canCreateProject = user?.role === "ADMIN" || user?.role === "USER" // Assuming all users can create projects

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getProjects()
      setProjects(response.data.projects)
    } catch (error) {
      console.error("Failed to load projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getProjectProgress = (project: Project) => {
    // Mock progress calculation - in real app, this would be based on completed tasks
    return Math.floor(Math.random() * 100)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground">Manage and track your team projects</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground">Manage and track your team projects</p>
        </div>
        {canCreateProject && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              {canCreateProject
                ? "Create your first project to start collaborating with your team."
                : "You haven't been added to any projects yet."}
            </p>
            {canCreateProject && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const progress = getProjectProgress(project)
            const isOwner = project.owner.id === user?.id

            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {project.description || "No description provided"}
                        </CardDescription>
                      </div>
                      {isOwner && (
                        <Badge variant="secondary" className="text-xs">
                          Owner
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{project._count.teamMemberships} members</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="h-4 w-4" />
                        <span>{project._count.tasks} tasks</span>
                      </div>
                    </div>

                    {/* Created date */}
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Created {formatDate(project.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onProjectCreated={loadProjects} />
    </div>
  )
}
