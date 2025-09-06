"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { projectsAPI } from "@/lib/api"

interface Project {
  id: string
  name: string
  description?: string
}

interface EditProjectDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectUpdated: () => void
}

export function EditProjectDialog({ project, open, onOpenChange, onProjectUpdated }: EditProjectDialogProps) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await projectsAPI.updateProject(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      })
      onProjectUpdated()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Failed to update project")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setName(project.name)
    setDescription(project.description || "")
    setError("")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update your project details and settings.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-project-name">Project Name</Label>
            <Input
              id="edit-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-project-description">Description</Label>
            <Textarea
              id="edit-project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project..."
              rows={3}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading || !name.trim()} className="flex-1">
              {loading ? "Updating..." : "Update Project"}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
