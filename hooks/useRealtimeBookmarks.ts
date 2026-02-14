import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Bookmark {
  id: string
  title: string
  url: string
  created_at: string
}

export function useRealtimeBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const subscriptionRef = useRef<any>(null)
  const isMountedRef = useRef(true)
  const loadingRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true

    const initAuth = async () => {
      try {
        // Add delay to prevent race conditions with multiple tabs
        await new Promise(resolve => setTimeout(resolve, 150))

        if (!isMountedRef.current) return

        const { data } = await supabase.auth.getSession()
        if (data.session?.user?.id && isMountedRef.current) {
          setUserId(data.session.user.id)
          await loadBookmarks(data.session.user.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (isMountedRef.current) setLoading(false)
      }
    }

    initAuth()

    return () => {
      isMountedRef.current = false
      subscriptionRef.current?.unsubscribe()
    }
  }, [])

  // Separate effect for real-time subscription
  useEffect(() => {
    if (!userId) return

    // Unsubscribe from old subscription
    subscriptionRef.current?.unsubscribe()

    // Subscribe to real-time changes
    subscriptionRef.current = supabase
      .channel(`bookmarks-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
        //   filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (!isMountedRef.current) return

          try {
            console.log('Real-time event:', payload.eventType, payload)
            
            if (payload.eventType === 'INSERT') {
              console.log('Adding new bookmark:', payload.new)
              setBookmarks((prev) => [payload.new as Bookmark, ...prev])
            } else if (payload.eventType === 'DELETE') {
              console.log('Deleting bookmark:', payload.old?.id)
              setBookmarks((prev) => prev.filter((b) => b.id !== payload.old?.id))
            } else if (payload.eventType === 'UPDATE') {
              console.log('Updating bookmark:', payload.new)
              setBookmarks((prev) =>
                prev.map((b) => (b.id === payload.new?.id ? (payload.new as Bookmark) : b))
              )
            }
          } catch (error) {
            console.error('Error processing real-time change:', error)
          }
        }
      )
      .subscribe()

    return () => {
      subscriptionRef.current?.unsubscribe()
    }
  }, [userId])

  const loadBookmarks = async (uid: string) => {
    // Prevent concurrent loads
    if (loadingRef.current) return
    loadingRef.current = true

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading bookmarks:', error.message)
        return
      }

      if (isMountedRef.current) {
        setBookmarks(data || [])
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
      loadingRef.current = false
    }
  }

  // Expose a public refetch function
  const refetch = async () => {
    if (userId) {
      loadingRef.current = false // Reset flag to allow refetch
      await loadBookmarks(userId)
    }
  }

  return { bookmarks, loading, refetch }
}
