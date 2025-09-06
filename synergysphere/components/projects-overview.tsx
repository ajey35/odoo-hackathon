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
    console.log("loading",loading);
    
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getProjects()
      console.log("response",response);
      
      setProjects(response.data.projects)
      console.log("projects",response.data.projects);
      
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
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Projects</h1>
            <p className="text-lg text-muted-foreground">Manage and track your team projects</p>
          </div>
          {canCreateProject && (
            <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto h-12 text-base">
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </Button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {projects?.length === 0 ? (
        <div className="w-full bg-card/50 backdrop-blur-sm rounded-lg border p-16 text-center">
          <div className="mx-auto w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mb-6">
            <BarChart3 className="h-16 w-16 text-primary" />
          </div>
          <h3 className="text-2xl font-semibold text-foreground mb-4">No projects yet</h3>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            {canCreateProject
              ? "Create your first project to start collaborating with your team and boost productivity."
              : "You haven't been added to any projects yet. Contact your team lead to get started."}
          </p>
          {canCreateProject && (
            <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="h-12 text-base">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Project
            </Button>
          )}
        </div>
      ) : (
        <div className="w-full grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects?.map((project) => {
            const progress = getProjectProgress(project)
            const isOwner = project.owner.id === user?.id

            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <Card className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-sm">
                          {project.description || "No description provided"}
                        </CardDescription>
                      </div>
                      {isOwner && (
                        <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                          Owner
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Progress</span>
                        <span className="font-semibold text-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-muted" />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">{project._count.teamMemberships}</span>
                        <span className="text-xs">members</span>
                      </div>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <BarChart3 className="h-4 w-4" />
                        <span className="font-medium">{project._count.tasks}</span>
                        <span className="text-xs">tasks</span>
                      </div>
                    </div>

                    {/* Created date */}
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground pt-2 border-t border-border/50">
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
