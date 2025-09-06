"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AddMemberDialog } from "@/components/add-member-dialog"
import { projectsAPI } from "@/lib/api"
import { Plus, Mail, Crown, Shield, User, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Project {
  id: string
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
}

interface ProjectMembersProps {
  project: Project
  canManage: boolean
  onMembersUpdated: () => void
}

export function ProjectMembers({ project, canManage, onMembersUpdated }: ProjectMembersProps) {
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [removingMember, setRemovingMember] = useState<string | null>(null)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="h-4 w-4 text-yellow-500" />
      case "ADMIN":
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "default"
      case "ADMIN":
        return "secondary"
      default:
        return "outline"
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!canManage) return

    setRemovingMember(userId)
    try {
      await projectsAPI.removeMember(project.id, userId)
      onMembersUpdated()
    } catch (error) {
      console.error("Failed to remove member:", error)
    } finally {
      setRemovingMember(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Team Members</h2>
          <p className="text-muted-foreground">Manage project team and permissions</p>
        </div>
        {canManage && (
          <Button onClick={() => setAddMemberDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {project.teamMemberships.map((membership) => {
          const isOwner = membership.role === "OWNER"
          const canRemove = canManage && !isOwner && membership.user.id !== project.owner.id

          return (
            <Card key={membership.user.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(membership.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle className="text-base">{membership.user.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getRoleColor(membership.role) as any} className="text-xs">
                          <span className="flex items-center space-x-1">
                            {getRoleIcon(membership.role)}
                            <span>{membership.role}</span>
                          </span>
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {canRemove && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(membership.user.id)}
                          disabled={removingMember === membership.user.id}
                          className="text-destructive"
                        >
                          {removingMember === membership.user.id ? "Removing..." : "Remove from project"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{membership.user.email}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AddMemberDialog
        projectId={project.id}
        open={addMemberDialogOpen}
        onOpenChange={setAddMemberDialogOpen}
        onMemberAdded={onMembersUpdated}
      />
    </div>
  )
}
