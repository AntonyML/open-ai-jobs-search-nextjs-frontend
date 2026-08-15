'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { isLoggedIn, isAdmin } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import {
  Users, Trash2, RefreshCw, Search, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Shield, Crown, FilterX, ArrowUpDown,
  AlertTriangle, X, Eye,
} from 'lucide-react'
import type { AdminUserListResponse, AdminUserSearchResult } from '@/types/billing'

type SortKey = 'full_name' | 'email' | 'role' | 'tier' | 'created_at'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 5
const CAROUSEL_PAGES = 5
const DELETE_CONFIRM_TEXT = 'ELIMINAR'

export default function AdminUsersPage() {
  const t = useTranslations('adminUsers')
  const ta = useTranslations('admin')
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'es'

  const [users, setUsers] = useState<AdminUserSearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'client'>('all')
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'pro' | 'max'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState<AdminUserSearchResult | null>(null)
  const [deleteTyped, setDeleteTyped] = useState('')
  const [roleEdit, setRoleEdit] = useState<AdminUserSearchResult | null>(null)
  const [roleDraft, setRoleDraft] = useState<'admin' | 'client'>('client')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function loadUsers(overrides?: {
    page?: number
    search?: string
    role?: string
    tier?: string
    sort?: SortKey
    order?: SortDir
  }) {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(overrides?.page ?? page))
    params.set('page_size', String(PAGE_SIZE))
    if (overrides?.search !== undefined ? overrides.search : search) {
      params.set('search', overrides?.search !== undefined ? overrides.search : search)
    }
    if ((overrides?.role !== undefined ? overrides.role : roleFilter) !== 'all') {
      params.set('role', overrides?.role !== undefined ? overrides.role : roleFilter)
    }
    if ((overrides?.tier !== undefined ? overrides.tier : tierFilter) !== 'all') {
      params.set('tier', overrides?.tier !== undefined ? overrides.tier : tierFilter)
    }
    params.set('sort', overrides?.sort ?? sortKey)
    params.set('order', overrides?.order ?? sortDir)
    try {
      const data = await apiFetch<AdminUserListResponse>(`/api/v1/admin/users?${params.toString()}`)
      setUsers(data.items)
      setTotal(data.total)
      if (overrides?.page) setPage(overrides.page)
    } catch {
      showError(ta('toastLoadError'))
    } finally {
      setLoading(false)
    }
  }

  // Debounced search: re-query from page 1 as the admin types.
  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    if (!isAdmin()) { router.replace('/dashboard'); return }
    const id = setTimeout(() => loadUsers({ page: 1, search }), 250)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, tierFilter, sortKey, sortDir])

  async function updateRole(userId: string, role: 'admin' | 'client') {
    setUpdatingId(userId)
    try {
      await apiFetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      })
      showSuccess(ta('toastUpdated'))
      setRoleEdit(null)
      await loadUsers()
    } catch {
      showError(ta('toastUpdateError'))
    } finally {
      setUpdatingId(null)
    }
  }

  async function deleteUser(user: AdminUserSearchResult) {
    setConfirmDelete(null)
    setDeleteTyped('')
    setUpdatingId(user.id)
    try {
      await apiFetch(`/api/v1/admin/users/${user.id}`, { method: 'DELETE' })
      showSuccess(ta('toastDeleted'))
      await loadUsers()
    } catch {
      showError(ta('toastDeleteError'))
    } finally {
      setUpdatingId(null)
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return
    loadUsers({ page: p })
  }

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
            <Users className="h-6 w-6 text-[#0071e3]" />
            {t('title')}
          </h1>
          <p className="mt-0.5 text-sm text-[#707070]">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => loadUsers()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {ta('refresh')}
        </button>
      </div>

      {/* ── Filters bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#858585]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
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
          onChange={e => setRoleFilter(e.target.value as 'all' | 'admin' | 'client')}
          className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-xs font-medium text-[#474747] outline-none transition-all focus:border-[#0071e3]"
        >
          <option value="all">{ta('allRoles')}</option>
          <option value="admin">Admin</option>
          <option value="client">Client</option>
        </select>
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value as 'all' | 'free' | 'pro' | 'max')}
          className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-xs font-medium text-[#474747] outline-none transition-all focus:border-[#0071e3]"
        >
          <option value="all">{ta('allTiers')}</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="max">Max</option>
        </select>
        {(search || roleFilter !== 'all' || tierFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setRoleFilter('all'); setTierFilter('all') }}
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-[#707070] transition-all hover:bg-[#f5f5f7]"
          >
            <FilterX className="h-3.5 w-3.5" /> {ta('clear')}
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
                  <Th onClick={() => toggleSort('full_name')} sort={SortIcon('full_name')}>{ta('name')}</Th>
                  <Th onClick={() => toggleSort('email')} sort={SortIcon('email')}>{ta('email')}</Th>
                  <Th onClick={() => toggleSort('role')} sort={SortIcon('role')}>{ta('role')}</Th>
                  <Th onClick={() => toggleSort('tier')} sort={SortIcon('tier')}>{ta('tier')}</Th>
                  <Th onClick={() => toggleSort('created_at')} sort={SortIcon('created_at')}>{ta('created')}</Th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#707070]">{ta('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => router.push(`/${locale}/admin/users/${u.id}`)}
                    className="cursor-pointer border-b border-[#d2d2d7]/40 transition-colors hover:bg-[#f5f5f7]/50"
                  >
                    <td className="px-4 py-3 font-medium text-[#1d1d1f]">{u.full_name || '—'}</td>
                    <td className="px-4 py-3 text-[#707070]">{u.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3"><TierBadge tier={u.tier} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#858585]">{formatDate(u.created_at, locale)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => router.push(`/${locale}/admin/users/${u.id}`)}
                          className="inline-flex items-center gap-1 rounded-full bg-[#f4f8fb] px-3 py-1.5 text-[11px] font-semibold text-[#0071e3] transition-all hover:bg-[#e8f1f9]"
                        >
                          <Eye className="h-3 w-3" />
                          {t('viewDetail')}
                        </button>
                        <button
                          onClick={() => { setRoleEdit(u); setRoleDraft(u.role === 'admin' ? 'admin' : 'client') }}
                          disabled={updatingId === u.id}
                          className="rounded-lg px-2 py-1.5 text-[#707070] transition-all hover:bg-[#f4f8fb] hover:text-[#0071e3] disabled:opacity-40"
                          title={t('editRole')}
                        >
                          {t('editRole')}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(u)}
                          disabled={updatingId === u.id}
                          className="rounded-lg p-1.5 text-[#858585] transition-all hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-[#858585]">{ta('noResults')}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="space-y-3 sm:hidden">
            {users.map((u) => (
              <div
                key={u.id}
                onClick={() => router.push(`/${locale}/admin/users/${u.id}`)}
                className="cursor-pointer rounded-xl border border-[#d2d2d7]/60 bg-white p-4 transition-colors hover:bg-[#f5f5f7]/50"
              >
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
                <p className="mb-3 text-xs text-[#858585]">{ta('created')} {formatDate(u.created_at, locale)}</p>
                <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => router.push(`/${locale}/admin/users/${u.id}`)}
                    className="inline-flex items-center gap-1 rounded-full bg-[#f4f8fb] px-3 py-1.5 text-[11px] font-semibold text-[#0071e3]"
                  >
                    <Eye className="h-3 w-3" />
                    {t('viewDetail')}
                  </button>
                  <button
                    onClick={() => { setRoleEdit(u); setRoleDraft(u.role === 'admin' ? 'admin' : 'client') }}
                    className="rounded-lg px-2 py-1.5 text-xs text-[#707070] hover:text-[#0071e3]"
                  >
                    {t('editRole')}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(u)}
                    className="rounded-lg p-1.5 text-[#858585] hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="py-12 text-center text-sm text-[#858585]">{ta('noResults')}</p>
            )}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row text-sm">
              <p className="text-xs text-[#858585]">
                {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="rounded-full p-2 text-[#707070] transition-all hover:bg-[#f5f5f7] disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, CAROUSEL_PAGES) }, (_, i) => {
                  const half = Math.floor(CAROUSEL_PAGES / 2)
                  let start = page - half
                  start = Math.max(1, Math.min(start, totalPages - CAROUSEL_PAGES + 1))
                  const p = start + i
                  return (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`h-8 w-8 rounded-full text-xs font-medium transition-all ${
                        p === page ? 'bg-[#0071e3] text-white' : 'text-[#707070] hover:bg-[#f5f5f7]'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-full p-2 text-[#707070] transition-all hover:bg-[#f5f5f7] disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Role edit modal ── */}
      {roleEdit && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setRoleEdit(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1d1d1f]">{t('roleEditTitle')}</h3>
                <p className="truncate text-xs text-[#707070]">{roleEdit.full_name || roleEdit.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRoleDraft('client')}
                className={`rounded-xl border px-4 py-3 text-xs font-semibold transition-all ${
                  roleDraft === 'client' ? 'border-[#0071e3] bg-[#f4f8fb] text-[#0071e3]' : 'border-[#d2d2d7] text-[#474747] hover:bg-[#f5f5f7]'
                }`}
              >
                Client
              </button>
              <button
                onClick={() => setRoleDraft('admin')}
                className={`rounded-xl border px-4 py-3 text-xs font-semibold transition-all ${
                  roleDraft === 'admin' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-[#d2d2d7] text-[#474747] hover:bg-[#f5f5f7]'
                }`}
              >
                Admin
              </button>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[#707070]">
              {roleDraft === 'admin' ? t('roleAdminHint') : t('roleClientHint')}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setRoleEdit(null)}
                className="flex-1 rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7]"
              >
                {ta('cancel')}
              </button>
              <button
                onClick={() => updateRole(roleEdit.id, roleDraft)}
                disabled={updatingId === roleEdit.id || roleDraft === (roleEdit.role === 'admin' ? 'admin' : 'client')}
                className="flex-1 rounded-full bg-gradient-to-r from-[#0071e3] to-[#0060c0] px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40"
              >
                {t('saveRole')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal (hard delete with cascade) ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => { setConfirmDelete(null); setDeleteTyped('') }} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1d1d1f]">{t('deleteTitle')}</h3>
                <p className="truncate text-xs text-[#707070]">{confirmDelete.full_name || confirmDelete.email}</p>
              </div>
            </div>
            <div className="mb-4 rounded-xl border border-rose-200/70 bg-rose-50/60 p-3">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-600">{t('deleteIrreversible')}</p>
              <p className="text-[11px] leading-relaxed text-[#7a5c5c]">{t('deleteConsequences')}</p>
              <ul className="mt-2 space-y-1 text-[11px] text-[#7a5c5c]">
                <li>• {t('deleteCvProfile')}</li>
                <li>• {t('deleteApplications')}</li>
                <li>• {t('deleteCreditsSubs')}</li>
                <li>• {t('deleteNotifications')}</li>
              </ul>
            </div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#707070]">
              {t('deleteTypePrompt', { text: DELETE_CONFIRM_TEXT })}
            </label>
            <input
              type="text"
              value={deleteTyped}
              onChange={(e) => setDeleteTyped(e.target.value)}
              placeholder={DELETE_CONFIRM_TEXT}
              className="mb-5 w-full rounded-xl border border-[#d2d2d7] bg-white px-3 py-2 text-sm outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-300/30"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setConfirmDelete(null); setDeleteTyped('') }}
                className="flex-1 rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7]"
              >
                {ta('cancel')}
              </button>
              <button
                onClick={() => deleteUser(confirmDelete)}
                disabled={deleteTyped !== DELETE_CONFIRM_TEXT || updatingId === confirmDelete.id}
                className="flex-1 rounded-full bg-rose-500 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-rose-600 disabled:opacity-40"
              >
                {ta('delete')}
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
  const cls = tier === 'max'
    ? 'bg-[#f4f8fb] text-[#0071e3]'
    : tier === 'pro'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-[#f5f5f7] text-[#707070]'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {(tier === 'max') && <Crown className="h-2.5 w-2.5" />}
      {tier}
    </span>
  )
}

function formatDate(date: string | null | undefined, locale: string) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
