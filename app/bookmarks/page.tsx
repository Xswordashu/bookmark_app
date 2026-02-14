'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRealtimeBookmarks } from '@/hooks/useRealtimeBookmarks'

interface Bookmark {
  id: string
  title: string
  url: string
  created_at: string
}

export default function BookmarksPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const { bookmarks, loading, refetch } = useRealtimeBookmarks()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        // Small delay to avoid race conditions with other tabs
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const { data } = await supabase.auth.getSession()
        
        if (!isMounted) return

        if (!data.session) {
          router.push('/auth/login')
          return
        }
        
        setUser(data.session.user)
      } catch (error) {
        console.error('Auth error:', error)
        if (isMounted) {
          router.push('/auth/login')
        }
      } finally {
        if (isMounted) {
          setInitialLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [router])

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) {
      alert('Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('bookmarks').insert({
        title,
        url,
        user_id: user.id,
      })

      if (error) {
        console.error('Error adding bookmark:', error)
        alert('Failed to add bookmark')
        return
      }

      setTitle('')
      setUrl('')
      // Real-time subscription will instantly update all tabs
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBookmark = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) return

    try {
      const { error } = await supabase.from('bookmarks').delete().eq('id', id)

      if (error) {
        console.error('Error deleting bookmark:', error)
        alert('Failed to delete bookmark')
        return
      }

      // Use refetch to ensure deletion is reflected immediately
      if (refetch) {
        await refetch()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (initialLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookmarks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Bookmark App</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Add Bookmark Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Bookmark</h2>
          <form onSubmit={handleAddBookmark} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., GitHub"
                autoComplete="off"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                autoComplete="off"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Bookmark'}
            </button>
          </form>
        </div>

        {/* Bookmarks List */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            My Bookmarks ({bookmarks.length})
          </h2>
          {bookmarks.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">No bookmarks yet. Add one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition duration-200"
                >
                  <h3 className="font-bold text-lg text-gray-800 mb-2">
                    {bookmark.title}
                  </h3>
                  <p className="text-blue-500 hover:text-blue-700 mb-3 break-all text-sm">
                    <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                      {bookmark.url}
                    </a>
                  </p>
                  <p className="text-gray-500 text-xs mb-4">
                    {new Date(bookmark.created_at).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => handleDeleteBookmark(bookmark.id)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition duration-200"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
