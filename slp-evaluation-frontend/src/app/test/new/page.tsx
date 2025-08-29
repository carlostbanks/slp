'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface StudentInfo {
  firstname: string
  lastname: string
  age_years: number
  age_months: number
  school: string
}

export default function NewTestPage() {
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    firstname: '',
    lastname: '',
    age_years: 0,
    age_months: 0,
    school: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:8000/api/evaluation/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ student_info: studentInfo }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/test/${data.evaluation_id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to create evaluation')
      }
    } catch (error) {
      setError('Network error creating evaluation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-indigo-600 hover:text-indigo-900"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-black mb-6">New Evaluation</h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">First Name</label>
                <input
                  type="text"
                  value={studentInfo.firstname}
                  onChange={(e) => setStudentInfo({...studentInfo, firstname: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Last Name</label>
                <input
                  type="text"
                  value={studentInfo.lastname}
                  onChange={(e) => setStudentInfo({...studentInfo, lastname: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Age (Years)</label>
                <input
                  type="number"
                  value={studentInfo.age_years}
                  onChange={(e) => setStudentInfo({...studentInfo, age_years: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                  min="0"
                  max="22"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Age (Months)</label>
                <input
                  type="number"
                  value={studentInfo.age_months}
                  onChange={(e) => setStudentInfo({...studentInfo, age_months: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                  min="0"
                  max="11"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black mb-1">School</label>
                <input
                  type="text"
                  value={studentInfo.school}
                  onChange={(e) => setStudentInfo({...studentInfo, school: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Evaluation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}