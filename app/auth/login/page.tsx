'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let isMounted = true

    // Check if user is already logged in
    const checkUser = async () => {
      try {
        // Small delay to avoid race conditions
        await new Promise(resolve => setTimeout(resolve, 100))

        const { data } = await supabase.auth.getSession()
        if (!isMounted) return

        if (data.session) {
          router.push('/bookmarks')
          return
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        if (isMounted) {
          setChecking(false)
        }
      }
    }
    checkUser()

    return () => {
      isMounted = false
    }
  }, [router])

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Sign in error:', error)
      alert('Failed to sign in')
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Bookmark App
        </h1>
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
