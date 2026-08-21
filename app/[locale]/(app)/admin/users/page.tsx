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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import { FormField, FormLabel } from '@/components/ui/form-field'

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
    setUpdatingId(user.id)
    try {
      await apiFetch(`/api/v1/admin/users/${user.id}`, { method: 'DELETE' })
      showSuccess(t('toastDeleted'))
      setConfirmDelete(null)
      setDeleteTyped('')
      const nextPage = users.length === 1 && page > 1 ? page - 1 : page
      await loadUsers({ page: nextPage })
    } catch {
      showError(t('toastDeleteError'))
    } finally {
      setUpdatingId(null)
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortIcon(key: SortKey) {
    if (sortKey !== key) return <ArrowUpDown className="ml-1 inline h-3 w-3 text-[#5f6368]" />
    return sortDir === 'asc'
      ? <ChevronUp className="ml-1 inline h-3 w-3 text-[#0071e3]" />
      : <ChevronDown className="ml-1 inline h-3 w-3 text-[#0071e3]" />
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return
    setPage(p)
    loadUsers({ page: p })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
            <Users className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1d1d1f]">{t('title')}</h1>
            <p className="text-xs text-[#5f6368]">{t('subtitle', { total })}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadUsers()}
          disabled={loading}
          className="w-fit"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          {ta('refresh')}
        </Button>
      </div>

      {/* ── Filters bar ── */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f6368]" aria-hidden="true" />
            <Input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="pl-9 pr-9"
              aria-label={t('searchPlaceholder')}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] hover:text-[#1d1d1f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] rounded-full p-1"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as 'all' | 'admin' | 'client')}
            className="rounded-[8px] border border-[#d2d2d7] bg-white px-3 py-2 text-xs font-medium text-[#1d1d1f] outline-none transition-all focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]"
            aria-label="Filtrar por rol"
          >
            <option value="all">{ta('allRoles')}</option>
            <option value="admin">Admin</option>
            <option value="client">Client</option>
          </select>
          <select
            value={tierFilter}
            onChange={e => setTierFilter(e.target.value as 'all' | 'free' | 'pro' | 'max')}
            className="rounded-[8px] border border-[#d2d2d7] bg-white px-3 py-2 text-xs font-medium text-[#1d1d1f] outline-none transition-all focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]"
            aria-label="Filtrar por plan"
          >
            <option value="all">{ta('allTiers')}</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="max">Max</option>
          </select>
          {(search || roleFilter !== 'all' || tierFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(''); setRoleFilter('all'); setTierFilter('all') }}
            >
              <FilterX className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> {ta('clear')}
            </Button>
          )}
        </div>
      </Card>

      {/* ── Table & Cards Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-[#5f6368]" aria-hidden="true" />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden overflow-hidden rounded-[12px] border border-[#d2d2d7] bg-white sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#d2d2d7] bg-[#f5f5f7]">
                  <Th onClick={() => toggleSort('full_name')} sort={SortIcon('full_name')}>{ta('name')}</Th>
                  <Th onClick={() => toggleSort('email')} sort={SortIcon('email')}>{ta('email')}</Th>
                  <Th onClick={() => toggleSort('role')} sort={SortIcon('role')}>{ta('role')}</Th>
                  <Th onClick={() => toggleSort('tier')} sort={SortIcon('tier')}>{ta('tier')}</Th>
                  <Th onClick={() => toggleSort('created_at')} sort={SortIcon('created_at')}>{ta('created')}</Th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5f6368]">{ta('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => router.push(`/${locale}/admin/users/${u.id}`)}
                    className="cursor-pointer border-b border-[#e5e5ea] transition-colors hover:bg-[#f4f8fb]/60"
                  >
                    <td className="px-4 py-3 font-medium text-[#1d1d1f]">{u.full_name || '—'}</td>
                    <td className="px-4 py-3 text-[#5f6368]">{u.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3"><TierBadge tier={u.tier} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#5f6368]">{formatDate(u.created_at, locale)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/${locale}/admin/users/${u.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                          {t('viewDetail')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setRoleEdit(u); setRoleDraft(u.role === 'admin' ? 'admin' : 'client') }}
                          disabled={updatingId === u.id}
                        >
                          {t('editRole')}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setConfirmDelete(u)}
                          disabled={updatingId === u.id}
                          aria-label={`Eliminar usuario ${u.full_name || u.email}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-[#5f6368]">
                      {ta('noResults')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (Responsive Strategy A) */}
          <div className="space-y-3 sm:hidden">
            {users.map((u) => (
              <Card
                key={u.id}
                variant="interactive"
                onClick={() => router.push(`/${locale}/admin/users/${u.id}`)}
                className="space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-[#1d1d1f]">{u.full_name || '—'}</p>
                    <p className="text-xs text-[#5f6368]">{u.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <RoleBadge role={u.role} />
                    <TierBadge tier={u.tier} />
                  </div>
                </div>
                <p className="text-xs text-[#5f6368]">{ta('created')} {formatDate(u.created_at, locale)}</p>
                <div className="flex items-center gap-1.5 pt-2 border-t border-[#f0f0f4]" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/${locale}/admin/users/${u.id}`)}
                    className="flex-1"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                    {t('viewDetail')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setRoleEdit(u); setRoleDraft(u.role === 'admin' ? 'admin' : 'client') }}
                    disabled={updatingId === u.id}
                    className="flex-1"
                  >
                    {t('editRole')}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmDelete(u)}
                    disabled={updatingId === u.id}
                    aria-label={`Eliminar usuario ${u.full_name || u.email}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </Card>
            ))}
            {users.length === 0 && (
              <Card className="py-12 text-center text-sm text-[#5f6368]">
                {ta('noResults')}
              </Card>
            )}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row text-sm pt-2">
              <p className="text-xs text-[#5f6368]">
                {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                {Array.from({ length: Math.min(totalPages, CAROUSEL_PAGES) }, (_, i) => {
                  const half = Math.floor(CAROUSEL_PAGES / 2)
                  let start = page - half
                  start = Math.max(1, Math.min(start, totalPages - CAROUSEL_PAGES + 1))
                  const p = start + i
                  return (
                    <Button
                      key={p}
                      variant={p === page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => goToPage(p)}
                      className="min-w-[32px] px-2"
                      aria-current={p === page ? 'page' : undefined}
                    >
                      {p}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Role Edit Canonical Dialog (Adaptive Bottom Sheet on Mobile / Centered Modal on Desktop) ── */}
      <Dialog open={!!roleEdit} onClose={() => setRoleEdit(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-700">
                <Shield className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle>{t('roleEditTitle')}</DialogTitle>
                <DialogDescription className="truncate">
                  {roleEdit?.full_name || roleEdit?.email}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={roleDraft === 'client' ? 'primary' : 'outline'}
                onClick={() => setRoleDraft('client')}
                className="w-full"
              >
                Client
              </Button>
              <Button
                type="button"
                variant={roleDraft === 'admin' ? 'primary' : 'outline'}
                onClick={() => setRoleDraft('admin')}
                className="w-full"
              >
                Admin
              </Button>
            </div>
            <p className="text-[11px] leading-relaxed text-[#5f6368]">
              {roleDraft === 'admin' ? t('roleAdminHint') : t('roleClientHint')}
            </p>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleEdit(null)}
            >
              {ta('cancel')}
            </Button>
            <Button
              variant="primary"
              loading={updatingId === roleEdit?.id}
              disabled={!roleEdit || roleDraft === (roleEdit.role === 'admin' ? 'admin' : 'client')}
              onClick={() => roleEdit && updateRole(roleEdit.id, roleDraft)}
            >
              {t('saveRole')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Canonical Dialog ── */}
      <Dialog open={!!confirmDelete} onClose={() => { setConfirmDelete(null); setDeleteTyped('') }}>
        <DialogContent size="md">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle>{t('deleteTitle')}</DialogTitle>
                <DialogDescription className="truncate">
                  {confirmDelete?.full_name || confirmDelete?.email}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody>
            <div className="rounded-[8px] border border-rose-200 bg-rose-50/80 p-3 space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">{t('deleteIrreversible')}</p>
              <p className="text-[11px] leading-relaxed text-[#7a5c5c]">{t('deleteConsequences')}</p>
              <ul className="space-y-0.5 text-[11px] text-[#7a5c5c]">
                <li>• {t('deleteCvProfile')}</li>
                <li>• {t('deleteApplications')}</li>
                <li>• {t('deleteCreditsSubs')}</li>
                <li>• {t('deleteNotifications')}</li>
              </ul>
            </div>

            <FormField id="delete-confirmation-input">
              <FormLabel>
                {t('deleteTypePrompt', { text: DELETE_CONFIRM_TEXT })}
              </FormLabel>
              <Input
                id="delete-confirmation-input"
                type="text"
                value={deleteTyped}
                onChange={(e) => setDeleteTyped(e.target.value)}
                placeholder={DELETE_CONFIRM_TEXT}
                error={deleteTyped.length > 0 && deleteTyped !== DELETE_CONFIRM_TEXT}
              />
            </FormField>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setConfirmDelete(null); setDeleteTyped('') }}
            >
              {ta('cancel')}
            </Button>
            <Button
              variant="danger"
              loading={updatingId === confirmDelete?.id}
              disabled={deleteTyped !== DELETE_CONFIRM_TEXT}
              onClick={() => confirmDelete && deleteUser(confirmDelete)}
            >
              {ta('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Sub-components & Badges ──

function Th({ children, onClick, sort }: { children: React.ReactNode; onClick: () => void; sort: React.ReactNode }) {
  return (
    <th
      onClick={onClick}
      className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5f6368] transition-colors hover:text-[#1d1d1f]"
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
    <Badge variant={role === 'admin' ? 'purple' : 'neutral'} dot={role === 'admin'}>
      {role === 'admin' && <Shield className="h-3 w-3 mr-0.5" aria-hidden="true" />}
      {role === 'admin' ? 'Admin' : 'Client'}
    </Badge>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const variant = tier === 'max' ? 'blue' : tier === 'pro' ? 'warning' : 'neutral'
  return (
    <Badge variant={variant} dot={tier === 'max' || tier === 'pro'}>
      {tier === 'max' && <Crown className="h-3 w-3 mr-0.5" aria-hidden="true" />}
      {tier}
    </Badge>
  )
}

function formatDate(date: string | null | undefined, locale: string) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
