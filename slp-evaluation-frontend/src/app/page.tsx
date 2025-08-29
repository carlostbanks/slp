'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Login from './login/page'

export default function HomePage() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    console.log('Checking saved token:', savedToken)
    
    if (savedToken) {
      setToken(savedToken)
      console.log('Token found, redirecting to dashboard')
      router.push('/dashboard')
    } else {
      setLoading(false)
    }
  }, [])

  const handleLoginSuccess = (newToken: string) => {
    console.log('Login successful, setting token and redirecting')
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', newToken)
    }
    setToken(newToken)
    router.push('/dashboard')
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

  return <Login onLoginSuccess={handleLoginSuccess} />
}