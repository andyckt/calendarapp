"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from './api-client'
import apiClient from './api-client'
import { useRouter } from 'next/navigation'

// Helper function to set a cookie
const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

// Helper function to delete a cookie
const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
}

type AuthContextType = {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Safety check for server-side rendering
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    try {
      // Check if there's a saved token and try to load user
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      
      if (savedToken && savedUser) {
        setToken(savedToken)
        try {
          const parsedUser = JSON.parse(savedUser)
          setUser(parsedUser)
          
          // Also set the cookie in case it's missing
          setCookie('token', savedToken)
        } catch (e) {
          // If parsing fails, clear the stored data
          localStorage.removeItem('user')
          localStorage.removeItem('token')
        }
      }
    } catch (e) {
      console.error('Error accessing localStorage:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await apiClient.auth.login({ email, password })
      setUser(response.user)
      setToken(response.token)
      
      // Save to localStorage
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      // Also set cookie for server-side auth
      setCookie('token', response.token)
      
      // Navigate to home page after successful login
      router.push('/')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await apiClient.auth.register({ name, email, password })
      setUser(response.user)
      setToken(response.token)
      
      // Save to localStorage
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      // Also set cookie for server-side auth
      setCookie('token', response.token)
      
      // Navigate to home page after successful registration
      router.push('/')
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // Clear user and token
    setUser(null)
    setToken(null)
    
    // Remove from localStorage
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } catch (e) {
      console.error('Error accessing localStorage during logout:', e)
    }
    
    // Remove cookie
    deleteCookie('token')
    
    // Redirect to auth page
    router.push('/auth')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 