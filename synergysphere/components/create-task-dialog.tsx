"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { tasksAPI, projectsAPI } from "@/lib/api"

interface CreateTaskDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated: () => void
}

interface TeamMember {
  user: {
    id: string
    name: string
    email: string
  }
}

export function CreateTaskDialog({ projectId, open, onOpenChange, onTaskCreated }: CreateTaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      loadTeamMembers()
    }
  }, [open, projectId])

  const loadTeamMembers = async () => {
    try {
      const response = await projectsAPI.getProject(projectId)
      console.log("Project response:", response)
      const members = response?.data?.teamMemberships || response?.teamMemberships || []
      setTeamMembers(members)
    } catch (error) {
      console.error("Failed to load team members:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log("Creating task with data:", {
        title: title.trim(),
        description: description.trim() || undefined,
        projectId: projectId,
        assignedTo: assignedTo && assignedTo !== "unassigned" ? assignedTo : undefined,
        dueDate: dueDate || undefined,
      })
      console.log("Project ID being used:", projectId)
      
      const response = await tasksAPI.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        projectId,
        assignedTo: assignedTo && assignedTo !== "unassigned" ? assignedTo : undefined,
        dueDate: dueDate || undefined,
      })
      
      console.log("Task creation response:", response)
      onTaskCreated()
      handleClose()
    } catch (err: any) {
      console.error("Task creation error:", err)
      setError(err.message || "Failed to create task")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setTitle("")
    setDescription("")
    setAssignedTo("")
    setDueDate("")
    setError("")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Add a new task to organize work and assign team members.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description (Optional)</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-assignee">Assignee (Optional)</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.user.id} value={member.user.id}>
                    {member.user.name} ({member.user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-due-date">Due Date (Optional)</Label>
            <Input id="task-due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading || !title.trim()} className="flex-1">
              {loading ? "Creating..." : "Create Task"}
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
