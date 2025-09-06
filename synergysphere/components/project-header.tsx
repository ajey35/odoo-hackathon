"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EditProjectDialog } from "@/components/edit-project-dialog"
import { Users, Calendar, BarChart3, Edit } from "lucide-react"

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

interface ProjectHeaderProps {
  project: Project
  canManage: boolean
  onProjectUpdated: () => void
}

export function ProjectHeader({ project, canManage, onProjectUpdated }: ProjectHeaderProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  // Mock progress calculation
  const progress = Math.floor(Math.random() * 100)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <Badge variant="outline">Active</Badge>
          </div>
          {project.description && <p className="text-lg text-muted-foreground max-w-2xl">{project.description}</p>}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{project._count.teamMemberships} members</span>
            </div>
            <div className="flex items-center space-x-1">
              <BarChart3 className="h-4 w-4" />
              <span>{project._count.tasks} tasks</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Created {formatDate(project.createdAt)}</span>
            </div>
          </div>
        </div>

        {canManage && (
          <Button onClick={() => setEditDialogOpen(true)} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Project
          </Button>
        )}
      </div>

      {/* Progress Section */}
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-foreground">Project Progress</h3>
          <span className="text-sm font-medium text-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">
          {progress < 30
            ? "Just getting started"
            : progress < 70
              ? "Making good progress"
              : progress < 90
                ? "Almost there"
                : "Nearly complete"}
        </p>
      </div>

      <EditProjectDialog
        project={project}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onProjectUpdated={onProjectUpdated}
      />
    </div>
  )
}
