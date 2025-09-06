"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { projectsAPI } from "@/lib/api"

interface AddMemberDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onMemberAdded: () => void
}

export function AddMemberDialog({ projectId, open, onOpenChange, onMemberAdded }: AddMemberDialogProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("MEMBER")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await projectsAPI.addMember(projectId, email.trim(), role)
      onMemberAdded()
      handleClose()
    } catch (err: any) {
      setError(err.message || "Failed to add member")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setEmail("")
    setRole("MEMBER")
    setError("")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>Invite a new member to join this project by their email address.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="member-email">Email Address</Label>
            <Input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter team member's email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading || !email.trim()} className="flex-1">
              {loading ? "Adding..." : "Add Member"}
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
