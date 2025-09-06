"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem("synergy_token")
    const userData = localStorage.getItem("synergy_user")
    const tokenExpiry = localStorage.getItem("synergy_token_expiry")

    if (token && userData && tokenExpiry) {
      const now = new Date().getTime()
      const expiry = Number.parseInt(tokenExpiry)

      if (now < expiry) {
        setUser(JSON.parse(userData))
      } else {
        // Token expired, clear storage
        localStorage.removeItem("synergy_token")
        localStorage.removeItem("synergy_user")
        localStorage.removeItem("synergy_token_expiry")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      const { user: userData, accessToken } = data.data
      const expiryTime = new Date().getTime() + 60 * 60 * 1000 // 1 hour

      // Store in localStorage
      localStorage.setItem("synergy_token", accessToken)
      localStorage.setItem("synergy_user", JSON.stringify(userData))
      localStorage.setItem("synergy_token_expiry", expiryTime.toString())

      setUser(userData)
      router.push("/dashboard")
    } catch (error) {
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch("http://localhost:3000/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Registration failed")
      }

      const { user: userData, accessToken } = data.data
      const expiryTime = new Date().getTime() + 60 * 60 * 1000 // 1 hour

      // Store in localStorage
      localStorage.setItem("synergy_token", accessToken)
      localStorage.setItem("synergy_user", JSON.stringify(userData))
      localStorage.setItem("synergy_token_expiry", expiryTime.toString())

      setUser(userData)
      router.push("/dashboard")
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("synergy_token")
    localStorage.removeItem("synergy_user")
    localStorage.removeItem("synergy_token_expiry")
    setUser(null)
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
