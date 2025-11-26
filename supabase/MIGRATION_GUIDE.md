# Migration Guide: From LocalStorage to Supabase Auth

If you've been testing with localStorage authentication, follow these steps to migrate to Supabase Auth.

## Step 1: Update Authentication in Login/Signup Pages

The login and signup pages need to use Supabase Auth instead of localStorage.

### Update Login Page (`app/login/page.tsx`)

Replace the `handleLogin` function:

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    // Redirect to main app
    router.push('/')
  } catch (error: any) {
    alert(error.message || 'Failed to sign in')
  } finally {
    setLoading(false)
  }
}
```

### Update Signup Page (`app/signup/page.tsx`)

Replace the `handleSignup` function:

```typescript
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault()
  if (password !== confirmPassword) {
    alert('Passwords do not match')
    return
  }
  
  setLoading(true)
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    })
    
    if (error) throw error
    
    // Redirect to main app
    router.push('/')
  } catch (error: any) {
    alert(error.message || 'Failed to create account')
  } finally {
    setLoading(false)
  }
}
```

## Step 2: Update Main App Page (`app/page.tsx`)

Replace the authentication check:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Dashboard from '@/components/Dashboard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/landing')
      } else {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && event === 'SIGNED_OUT') {
        router.push('/landing')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="flex-1 p-6 overflow-x-auto min-w-0">
          <Dashboard activeView={activeView} />
        </main>
      </div>
      <Footer />
    </div>
  )
}
```

## Step 3: Add Logout Functionality

Update the Header component to include logout:

```typescript
// In components/Header.tsx
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// Add logout function
const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/landing')
}

// Add logout button in header
```

## Step 4: Update API Routes

All API routes should verify the user is authenticated:

```typescript
// Example: app/api/quiz/route.ts
import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  
  // Verify authentication
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  
  if (authError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const userId = session.user.id
  // ... rest of your logic
}
```

## Step 5: Update Data Queries

All database queries should use the authenticated user's ID:

```typescript
// Example: Fetching study materials
const { data, error } = await supabase
  .from('study_materials')
  .select('*')
  .eq('user_id', session.user.id)
  .order('created_at', { ascending: false })
```

## Testing the Migration

1. Clear localStorage: `localStorage.clear()` in browser console
2. Try to access `/` - should redirect to `/landing`
3. Sign up a new account
4. Should redirect to main app
5. Refresh page - should stay logged in
6. Log out - should redirect to landing

## Troubleshooting

### "User is not authenticated" errors
- Check that Supabase URL and keys are correct
- Verify RLS policies are set up
- Check browser console for auth errors

### Session not persisting
- Check that `persistSession: true` is set in Supabase client
- Verify cookies are being set (check browser DevTools)

### Redirect loops
- Make sure auth check completes before rendering
- Add loading state to prevent premature redirects

