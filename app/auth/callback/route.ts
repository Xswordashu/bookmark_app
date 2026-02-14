import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Auth error:', error)
        return NextResponse.redirect(new URL('/auth/login?error=auth_failed', request.url))
      }
      return NextResponse.redirect(new URL('/bookmarks', request.url))
    } catch (error) {
      console.error('Error:', error)
      return NextResponse.redirect(new URL('/auth/login?error=server_error', request.url))
    }
  }

  return NextResponse.redirect(new URL('/auth/login', request.url))
}
