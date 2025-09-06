"use client"

import { useAuth } from "@/components/auth-provider"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProjectsOverview } from "@/components/projects-overview"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  console.log("Dashboard - user:", user)
  console.log("Dashboard - loading:", loading)

  useEffect(() => {
    console.log("Dashboard useEffect - user:", user, "loading:", loading)
    if (!loading && !user) {
      console.log("No user found, redirecting to login")
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <ProjectsOverview />
    </DashboardLayout>
  )
}
