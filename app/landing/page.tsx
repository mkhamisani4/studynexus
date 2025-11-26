'use client'

import { useRouter } from 'next/navigation'
import { Brain, GraduationCap, Zap, Target, ArrowRight, Sparkles, TrendingUp, Users, BookOpen, CheckCircle2, Star } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const features = [
    {
      icon: Brain,
      title: 'AI Knowledge Graph',
      description: 'Visualize concept relationships and identify your weak areas automatically',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: GraduationCap,
      title: 'Auto-Generated Exams',
      description: 'Practice with AI-created exams tailored to your study materials',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Zap,
      title: 'Smart Flashcards',
      description: 'Multi-mode flashcards that adapt to your learning style',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Target,
      title: 'Personalized Coaching',
      description: 'Get AI-powered study recommendations and motivation',
      color: 'from-green-500 to-emerald-500'
    }
  ]

  const stats = [
    { icon: Users, value: '10K+', label: 'Active Students' },
    { icon: BookOpen, value: '50K+', label: 'Study Materials' },
    { icon: TrendingUp, value: '95%', label: 'Success Rate' },
    { icon: Star, value: '4.9/5', label: 'User Rating' }
  ]

  const benefits = [
    'AI-powered personalized learning paths',
    'Real-time progress tracking',
    'Multi-level concept explanations',
    'Automated quiz and exam generation',
    'Study schedule optimization',
    'Collaborative study groups'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 dark:bg-blue-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 dark:bg-pink-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg transform hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                StudyNexus
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all transform"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6 transform transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">AI-Powered Learning</span>
          </div>
          <h1 className={`text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 transform transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            Study Smarter,
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent animate-gradient">
              Not Harder
            </span>
          </h1>
          <p className={`text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed transform transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            Your intelligent learning partner that helps you master any subject with AI-generated quizzes, 
            personalized study plans, and real-time progress tracking.
          </p>
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transform transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <button
              onClick={() => router.push('/signup')}
              className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all flex items-center space-x-2 relative overflow-hidden"
            >
              <span className="relative z-10">Start Learning Free</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:scale-105 transition-all transform shadow-lg"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className={`mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 transform transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:scale-105 transition-all transform"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-3 mx-auto">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Succeed
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Powerful AI features designed to make studying more efficient and effective
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-lg dark:shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 transform overflow-hidden ${mounted ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className={`relative w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 relative z-10">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 relative z-10">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 rounded-3xl p-12 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Why Choose{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  StudyNexus?
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Join thousands of students who have transformed their learning experience with our AI-powered platform.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all transform hover:scale-105"
                >
                  <CheckCircle2 className="w-6 h-6 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join thousands of students who are already studying smarter with StudyNexus
            </p>
            <button
              onClick={() => router.push('/signup')}
              className="group px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all flex items-center space-x-2 mx-auto transform"
            >
              <span>Get Started for Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="mt-6 text-blue-100 text-sm">
              No credit card required • Free forever • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-800/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                StudyNexus
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} StudyNexus. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

