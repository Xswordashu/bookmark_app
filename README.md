# Bookmark App

A real-time bookmark management application built with **Next.js**, **Supabase**, and **Tailwind CSS**.

## Features

✅ **Google OAuth Authentication** - Sign in with Google (no email/password)
✅ **Add Bookmarks** - Save URLs with titles
✅ **Delete Bookmarks** - Remove saved bookmarks instantly
✅ **Private Bookmarks** - Each user sees only their own bookmarks
✅ **Real-time Sync** - Bookmark updates sync instantly across all tabs
✅ **No Page Refresh** - Changes appear without reloading

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Deployment:** Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Google OAuth credentials

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Create `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Major Issues & Solutions

### ❌ Issue 1: Real-time DELETE Events Not Working → ✅ SOLVED
**Problem:** When deleting a bookmark, the UI only updated after a page refresh. Real-time subscriptions worked for INSERT but not DELETE.

**Root Cause:**
- Supabase Realtime wasn't enabled on the `bookmarks` table
- RLS policies weren't properly configured for DELETE operations

**Solution:**
1. Enabled Realtime on bookmarks table:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
   ```

2. Fixed RLS DELETE policy:
   ```sql
   CREATE POLICY "Users can delete their own bookmarks" ON bookmarks
     FOR DELETE USING (auth.uid() = user_id);
   ```

3. Added `refetch()` fallback for DELETE operations to ensure immediate UI updates.

---

### ❌ Issue 2: Multi-Tab Crashes (Auth Race Conditions) → ✅ SOLVED
**Problem:** Opening the app in multiple tabs caused crashes with "signal is aborted without reason" error.

**Root Cause:**
- Multiple tabs simultaneously accessing Supabase auth
- Duplicate auth state listeners
- Supabase auth lock contention

**Solution:**
1. Added 100-150ms delay to prevent simultaneous lock access
2. Removed duplicate `onAuthStateChange` listeners
3. Used `useRef` for proper mounted state tracking
4. Added proper cleanup in useEffect hooks

---

### ❌ Issue 3: Cross-Tab Real-time Sync Not Working → ✅ SOLVED
**Problem:** Adding a bookmark in Tab 1 didn't appear in Tab 2.

**Root Cause:**
- Missing unique channel names per user
- No server-side filtering in subscriptions
- Auth state not synced across tabs

**Solution:**
1. Created unique channels per user: `bookmarks-${userId}`
2. Added server-side filtering: `filter: user_id=eq.${userId}`
3. Implemented auth state change detection across tabs
4. Leveraged Supabase localStorage session persistence


## Deployment

**Live:** [https://bookmark-app-alpha-azure.vercel.app/](https://bookmark-app-alpha-azure.vercel.app/)

### Steps:
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Update Supabase OAuth redirect URI to your Vercel URL

## Architecture

```
├── app/auth/login/page.tsx          # Google OAuth login
├── app/auth/callback/route.ts       # OAuth callback
├── app/bookmarks/page.tsx           # Main app
├── hooks/useRealtimeBookmarks.ts    # Real-time subscription hook
├── lib/supabase.ts                  # Supabase client
└── middleware.ts                    # Route protection
```

## Key Features Implementation

✅ Real-time bookmark sync across tabs
✅ Proper RLS policies for data privacy
✅ Multi-tab auth session management
✅ Fallback mechanisms for data consistency
✅ Error handling and logging

## Learn More

- [Next.js](https://nextjs.org/docs)
- [Supabase](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

