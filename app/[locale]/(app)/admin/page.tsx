'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { isLoggedIn, isAdmin } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { Shield, User, Star, Trash2, RefreshCw } from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  role: string
  tier: string
  created_at: string | null
}

export default function AdminPage() {
  const t = useTranslations()
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    if (!isAdmin()) { router.replace('/dashboard'); return }
    loadUsers()
  }, [router])

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch<AdminUser[]>('/api/v1/admin/users')
      setUsers(data)
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  async function updateUser(userId: string, updates: { tier?: string; role?: string }) {
    setUpdatingId(userId)
    try {
      await apiFetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      await loadUsers()
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Failed to update user')
    } finally {
      setUpdatingId(null)
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm(t('common.confirm'))) return
    setUpdatingId(userId)
    try {
      await apiFetch(`/api/v1/admin/users/${userId}`, { method: 'DELETE' })
      await loadUsers()
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Failed to delete user')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#0071e3]" />
            Admin Panel
          </h1>
          <p className="text-sm text-[#707070] mt-1">User management</p>
        </div>
        <button
          onClick={loadUsers}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-[#707070] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-sm text-[#707070]">{t('common.loading')}</div>
      ) : (
        <div className="bg-white rounded-xl border border-[#d2d2d7]/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#d2d2d7]/60 bg-[#f5f5f7]">
                  <th className="text-left px-4 py-3 font-medium text-[#707070] text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-[#707070] text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-[#707070] text-xs uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-[#707070] text-xs uppercase tracking-wider">Tier</th>
                  <th className="text-left px-4 py-3 font-medium text-[#707070] text-xs uppercase tracking-wider">Created</th>
                  <th className="text-right px-4 py-3 font-medium text-[#707070] text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#d2d2d7]/40 hover:bg-[#f5f5f7]/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-[#1d1d1f]">{u.full_name || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-[#707070]">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-[#0071e3]/10 text-[#0071e3]'
                          : 'bg-[#f5f5f7] text-[#707070]'
                      }`}>
                        {u.role === 'admin' && <Shield className="w-3 h-3" />}
                        {u.role === 'admin' ? 'Admin' : 'Client'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.tier === 'premium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-[#f5f5f7] text-[#707070]'
                      }`}>
                        {u.tier === 'premium' && <Star className="w-3 h-3" />}
                        {u.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#707070] text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Tier toggle */}
                        <button
                          disabled={updatingId === u.id}
                          onClick={() => updateUser(u.id, { tier: u.tier === 'free' ? 'premium' : 'free' })}
                          className="rounded-full px-2.5 py-1 text-xs font-medium text-[#707070] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all disabled:opacity-50"
                        >
                          {u.tier === 'free' ? 'Upgrade' : 'Downgrade'}
                        </button>
                        {/* Role toggle */}
                        <button
                          disabled={updatingId === u.id}
                          onClick={() => updateUser(u.id, { role: u.role === 'admin' ? 'client' : 'admin' })}
                          className="rounded-full px-2.5 py-1 text-xs font-medium text-[#707070] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all disabled:opacity-50"
                        >
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>
                        {/* Delete */}
                        <button
                          disabled={updatingId === u.id}
                          onClick={() => deleteUser(u.id)}
                          className="rounded-full p-1.5 text-[#707070] hover:text-rose-500 hover:bg-rose-50 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
