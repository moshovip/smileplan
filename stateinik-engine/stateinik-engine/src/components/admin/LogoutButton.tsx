'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    router.push('/login')
    router.refresh()
  }
  return (
    <button
      onClick={logout}
      className="text-sm text-text-sub transition hover:text-text"
    >
      Sign out
    </button>
  )
}
