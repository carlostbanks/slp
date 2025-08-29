'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Task {
  id: number
  item: string
  category: string
  task_description: string
  response: string
}

interface EvaluationData {
  id: number
  student_name: string
  age: string
  school: string
  status: string
}

interface TestData {
  evaluation: EvaluationData
  oral_tasks: Task[]
  listening_tasks: Task[]
}

interface ScoreResults {
  student_age: string
  lc_scores: {
    lc_raw_score: number
    lc_standard_score: number
    lc_percentile_rank: string
  }
  oe_scores: {
    oe_raw_score: number
    oe_standard_score: number
    oe_percentile_rank: string
  }
  composite_scores: {
    lc_standard_score: number
    oe_standard_score: number
    sum_standard_scores: number
    composite_standard_score: number
    composite_percentile_rank: string
  }
}

export default function TestPage() {
  const [testData, setTestData] = useState<TestData | null>(null)
  const [scores, setScores] = useState<ScoreResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [oralExpanded, setOralExpanded] = useState(true)
  const [listeningExpanded, setListeningExpanded] = useState(true)
  const [undoStack, setUndoStack] = useState<{taskId: number, oldResponse: string}[]>([])
  const [copiedItems, setCopiedItems] = useState<{[key: string]: boolean}>({})
  const router = useRouter()
  const params = useParams()
  const evaluationId = params.id

  const fetchTestData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch(`http://localhost:8000/api/evaluation/test/${evaluationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.status === 401) {
        router.push('/')
        return
      }

      if (response.ok) {
        const data = await response.json()
        setTestData(data)
        
        // If test is completed, fetch scores
        if (data.evaluation.status === 'completed') {
          const scoresResponse = await fetch(`http://localhost:8000/api/evaluation/test/${evaluationId}/calculate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
          if (scoresResponse.ok) {
            const scoresData = await scoresResponse.json()
            setScores(scoresData)
          }
        }
      } else {
        setError('Failed to load test data')
      }
    } catch (error) {
      setError('Network error loading test data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (evaluationId) {
      fetchTestData()
    }
  }, [evaluationId])

  const handleResponseChange = async (taskId: number, response: string) => {
    // Don't allow changes if test is completed
    if (testData?.evaluation.status === 'completed') {
      return
    }

    setSaving(true)
    
    // Store old response for undo
    const task = [...(testData?.oral_tasks || []), ...(testData?.listening_tasks || [])]
      .find(t => t.id === taskId)
    if (task) {
      setUndoStack(prev => [...prev, { taskId, oldResponse: task.response }])
    }
    
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
        setTestData(prev => {
          if (!prev) return prev
          
          return {
            ...prev,
            oral_tasks: prev.oral_tasks.map(task => 
              task.id === taskId ? { ...task, response } : task
            ),
            listening_tasks: prev.listening_tasks.map(task => 
              task.id === taskId ? { ...task, response } : task
            )
          }
        })
      } else {
        setError('Failed to save response')
      }
    } catch (error) {
      setError('Network error saving response')
    } finally {
      setSaving(false)
    }
  }

  const copyIndividualItem = async (text: string, itemKey: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedItems(prev => ({...prev, [itemKey]: true}))
    // Reset checkmark after 2 seconds
    setTimeout(() => {
        setCopiedItems(prev => ({...prev, [itemKey]: false}))
    }, 2000)
    }

  const handleUndo = async () => {
    if (undoStack.length === 0) return

    const lastChange = undoStack[undoStack.length - 1]
    setUndoStack(prev => prev.slice(0, -1))

    await handleResponseChange(lastChange.taskId, lastChange.oldResponse)
  }

  const handleCalculate = async () => {
    setCalculating(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/evaluation/test/${evaluationId}/calculate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setScores(data)
        // Refresh test data to update status
        await fetchTestData()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to calculate scores')
      }
    } catch (error) {
      setError('Network error calculating scores')
    } finally {
      setCalculating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-2xl">Loading test...</p>
        </div>
      </div>
    )
  }

  if (!testData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-2xl">Failed to load test data</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-6 py-3 bg-blue-600 text-white text-xl rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const isCompleted = testData.evaluation.status === 'completed'

  return (
    <div className="min-h-screen bg-gray-100 p-6 pb-32">
      <div className="max-w-full mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-indigo-600 hover:text-indigo-900 text-xl"
          >
            ← Back to Dashboard
          </button>
          
          {!isCompleted && undoStack.length > 0 && (
            <button
              onClick={handleUndo}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Undo Last Change
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-6 py-4 rounded text-lg">
            {error}
          </div>
        )}

        {/* Student Info */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h1 className="text-4xl font-bold text-black mb-6">OWLS-II Evaluation {isCompleted && '(Completed)'}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-black text-2xl">
            <div><strong>Student:</strong> {testData.evaluation.student_name}</div>
            <div><strong>Age:</strong> {testData.evaluation.age}</div>
            <div><strong>School:</strong> {testData.evaluation.school}</div>
          </div>
        </div>

        {/* Results Display */}
        {scores && (
  <div className="bg-white rounded-lg shadow p-8 mb-8">
    <h3 className="text-3xl font-bold text-black mb-6">Test Results</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      <div className="bg-green-50 p-6 rounded-lg border">
        <h4 className="font-bold text-green-800 mb-4 text-2xl">Listening Comprehension</h4>
        <p className="text-gray-600 text-lg mb-4">Table A1 - Age: {scores.student_age}, Raw Score: {scores.lc_scores.lc_raw_score}</p>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-black text-xl">Raw Score: {scores.lc_scores.lc_raw_score}</span>
            <button
              onClick={() => copyIndividualItem(scores.lc_scores.lc_raw_score.toString(), 'lc_raw')}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
            >
              {copiedItems['lc_raw'] ? '✓' : 'Copy'}
            </button>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-black text-xl">Standard Score: {scores.lc_scores.lc_standard_score}</span>
            <button
              onClick={() => copyIndividualItem(scores.lc_scores.lc_standard_score.toString(), 'lc_ss')}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
            >
              {copiedItems['lc_ss'] ? '✓' : 'Copy'}
            </button>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-black text-xl">Percentile Rank: {scores.lc_scores.lc_percentile_rank}</span>
            <button
              onClick={() => copyIndividualItem(scores.lc_scores.lc_percentile_rank, 'lc_pr')}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
            >
              {copiedItems['lc_pr'] ? '✓' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 p-6 rounded-lg border">
        <h4 className="font-bold text-purple-800 mb-4 text-2xl">Oral Expression</h4>
        <p className="text-gray-600 text-lg mb-4">Table A1 - Age: {scores.student_age}, Raw Score: {scores.oe_scores.oe_raw_score}</p>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-black text-xl">Raw Score: {scores.oe_scores.oe_raw_score}</span>
            <button
              onClick={() => copyIndividualItem(scores.oe_scores.oe_raw_score.toString(), 'oe_raw')}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center"
            >
              {copiedItems['oe_raw'] ? '✓' : 'Copy'}
            </button>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-black text-xl">Standard Score: {scores.oe_scores.oe_standard_score}</span>
            <button
              onClick={() => copyIndividualItem(scores.oe_scores.oe_standard_score.toString(), 'oe_ss')}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center"
            >
              {copiedItems['oe_ss'] ? '✓' : 'Copy'}
            </button>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-black text-xl">Percentile Rank: {scores.oe_scores.oe_percentile_rank}</span>
            <button
              onClick={() => copyIndividualItem(scores.oe_scores.oe_percentile_rank, 'oe_pr')}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center"
            >
              {copiedItems['oe_pr'] ? '✓' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border">
        <h4 className="font-bold text-gray-800 mb-4 text-2xl">Oral Language Composite</h4>
        <p className="text-gray-600 text-lg mb-4">Table A2 - Sum of LC and OE Standard Scores: {scores.composite_scores.sum_standard_scores}</p>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-black text-xl">Sum: {scores.composite_scores.sum_standard_scores}</span>
            <button
              onClick={() => copyIndividualItem(scores.composite_scores.sum_standard_scores.toString(), 'comp_sum')}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center"
            >
              {copiedItems['comp_sum'] ? '✓' : 'Copy'}
            </button>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-black text-xl">Standard Score: {scores.composite_scores.composite_standard_score}</span>
            <button
              onClick={() => copyIndividualItem(scores.composite_scores.composite_standard_score.toString(), 'comp_ss')}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center"
            >
              {copiedItems['comp_ss'] ? '✓' : 'Copy'}
            </button>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-black text-xl">Percentile Rank: {scores.composite_scores.composite_percentile_rank}</span>
            <button
              onClick={() => copyIndividualItem(scores.composite_scores.composite_percentile_rank, 'comp_pr')}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center"
            >
              {copiedItems['comp_pr'] ? '✓' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-blue-50 p-6 rounded-lg border">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-blue-800 text-2xl">Summary of Evaluation</h4>
        <button
          onClick={() => copyIndividualItem("Summary report content here", 'summary')}
          className="px-4 py-2 bg-blue-600 text-white text-lg rounded hover:bg-blue-700 flex items-center"
        >
          {copiedItems['summary'] ? '✓ Copied' : 'Copy Report'}
        </button>
      </div>
      <div className="bg-white p-6 rounded border text-black text-xl">
        <p>Summary report will be generated here based on strengths and weaknesses analysis.</p>
      </div>
    </div>
  </div>
)}


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
                  {testData.oral_tasks.map((task, index) => (
                    <tr key={task.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b`}>
                      <td className="py-4 px-4">
                        <input
                          type="radio"
                          name={`task-${task.id}`}
                          value="correct"
                          checked={task.response === 'correct'}
                          onChange={(e) => handleResponseChange(task.id, e.target.value)}
                          className="w-6 h-6"
                          disabled={isCompleted}
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
                          disabled={isCompleted}
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
                  {testData.listening_tasks.map((task, index) => (
                    <tr key={task.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b`}>
                      <td className="py-4 px-4">
                        <input
                          type="radio"
                          name={`task-${task.id}`}
                          value="correct"
                          checked={task.response === 'correct'}
                          onChange={(e) => handleResponseChange(task.id, e.target.value)}
                          className="w-6 h-6"
                          disabled={isCompleted}
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
                          disabled={isCompleted}
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
      </div>

      {/* Fixed bottom buttons - only show if not completed */}
      {/* Fixed right-side buttons - only show if not completed */}
        {!isCompleted && (
        <div className="fixed top-1/2 right-8 transform -translate-y-1/2 z-50">
            <div className="flex flex-col space-y-4">
            <button
                onClick={handleCalculate}
                disabled={calculating}
                className="px-8 py-4 bg-indigo-600 text-white text-xl font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-xl"
            >
                {calculating ? (
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Calculating...
                </div>
                ) : 'Calculate Scores'}
            </button>
            
            <button
                onClick={handleCalculate}
                disabled={calculating}
                className="px-8 py-4 bg-orange-600 text-white text-xl font-bold rounded-lg hover:bg-orange-700 disabled:opacity-50 shadow-xl"
            >
                End Test
            </button>
            </div>
        </div>
        )}
    </div>
  )
}