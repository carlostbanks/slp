'use client'

import { useState, useEffect } from 'react'

interface StudentInfo {
  firstname: string
  lastname: string
  age_years: number
  age_months: number
  school: string
}

interface SessionStatus {
  session_exists: boolean
  student_name?: string
  age?: string
  school?: string
  oral_uploaded?: boolean
  listening_uploaded?: boolean
  scores_calculated?: boolean
}

interface DashboardProps {
  token: string
  onLogout: () => void
}

export default function Dashboard({ token, onLogout }: DashboardProps) {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>({ session_exists: false })
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    firstname: '',
    lastname: '',
    age_years: 0,
    age_months: 0,
    school: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchSessionStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/evaluation/session-status')
      const data = await response.json()
      setSessionStatus(data)
    } catch (error) {
      console.error('Error fetching session status:', error)
    }
  }

  useEffect(() => {
    fetchSessionStatus()
  }, [])

  const handleStudentInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('http://localhost:8000/api/evaluation/student-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentInfo),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`Student info saved: ${data.message}`)
        await fetchSessionStatus()
      } else {
        setMessage(`Error: ${data.detail}`)
      }
    } catch (error) {
      setMessage(`Network error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File, testType: 'oral' | 'listening') => {
    setLoading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`http://localhost:8000/api/evaluation/upload-worksheet/${testType}`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`${testType} worksheet uploaded: ${data.message}`)
        await fetchSessionStatus()
      } else {
        setMessage(`Error: ${data.detail}`)
      }
    } catch (error) {
      setMessage(`Network error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculateScores = async () => {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('http://localhost:8000/api/evaluation/calculate-scores', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`Scores calculated: LC=${data.listening_scores.standard_score}/${data.listening_scores.percentile_rank}, OE=${data.oral_scores.standard_score}/${data.oral_scores.percentile_rank}, Composite=${data.composite_scores.standard_score}/${data.composite_scores.percentile_rank}`)
        await fetchSessionStatus()
      } else {
        setMessage(`Error: ${data.detail}`)
      }
    } catch (error) {
      setMessage(`Network error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black">SLP Evaluation Dashboard</h1>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Current Session Status */}
        {sessionStatus.session_exists && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-black mb-4">Current Session</h2>
            <p className="text-black"><span className="font-bold">Student:</span> {sessionStatus.student_name}</p>
            <p className="text-black"><span className="font-bold">Age:</span> {sessionStatus.age}</p>
            <p className="text-black"><span className="font-bold">School:</span> {sessionStatus.school}</p>
          </div>
        )}

        {/* Student Info Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-black mb-4">Student Information</h2>
          
          <form onSubmit={handleStudentInfoSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Student Information'}
              </button>
            </div>
          </form>
        </div>

        {/* Upload Sections - Only show if session exists */}
        {sessionStatus.session_exists && (
          <>
            {/* Oral Expression Upload */}
            <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-purple-500">
              <h2 className="text-xl font-semibold text-black mb-4">Oral Expression (Purple Worksheet)</h2>
              
              {!sessionStatus.oral_uploaded ? (
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
                  <div className="text-black">
                    <label htmlFor="oral-upload" className="cursor-pointer">
                      <span className="text-lg font-medium">Upload Documents +</span>
                      <input
                        id="oral-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file, 'oral')
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <p className="text-green-800">✓ Oral Expression worksheet uploaded successfully!</p>
                </div>
              )}
            </div>

            {/* Listening Comprehension Upload */}
            <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-green-500">
              <h2 className="text-xl font-semibold text-black mb-4">Listening Comprehension (Green Worksheet)</h2>
              
              {!sessionStatus.listening_uploaded ? (
                <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center">
                  <div className="text-black">
                    <label htmlFor="listening-upload" className="cursor-pointer">
                      <span className="text-lg font-medium">Upload Documents +</span>
                      <input
                        id="listening-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file, 'listening')
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <p className="text-green-800">✓ Listening Comprehension worksheet uploaded successfully!</p>
                </div>
              )}
            </div>

            {/* Calculate Scores Button */}
            {sessionStatus.oral_uploaded && sessionStatus.listening_uploaded && !sessionStatus.scores_calculated && (
              <div className="bg-white rounded-lg shadow p-6 mb-6 text-center">
                <button
                  onClick={handleCalculateScores}
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-600 text-white text-lg font-medium rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Calculating...' : 'Calculate Scores'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Message Display */}
        {message && (
          <div className="bg-gray-50 border rounded p-4 text-black">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}