
// API utility functions for SynergySphere
const API_BASE_URL = "http://localhost:3000/api/v1"

function getAuthHeaders() {
  const token = localStorage.getItem("synergy_token")
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export function isAuthenticated() {
  const token = localStorage.getItem("synergy_token")
  const tokenExpiry = localStorage.getItem("synergy_token_expiry")
  
  if (!token || !tokenExpiry) {
    return false
  }
  
  const now = new Date().getTime()
  const expiry = Number.parseInt(tokenExpiry)
  
  return now < expiry
}

export function getAuthToken() {
  return localStorage.getItem("synergy_token")
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  }

  console.log(`Making API request to: ${url}`)
  console.log('Request headers:', headers)
  console.log('Request body:', options.body)

  const response = await fetch(url, {
    ...options,
    headers,
  })

  console.log('Response status:', response.status)
  console.log('Response headers:', Object.fromEntries(response.headers.entries()))

  const data = await response.json()
  console.log('Response data:', data)

  if (!response.ok) {
    throw new Error(data.message || "API request failed")
  }

  return data
}

// Auth API functions
export const authAPI = {
  login: (email: string, password: string) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  getProfile: () => apiRequest("/auth/profile"),

  updateProfile: (data: { name?: string; email?: string }) =>
    apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
}

// Projects API functions
export const projectsAPI = {
  getProjects: (page = 1, limit = 10) => apiRequest(`/projects?page=${page}&limit=${limit}`),

  getProject: (id: string) => apiRequest(`/projects/${id}`),

  createProject: (name: string, description?: string) =>
    apiRequest("/projects", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),

  updateProject: (id: string, data: { name?: string; description?: string }) =>
    apiRequest(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteProject: (id: string) => apiRequest(`/projects/${id}`, { method: "DELETE" }),

  addMember: (projectId: string, email: string, role: string) =>
    apiRequest(`/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }),

  removeMember: (projectId: string, userId: string) =>
    apiRequest(`/projects/${projectId}/members/${userId}`, {
      method: "DELETE",
    }),
}

// Tasks API functions
export const tasksAPI = {
  getTasks: (filters?: {
    projectId?: string
    status?: string
    assignedTo?: string
    page?: number
    limit?: number
  }) => {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return apiRequest(`/tasks?${params.toString()}`)
  },

  getTask: (id: string) => apiRequest(`/tasks/${id}`),

  createTask: (data: {
    title: string
    description?: string
    projectId: string
    assignedTo?: string
    dueDate?: string
  }) => {
    console.log("data in task", data);
    return apiRequest("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateTask: (
    id: string,
    data: {
      title?: string
      description?: string
      status?: string
      assignedTo?: string
      dueDate?: string
    },
  ) =>
    apiRequest(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteTask: (id: string) => apiRequest(`/tasks/${id}`, { method: "DELETE" }),
}

/*// Notifications API functions
export const notificationsAPI = {
  getNotifications: (filters?: { read?: boolean; page?: number; limit?: number }) => {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return apiRequest(`/notifications?${params.toString()}`)
  },

  markAsRead: (notificationId: string) =>
    apiRequest(`/notifications/${notificationId}/read`, {
      method: "PUT",
    }),

  markAllAsRead: () =>
    apiRequest("/notifications/mark-all-read", {
      method: "PUT",
    }),
}
*/
/*// frontend/lib/notifications.ts

export const notificationsAPI = {
  getNotifications: (filters?: { read?: boolean; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    return apiRequest(`/notifications?${params.toString()}`);
  },

  markAsRead: (notificationId: string) =>
    apiRequest(`/notifications/${notificationId}/read`, {
      method: "PUT",
    }),

  markAllAsRead: () =>
    apiRequest("/notifications/mark-all-read", {
      method: "PUT",
    }),
};
*/

// lib/notifications.ts

// lib/api.ts (add this below your existing apiRequest function)

export const notificationsAPI = {
  getNotifications: (filters?: { read?: boolean; page?: number; limit?: number }) => {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString())
      })
    }
    return apiRequest(`/notifications?${params.toString()}`)
  },

  markAsRead: (notificationId: string) =>
    apiRequest(`/notifications/${notificationId}/read`, { method: "PUT" }),

  markAllAsRead: () =>
    apiRequest("/notifications/mark-all-read", { method: "PUT" }),
}
