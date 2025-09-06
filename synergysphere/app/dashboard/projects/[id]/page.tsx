"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProjectHeader } from "@/components/project-header"
import { ProjectTasks } from "@/components/project-tasks"
import { ProjectMembers } from "@/components/project-members"
import { ProjectSettings } from "@/components/project-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { projectsAPI } from "@/lib/api"

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
      role: string
    }
    role: string
  }>
  _count: {
    tasks: number
    teamMemberships: number
  }
  createdAt: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const projectId = params.id as string

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const response = await projectsAPI.getProject(projectId)
      setProject(response.data)
    } catch (err: any) {
      setError(err.message || "Failed to load project")
    } finally {
      setLoading(false)
    }
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

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">Project not found</h2>
          <p className="text-muted-foreground">{error || "The project you're looking for doesn't exist."}</p>
        </div>
      </DashboardLayout>
    )
  }

  const isOwner = project.owner.id === user?.id
  const isAdmin = project.teamMemberships.find((m) => m.user.id === user?.id)?.role === "ADMIN"
  const canManage = isOwner || isAdmin

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <ProjectHeader project={project} canManage={canManage} onProjectUpdated={loadProject} />

        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            {canManage && <TabsTrigger value="settings">Settings</TabsTrigger>}
          </TabsList>

          <TabsContent value="tasks">
            <ProjectTasks projectId={projectId} canManage={canManage} />
          </TabsContent>

          <TabsContent value="members">
            <ProjectMembers project={project} canManage={canManage} onMembersUpdated={loadProject} />
          </TabsContent>

          {canManage && (
            <TabsContent value="settings">
              <ProjectSettings project={project} onProjectUpdated={loadProject} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
