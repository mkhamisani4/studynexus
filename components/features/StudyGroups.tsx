'use client'

import { useState } from 'react'
import { Users, Plus, MessageSquare, Target, Calendar } from 'lucide-react'

export default function StudyGroups() {
  const [groups] = useState([
    {
      id: 1,
      name: 'Data Structures Study Group',
      subject: 'Data Structures',
      members: 5,
      sharedQuizzes: 3,
      studyPlan: 'Weekly review sessions on Tuesdays and Thursdays'
    },
    {
      id: 2,
      name: 'Linear Algebra Prep',
      subject: 'Mathematics',
      members: 8,
      sharedQuizzes: 5,
      studyPlan: 'Daily practice problems and group discussions'
    }
  ])
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Groups</h1>
          <p className="text-gray-600 mt-1">Collaborate with peers and study together</p>
        </div>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Group</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-500">{group.subject}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Members</span>
                <span className="font-medium text-gray-900">{group.members}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Shared Quizzes</span>
                <span className="font-medium text-gray-900">{group.sharedQuizzes}</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Study Plan</span>
              </div>
              <p className="text-sm text-gray-600">{group.studyPlan}</p>
            </div>
            <button className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-all flex items-center justify-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Join Group</span>
            </button>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
          <Target className="w-5 h-5" />
          <span>AI-Powered Group Matching</span>
        </h3>
        <p className="text-blue-800 text-sm">
          Our AI matches you with students who have similar courses, weaknesses, and upcoming deadlines.
          This helps create effective study groups with aligned goals and complementary strengths.
        </p>
      </div>
    </div>
  )
}

