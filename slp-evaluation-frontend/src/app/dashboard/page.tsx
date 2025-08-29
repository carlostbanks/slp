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

interface DashboardProps {
  token: string
  onLogout: () => void
}

export default function Dashboard({ token, onLogout }: DashboardProps) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const fetchEvaluations = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/evaluation/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setEvaluations(data)
      } else {
        setError('Failed to load evaluations')
      }
    } catch (error) {
      setError('Network error loading evaluations')
    }
  }

  useEffect(() => {
    fetchEvaluations()
  }, [token])

  const handleNewTest = () => {
    router.push('/test/new')
  }

  const handleOpenTest = (evaluationId: number) => {
    router.push(`/test/${evaluationId}`)
  }

  const handleLogout = () => {
    onLogout()
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black">SLP Evaluation Dashboard</h1>
          <div className="flex space-x-4">
            <button
              onClick={handleNewTest}
              className="px-6 py-3 bg-green-600 text-white text-lg font-medium rounded hover:bg-green-700"
            >
              + New Test
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {evaluations.map((evaluation) => (
                <tr key={evaluation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {evaluation.student_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {evaluation.school}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {evaluation.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      evaluation.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {evaluation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleOpenTest(evaluation.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {evaluation.status === 'completed' ? 'View' : 'Continue'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {evaluations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No evaluations found. Click "New Test" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}