"use client"

import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const breadcrumbs = [{ name: "Dashboard", href: "/dashboard", icon: Home }]

  // Add dynamic breadcrumbs based on path
  if (segments.includes("tasks")) {
    breadcrumbs.push({ name: "My Tasks", href: "/dashboard/tasks" })
  }
  if (segments.includes("projects") && segments.length > 2) {
    breadcrumbs.push({ name: "Projects", href: "/dashboard/projects" })
  }

  return (
    <nav className="flex items-center space-x-2 text-sm">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1
        const Icon = item.icon

        return (
          <div key={item.href} className="flex items-center space-x-2">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <Link
              href={item.href}
              className={`flex items-center space-x-1 ${
                isLast ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground transition-colors"
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{item.name}</span>
            </Link>
          </div>
        )
      })}
    </nav>
  )
}
