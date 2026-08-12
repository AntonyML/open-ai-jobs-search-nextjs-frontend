'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { isLoggedIn, isAdmin } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError, showWarning } from '@/lib/toasts'
import {
  Shield, User, Star, Trash2, RefreshCw, Search,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Users, Crown, FilterX, ArrowUpDown, AlertTriangle, X
} from 'lucide-react'
import { AdminProviderConfig } from '@/components/admin/AdminProviderConfig'

interface AdminUser {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  role: string
  tier: string
  created_at: string | null
}

type SortKey = 'full_name' | 'email' | 'role' | 'tier' | 'created_at'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 20

export default function AdminPage() {
  const t = useTranslations()
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'client'>('all')
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'premium'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    if (!isAdmin()) { router.replace('/dashboard'); return }
    loadUsers()
  }, [router])

  async function loadUsers() {
    setLoading(true)
    try {
      const data = await apiFetch<AdminUser[]>('/api/v1/admin/users')
      setUsers(data)
    } catch (x) {
      showError(t('admin.toastLoadError'))
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
      showSuccess(t('admin.toastUpdated'))
      await loadUsers()
    } catch (x) {
      showError(t('admin.toastUpdateError'))
    } finally {
      setUpdatingId(null)
    }
  }

  async function deleteUser(userId: string) {
    setConfirmDelete(null)
    setUpdatingId(userId)
    try {
      await apiFetch(`/api/v1/admin/users/${userId}`, { method: 'DELETE' })
      showSuccess(t('admin.toastDeleted'))
      await loadUsers()
    } catch (x) {
      showError(t('admin.toastDeleteError'))
    } finally {
      setUpdatingId(null)
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(0)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    let data = users
    if (q) data = data.filter(u => (u.full_name || '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    if (roleFilter !== 'all') data = data.filter(u => u.role === roleFilter)
    if (tierFilter !== 'all') data = data.filter(u => u.tier === tierFilter)
    data.sort((a, b) => {
      const aVal = (a[sortKey] || '').toString().toLowerCase()
      const bVal = (b[sortKey] || '').toString().toLowerCase()
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
    return data
  }, [users, search, roleFilter, tierFilter, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    premium: users.filter(u => u.tier === 'premium').length,
  }), [users])

  function SortIcon(key: SortKey) {
    if (sortKey !== key) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />
    return sortDir === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[#1d1d1f] sm:text-2xl">
            <Shield className="h-6 w-6 text-[#0071e3]" />
            {t('admin.title')}
          </h1>
          <p className="mt-0.5 text-sm text-[#707070]">{t('admin.subtitle')}</p>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.refresh')}
        </button>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#d2d2d7]/60 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f8fb]">
              <Users className="h-5 w-5 text-[#0071e3]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1d1d1f]">{stats.total}</p>
              <p className="text-xs text-[#707070]">{t('admin.totalUsers')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#d2d2d7]/60 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1d1d1f]">{stats.admins}</p>
              <p className="text-xs text-[#707070]">{t('admin.admins')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#d2d2d7]/60 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1d1d1f]">{stats.premium}</p>
              <p className="text-xs text-[#707070]">{t('admin.premium')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#858585]" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder={t('admin.searchPlaceholder')}
            className="w-full rounded-full border border-[#d2d2d7] bg-white py-2 pl-9 pr-4 text-sm text-[#1d1d1f] outline-none transition-all placeholder:text-[#858585] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#858585] hover:text-[#1d1d1f]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value as 'all' | 'admin' | 'client'); setPage(0) }}
          className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-xs font-medium text-[#474747] outline-none transition-all focus:border-[#0071e3]"
        >
          <option value="all">{t('admin.allRoles')}</option>
          <option value="admin">Admin</option>
          <option value="client">Client</option>
        </select>
        <select
          value={tierFilter}
          onChange={e => { setTierFilter(e.target.value as 'all' | 'free' | 'premium'); setPage(0) }}
          className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-xs font-medium text-[#474747] outline-none transition-all focus:border-[#0071e3]"
        >
          <option value="all">{t('admin.allTiers')}</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
        {(search || roleFilter !== 'all' || tierFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setRoleFilter('all'); setTierFilter('all'); setPage(0) }}
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-[#707070] transition-all hover:bg-[#f5f5f7]"
          >
            <FilterX className="h-3.5 w-3.5" /> {t('admin.clear')}
          </button>
        )}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-[#858585]" />
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-[#d2d2d7]/60 bg-white sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#d2d2d7]/60 bg-[#f5f5f7]">
                  <Th onClick={() => toggleSort('full_name')} sort={SortIcon('full_name')}>{t('admin.name')}</Th>
                  <Th onClick={() => toggleSort('email')} sort={SortIcon('email')}>{t('admin.email')}</Th>
                  <Th onClick={() => toggleSort('role')} sort={SortIcon('role')}>{t('admin.role')}</Th>
                  <Th onClick={() => toggleSort('tier')} sort={SortIcon('tier')}>{t('admin.tier')}</Th>
                  <Th onClick={() => toggleSort('created_at')} sort={SortIcon('created_at')}>{t('admin.created')}</Th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#707070]">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((u) => (
                  <tr key={u.id} className="border-b border-[#d2d2d7]/40 transition-colors hover:bg-[#f5f5f7]/50">
                    <td className="px-4 py-3 font-medium text-[#1d1d1f]">{u.full_name || '—'}</td>
                    <td className="px-4 py-3 text-[#707070]">{u.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3"><TierBadge tier={u.tier} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#858585]">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <ActionCell
                        user={u}
                        updating={updatingId === u.id}
                        onUpdate={updateUser}
                        onDelete={() => setConfirmDelete(u.id)}
                        t={t}
                      />
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-[#858585]">{t('admin.noResults')}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="space-y-3 sm:hidden">
            {paged.map((u) => (
              <div key={u.id} className="rounded-xl border border-[#d2d2d7]/60 bg-white p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-[#1d1d1f]">{u.full_name || '—'}</p>
                    <p className="text-xs text-[#707070]">{u.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <RoleBadge role={u.role} />
                    <TierBadge tier={u.tier} />
                  </div>
                </div>
                <p className="mb-3 text-xs text-[#858585]">{t('admin.created')} {formatDate(u.created_at)}</p>
                <ActionCell
                  user={u}
                  updating={updatingId === u.id}
                  onUpdate={updateUser}
                  onDelete={() => setConfirmDelete(u.id)}
                  t={t}
                />
              </div>
            ))}
            {paged.length === 0 && (
              <p className="py-12 text-center text-sm text-[#858585]">{t('admin.noResults')}</p>
            )}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-xs text-[#858585]">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-full p-2 text-[#707070] transition-all hover:bg-[#f5f5f7] disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(0, Math.min(page - 2, totalPages - 5))
                  const p = start + i
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-8 w-8 rounded-full text-xs font-medium transition-all ${
                        p === page ? 'bg-[#0071e3] text-white' : 'text-[#707070] hover:bg-[#f5f5f7]'
                      }`}
                    >
                      {p + 1}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-full p-2 text-[#707070] transition-all hover:bg-[#f5f5f7] disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Global provider configuration (admin only) ── */}
      <AdminProviderConfig />

      {/* ── Delete confirmation modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-sm animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)] rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1d1d1f]">{t('admin.deleteConfirm')}</h3>
                <p className="text-xs text-[#707070]">{t('admin.deleteConfirmDesc')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7]"
              >
                {t('admin.cancel')}
              </button>
              <button
                onClick={() => deleteUser(confirmDelete)}
                className="flex-1 rounded-full bg-rose-500 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-rose-600"
              >
                {t('admin.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──

function Th({ children, onClick, sort }: { children: React.ReactNode; onClick: () => void; sort: React.ReactNode }) {
  return (
    <th
      onClick={onClick}
      className="cursor-pointer select-none px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#707070] transition-colors hover:text-[#1d1d1f]"
    >
      <span className="inline-flex items-center">
        {children}
        {sort}
      </span>
    </th>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
      role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-[#f5f5f7] text-[#707070]'
    }`}>
      {role === 'admin' && <Shield className="h-2.5 w-2.5" />}
      {role === 'admin' ? 'Admin' : 'Client'}
    </span>
  )
}

function TierBadge({ tier }: { tier: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
      tier === 'premium' ? 'bg-amber-50 text-amber-700' : 'bg-[#f5f5f7] text-[#707070]'
    }`}>
      {tier === 'premium' && <Star className="h-2.5 w-2.5" />}
      {tier}
    </span>
  )
}

function ActionCell({ user, updating, onUpdate, onDelete, t }: {
  user: AdminUser
  updating: boolean
  onUpdate: (id: string, data: { tier?: string; role?: string }) => void
  onDelete: () => void
  t: (key: string) => string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <select
        value={user.tier}
        disabled={updating}
        onChange={e => {
          const newTier = e.target.value
          if (newTier === user.tier) return
          onUpdate(user.id, { tier: newTier })
        }}
        className="rounded-lg border border-[#d2d2d7] bg-white px-2 py-1.5 text-[11px] font-medium text-[#474747] outline-none transition-all focus:border-[#0071e3] disabled:opacity-40"
      >
        <option value="free">Free</option>
        <option value="premium">Premium</option>
      </select>

      <select
        value={user.role}
        disabled={updating}
        onChange={e => {
          const newRole = e.target.value
          if (newRole === user.role) return
          onUpdate(user.id, { role: newRole })
        }}
        className="rounded-lg border border-[#d2d2d7] bg-white px-2 py-1.5 text-[11px] font-medium text-[#474747] outline-none transition-all focus:border-[#0071e3] disabled:opacity-40"
      >
        <option value="client">Client</option>
        <option value="admin">Admin</option>
      </select>

      <button
        disabled={updating}
        onClick={onDelete}
        className="rounded-lg p-1.5 text-[#858585] transition-all hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
