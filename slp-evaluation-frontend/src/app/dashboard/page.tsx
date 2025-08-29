'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Evaluation {
  id: number
  student_name: string
  school: string
  date: string
  status: string
}

export default function DashboardPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const fetchEvaluations = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch('http://localhost:8000/api/evaluation/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setEvaluations(data)
      } else if (response.status === 401) {
        localStorage.removeItem('token')
        router.push('/')
        return
      } else {
        setError('Failed to load evaluations')
      }
    } catch (error) {
      setError('Network error loading evaluations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvaluations()
  }, [])

  const handleNewTest = () => {
    router.push('/test/new')
  }

  const handleOpenTest = (evaluationId: number) => {
    router.push(`/test/${evaluationId}`)
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    router.push('/')
  }

  const formatStatus = (status: string) => {
    return status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-12">
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-6xl font-bold text-black">SLP Evaluation Dashboard</h1>
          <div className="flex space-x-6">
            <button
              onClick={handleNewTest}
              className="px-12 py-6 bg-green-600 text-white text-3xl font-bold rounded-lg hover:bg-green-700 shadow-lg"
            >
              + New Test
            </button>
            <button
              onClick={handleLogout}
              className="px-8 py-6 bg-red-600 text-white text-2xl font-bold rounded-lg hover:bg-red-700 shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border-2 border-red-400 text-red-700 px-8 py-6 rounded-lg text-2xl">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-12 py-8 text-left text-2xl font-bold text-gray-700 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-12 py-8 text-left text-2xl font-bold text-gray-700 uppercase tracking-wider">
                  School
                </th>
                <th className="px-12 py-8 text-left text-2xl font-bold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-12 py-8 text-left text-2xl font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-12 py-8 text-left text-2xl font-bold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y-2 divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-24">
                    <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-indigo-600 mx-auto"></div>
                    <p className="mt-8 text-gray-500 text-3xl">Loading evaluations...</p>
                  </td>
                </tr>
              ) : evaluations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-24">
                    <p className="text-gray-500 text-3xl">No evaluations found. Click "New Test" to get started.</p>
                  </td>
                </tr>
              ) : (
                evaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="hover:bg-gray-50">
                    <td className="px-12 py-8 whitespace-nowrap text-2xl font-semibold text-gray-900">
                      {evaluation.student_name}
                    </td>
                    <td className="px-12 py-8 whitespace-nowrap text-2xl text-gray-700">
                      {evaluation.school}
                    </td>
                    <td className="px-12 py-8 whitespace-nowrap text-2xl text-gray-700">
                      {evaluation.date}
                    </td>
                    <td className="px-12 py-8 whitespace-nowrap">
                      <span className={`px-6 py-3 inline-flex text-lg leading-6 font-bold rounded-full ${
                        evaluation.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {formatStatus(evaluation.status)}
                      </span>
                    </td>
                    <td className="px-12 py-8 whitespace-nowrap text-2xl font-semibold">
                      <button
                        onClick={() => handleOpenTest(evaluation.id)}
                        className="text-indigo-600 hover:text-indigo-900 text-2xl font-bold"
                      >
                        {evaluation.status === 'completed' ? 'View' : 'Continue'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}