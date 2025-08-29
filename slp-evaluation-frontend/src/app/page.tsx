'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Login from './login/page'
import Dashboard from './dashboard/page'

export default function App() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (savedToken) {
      verifyToken(savedToken)
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Handle routing after token is verified
    if (!loading && token && pathname === '/') {
      router.push('/dashboard')
    }
  }, [loading, token, pathname, router])

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
        },
      })

      if (response.ok) {
        setToken(tokenToVerify)
      } else {
        localStorage.removeItem('token')
        setToken(null)
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      localStorage.removeItem('token')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken)
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    setToken(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  if (pathname === '/dashboard') {
    return <Dashboard token={token} onLogout={handleLogout} />
  }

  return null
}