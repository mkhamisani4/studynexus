'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Dashboard from '@/components/Dashboard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ChatAssistant from '@/components/ChatAssistant'

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard')
  const [viewData, setViewData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const handleSetActiveView = (view: string, data?: any) => {
    setActiveView(view)
    setViewData(data || null)
  }

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/landing')
      } else {
        setLoading(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && event === 'SIGNED_OUT') {
        router.push('/landing')
      } else if (session) {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-800 dark:border-t-slate-50"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} setActiveView={handleSetActiveView} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1920px] p-8">
            <Dashboard activeView={activeView} setActiveView={handleSetActiveView} viewData={viewData} />
          </div>
        </main>
      </div>
      <Footer setActiveView={handleSetActiveView} />
      <ChatAssistant />
    </div>
  )
}
