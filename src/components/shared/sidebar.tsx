'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Clapperboard,
  Users,
  DollarSign,
  BarChart3,
  Wallet,
  Receipt,
  CreditCard,
  Truck,
  Star,
  Package,
  Calendar,
  Instagram,
  GraduationCap,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { logout } from '@/lib/auth/logout'
import { getInitials } from '@/lib/utils'
import type { AuthUser } from '@/lib/auth/get-user'

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
}

type NavGroup = {
  label: string
  icon: typeof LayoutDashboard
  children: NavItem[]
}

type NavEntry = NavItem | NavGroup

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry
}

const navEntries: NavEntry[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orcamentos', label: 'Orçamentos', icon: FileText },
  { href: '/projetos', label: 'Projetos', icon: Clapperboard },
  { href: '/crm', label: 'CRM', icon: Users },
  {
    label: 'Financeiro',
    icon: DollarSign,
    children: [
      { href: '/financeiro', label: 'Dashboard Financeiro', icon: BarChart3 },
      { href: '/fluxo-caixa', label: 'Fluxo de Caixa', icon: Wallet },
      { href: '/financeiro/custos', label: 'Descrição de Custos', icon: Receipt },
      { href: '/financeiro/pagamentos-freela', label: 'Provisionamento de Pagamento', icon: CreditCard },
    ],
  },
  {
    label: 'Fornecedores',
    icon: Truck,
    children: [
      { href: '/talentos', label: 'Banco de Talentos', icon: Star },
      { href: '/fornecedores/insumos', label: 'Insumos', icon: Package },
    ],
  },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/calendario', label: 'Calendário Social', icon: Instagram },
  { href: '/formaturas', label: 'Formaturas', icon: GraduationCap },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'ADMIN',
  PRODUTOR: 'PRODUTOR',
  FINANCEIRO: 'FINANCEIRO',
  EXTERNO: 'EXTERNO',
}

interface SidebarProps {
  user: AuthUser
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [openGroups, setOpenGroups] = useState<string[]>([])

  function toggleGroup(label: string) {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    )
  }

  function isGroupActive(group: NavGroup) {
    return group.children.some(
      (child) => pathname === child.href || pathname.startsWith(child.href + '/')
    )
  }

  function isItemActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Auto-open groups that contain the active route
  const effectiveOpenGroups = [...openGroups]
  for (const entry of navEntries) {
    if (isGroup(entry) && isGroupActive(entry) && !effectiveOpenGroups.includes(entry.label)) {
      effectiveOpenGroups.push(entry.label)
    }
  }

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="hidden lg:flex shrink-0 flex-col h-screen sticky top-0 overflow-hidden z-40"
      style={{
        width: expanded ? 240 : 68,
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRight: '1px solid #E8E3F5',
      }}
    >
      {/* Logo */}
      <div
        className="flex h-16 items-center gap-3 shrink-0"
        style={{ borderBottom: '1px solid #E8E3F5', paddingLeft: 18, paddingRight: 18 }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: '#8b5cf6', color: '#fff' }}
        >
          O
        </div>
        <span
          className="text-sm font-bold tracking-widest whitespace-nowrap"
          style={{
            color: '#393939',
            letterSpacing: '0.2em',
            opacity: expanded ? 1 : 0,
            transition: 'opacity 200ms',
          }}
        >
          OLHARR
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-0.5" style={{ paddingLeft: 10, paddingRight: 10 }}>
        {navEntries.map((entry) => {
          if (!isGroup(entry)) {
            const Icon = entry.icon
            const active = isItemActive(entry.href)
            return (
              <Link
                key={entry.href}
                href={entry.href}
                className="relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap"
                style={{
                  background: active ? '#8b5cf6' : 'transparent',
                  color: active ? '#FFFFFF' : '#676767',
                  transition: 'background 150ms',
                }}
              >
                <Icon className="size-4 shrink-0" />
                <span
                  style={{
                    flex: 1,
                    opacity: expanded ? 1 : 0,
                    transition: 'opacity 200ms',
                  }}
                >
                  {entry.label}
                </span>
                {active && (
                  <ChevronRight
                    className="size-3.5 shrink-0"
                    style={{
                      opacity: expanded ? 0.8 : 0,
                      transition: 'opacity 200ms',
                    }}
                  />
                )}
              </Link>
            )
          }

          // Group
          const Icon = entry.icon
          const groupActive = isGroupActive(entry)
          const groupOpen = effectiveOpenGroups.includes(entry.label) && expanded

          return (
            <div key={entry.label}>
              {/* Group header */}
              <button
                type="button"
                onClick={() => expanded && toggleGroup(entry.label)}
                className="relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap w-full"
                style={{
                  background: groupActive && !expanded ? '#8b5cf6' : 'transparent',
                  color: groupActive ? (expanded ? '#8b5cf6' : '#FFFFFF') : '#676767',
                  transition: 'background 150ms, color 150ms',
                }}
              >
                <Icon className="size-4 shrink-0" />
                <span
                  style={{
                    flex: 1,
                    opacity: expanded ? 1 : 0,
                    transition: 'opacity 200ms',
                    textAlign: 'left',
                  }}
                >
                  {entry.label}
                </span>
                {expanded && (
                  <ChevronDown
                    className="size-3.5 shrink-0"
                    style={{
                      opacity: expanded ? 0.6 : 0,
                      transition: 'opacity 200ms, transform 200ms',
                      transform: groupOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    }}
                  />
                )}
              </button>

              {/* Group children */}
              <div
                style={{
                  maxHeight: groupOpen ? `${entry.children.length * 40}px` : '0px',
                  overflow: 'hidden',
                  transition: 'max-height 200ms ease-in-out',
                }}
              >
                {entry.children.map((child) => {
                  const ChildIcon = child.icon
                  const childActive = isItemActive(child.href)
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="relative flex items-center gap-2.5 rounded-xl py-2 text-sm font-medium whitespace-nowrap"
                      style={{
                        paddingLeft: 36,
                        paddingRight: 12,
                        background: childActive ? '#8b5cf6' : 'transparent',
                        color: childActive ? '#FFFFFF' : '#676767',
                        transition: 'background 150ms',
                      }}
                    >
                      <ChildIcon className="size-3.5 shrink-0" />
                      <span
                        className="truncate"
                        style={{
                          flex: 1,
                          opacity: expanded ? 1 : 0,
                          transition: 'opacity 200ms',
                        }}
                      >
                        {child.label}
                      </span>
                      {childActive && (
                        <ChevronRight
                          className="size-3 shrink-0"
                          style={{ opacity: 0.8 }}
                        />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User */}
      <div className="shrink-0" style={{ borderTop: '1px solid #E8E3F5', padding: '16px 12px' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #5523c6 100%)',
              color: '#fff',
            }}
          >
            {getInitials(user.name)}
          </div>
          <div
            className="flex-1 min-w-0"
            style={{ opacity: expanded ? 1 : 0, transition: 'opacity 200ms' }}
          >
            <p className="text-sm font-semibold truncate" style={{ color: '#1C1730' }}>
              {user.name}
            </p>
            <p
              className="text-xs font-medium tracking-widest"
              style={{ color: '#8b5cf6', letterSpacing: '0.08em' }}
            >
              {ROLE_LABELS[user.role] ?? user.role}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap"
          style={{ color: '#676767', background: 'rgba(139,92,246,0.06)' }}
        >
          <LogOut className="size-3.5 shrink-0" />
          <span style={{ opacity: expanded ? 1 : 0, transition: 'opacity 200ms' }}>
            Sair da conta
          </span>
        </button>
      </div>
    </aside>
  )
}
