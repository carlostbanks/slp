'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface StudentInfo {
  firstname: string
  lastname: string
  age_years: number
  age_months: number
  school: string
}

interface Task {
  id: number
  item: string
  category: string
  task_description: string
  response: string
}

export default function NewTestPage() {
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    firstname: '',
    lastname: '',
    age_years: 0,
    age_months: 0,
    school: ''
  })
  const [evaluationId, setEvaluationId] = useState<number | null>(null)
  const [oralTasks, setOralTasks] = useState<Task[]>([])
  const [listeningTasks, setListeningTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [oralExpanded, setOralExpanded] = useState(false)
  const [listeningExpanded, setListeningExpanded] = useState(false)
  const router = useRouter()

  const handleStudentInfoSave = async () => {
    if (!studentInfo.firstname || !studentInfo.lastname || !studentInfo.school) {
      setError('Please fill in all student information fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/evaluation/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ student_info: studentInfo }),
      })

      if (response.ok) {
        const data = await response.json()
        setEvaluationId(data.evaluation_id)
        await loadTasks(data.evaluation_id)
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

  const loadTasks = async (evalId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/evaluation/test/${evalId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOralTasks(data.oral_tasks)
        setListeningTasks(data.listening_tasks)
      }
    } catch (error) {
      console.error('Failed to load tasks')
    }
  }

  const handleResponseChange = async (taskId: number, response: string) => {
    if (!evaluationId) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:8000/api/evaluation/test/${evaluationId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_id: taskId,
          response: response
        }),
      })

      if (res.ok) {
        setOralTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, response } : task
        ))
        setListeningTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, response } : task
        ))
      }
    } catch (error) {
      setError('Failed to save response')
    }
  }

  const handleCalculate = async () => {
    if (!evaluationId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/evaluation/test/${evaluationId}/calculate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        router.push(`/test/${evaluationId}`)
      } else {
        setError('Failed to calculate scores')
      }
    } catch (error) {
      setError('Network error calculating scores')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-full mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-indigo-600 hover:text-indigo-900 text-xl"
          >
            ← Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-6 py-4 rounded text-lg">
            {error}
          </div>
        )}

        {/* Student Info Section - Compact */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-black mb-6">New OWLS-II Evaluation</h1>
              
              <div className="grid grid-cols-5 gap-6 items-end">
                <div className="col-span-2">
                  <label className="block text-xl font-medium text-black mb-2">Student Name</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="First"
                      value={studentInfo.firstname}
                      onChange={(e) => setStudentInfo({...studentInfo, firstname: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded text-black bg-white text-lg"
                      disabled={!!evaluationId}
                    />
                    <input
                      type="text"
                      placeholder="Last"
                      value={studentInfo.lastname}
                      onChange={(e) => setStudentInfo({...studentInfo, lastname: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded text-black bg-white text-lg"
                      disabled={!!evaluationId}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xl font-medium text-black mb-2">Age</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Y"
                      value={studentInfo.age_years}
                      onChange={(e) => setStudentInfo({...studentInfo, age_years: parseInt(e.target.value) || 0})}
                      className="w-full p-3 border border-gray-300 rounded text-black bg-white text-lg"
                      min="0"
                      max="22"
                      disabled={!!evaluationId}
                    />
                    <input
                      type="number"
                      placeholder="M"
                      value={studentInfo.age_months}
                      onChange={(e) => setStudentInfo({...studentInfo, age_months: parseInt(e.target.value) || 0})}
                      className="w-full p-3 border border-gray-300 rounded text-black bg-white text-lg"
                      min="0"
                      max="11"
                      disabled={!!evaluationId}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xl font-medium text-black mb-2">School</label>
                  <input
                    type="text"
                    value={studentInfo.school}
                    onChange={(e) => setStudentInfo({...studentInfo, school: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded text-black bg-white text-lg"
                    disabled={!!evaluationId}
                  />
                </div>
              </div>
            </div>

            {!evaluationId && (
              <div className="ml-8">
                <button
                  onClick={handleStudentInfoSave}
                  disabled={loading}
                  className="px-8 py-4 bg-blue-600 text-white text-2xl font-bold rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Start Evaluation'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Test Sections */}
        {evaluationId && (
          <>
            {/* Oral Expression Test */}
            <div className="bg-white rounded-lg shadow mb-8 border-l-8 border-purple-500">
              <div 
                className="px-8 py-6 cursor-pointer flex justify-between items-center"
                onClick={() => setOralExpanded(!oralExpanded)}
              >
                <h2 className="text-3xl font-semibold text-black">Oral Expression Test</h2>
                <div className="text-4xl text-black font-bold">
                  {oralExpanded ? '−' : '+'}
                </div>
              </div>
              
              {oralExpanded && (
                <div className="px-8 pb-8">
                  <table className="w-full text-lg">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left py-4 px-4 font-bold text-black text-xl">Correct</th>
                        <th className="text-left py-4 px-4 font-bold text-black text-xl">Incorrect</th>
                        <th className="text-left py-4 px-4 font-bold text-black text-xl">Item</th>
                        <th className="text-left py-4 px-4 font-bold text-black text-xl">Category</th>
                        <th className="text-left py-4 px-4 font-bold text-black text-xl">Task</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oralTasks.map((task, index) => (
                        <tr key={task.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b`}>
                          <td className="py-4 px-4">
                            <input
                              type="radio"
                              name={`task-${task.id}`}
                              value="correct"
                              checked={task.response === 'correct'}
                              onChange={(e) => handleResponseChange(task.id, e.target.value)}
                              className="w-6 h-6"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <input
                              type="radio"
                              name={`task-${task.id}`}
                              value="incorrect"
                              checked={task.response === 'incorrect'}
                              onChange={(e) => handleResponseChange(task.id, e.target.value)}
                              className="w-6 h-6"
                            />
                          </td>
                          <td className="py-4 px-4 font-bold text-black text-xl">{task.item}</td>
                          <td className="py-4 px-4 text-gray-700 text-lg">{task.category}</td>
                          <td className="py-4 px-4 text-black text-lg">{task.task_description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Listening Comprehension Test */}
            <div className="bg-white rounded-lg shadow mb-8 border-l-8 border-green-500">
              <div 
                className="px-8 py-6 cursor-pointer flex justify-between items-center"
                onClick={() => setListeningExpanded(!listeningExpanded)}
              >
                <h2 className="text-3xl font-semibold text-black">Listening Comprehension Test</h2>
                <div className="text-4xl text-black font-bold">
                  {listeningExpanded ? '−' : '+'}
                </div>
              </div>
              
              {listeningExpanded && (
                <div className="px-8 pb-8">
                  <table className="w-full text-lg">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left py-4 px-4 font-bold text-black text-xl">Correct</th>
                        <th className="text-left py-4 px-4 font-bold text-black text-xl">Incorrect</th>
                        <th className="text-left py-4 px-4 font-bold text-black text-xl">Item</th>
                        <th className="text-left py-4 px-4 font-bold text-black text-xl">Category</th>
                        <th className="text-left py-4 px-4 font-bold text-black text-xl">Task</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listeningTasks.map((task, index) => (
                        <tr key={task.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b`}>
                          <td className="py-4 px-4">
                            <input
                              type="radio"
                              name={`task-${task.id}`}
                              value="correct"
                              checked={task.response === 'correct'}
                              onChange={(e) => handleResponseChange(task.id, e.target.value)}
                              className="w-6 h-6"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <input
                              type="radio"
                              name={`task-${task.id}`}
                              value="incorrect"
                              checked={task.response === 'incorrect'}
                              onChange={(e) => handleResponseChange(task.id, e.target.value)}
                              className="w-6 h-6"
                            />
                          </td>
                          <td className="py-4 px-4 font-bold text-black text-xl">{task.item}</td>
                          <td className="py-4 px-4 text-gray-700 text-lg">{task.category}</td>
                          <td className="py-4 px-4 text-black text-lg">{task.task_description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Fixed right-side buttons */}
            <div className="fixed top-1/2 right-8 transform -translate-y-1/2 z-50">
              <div className="flex flex-col space-y-4">
                <button
                  onClick={handleCalculate}
                  disabled={loading}
                  className="px-8 py-4 bg-indigo-600 text-white text-xl font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-xl"
                >
                  Calculate Scores
                </button>
                
                <button
                  onClick={handleCalculate}
                  disabled={loading}
                  className="px-8 py-4 bg-orange-600 text-white text-xl font-bold rounded-lg hover:bg-orange-700 disabled:opacity-50 shadow-xl"
                >
                  End Test
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}