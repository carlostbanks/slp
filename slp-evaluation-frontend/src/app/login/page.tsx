'use client'

import { useState } from 'react'

interface LoginProps {
  onLoginSuccess: (token: string) => void
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Login failed')
      }

      const data = await response.json()
      const { access_token } = data
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', access_token)
      }
      
      onLoginSuccess(access_token)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-black mb-4">SLP Login Test</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black bg-white"
              placeholder="admin"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black mb-1">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black bg-white"
              placeholder="admin123"
            />
          </div>
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-gray-50 border rounded text-black">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}