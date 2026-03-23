'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Clapperboard,
  Users,
  CheckSquare,
  Wallet,
  DollarSign,
  CreditCard,
  Star,
  Truck,
  Calendar,
  Instagram,
  GraduationCap,
  Settings,
  LogOut,
} from 'lucide-react'
import { logout } from '@/lib/auth/logout'
import { getInitials } from '@/lib/utils'
import type { AuthUser } from '@/lib/auth/get-user'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orcamentos', label: 'Orçamentos', icon: FileText },
  { href: '/projetos', label: 'Projetos', icon: Clapperboard },
  { href: '/crm', label: 'CRM', icon: Users },
  { href: '/tarefas', label: 'Tarefas', icon: CheckSquare },
  { href: '/fluxo-caixa', label: 'Fluxo de Caixa', icon: Wallet },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { href: '/financeiro/pagamentos-freela', label: 'Pag. Freelancers', icon: CreditCard },
  { href: '/talentos', label: 'Banco de Talentos', icon: Star },
  { href: '/fornecedores', label: 'Fornecedores', icon: Truck },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/calendario', label: 'Calendário Social', icon: Instagram },
  { href: '/formaturas', label: 'Formaturas', icon: GraduationCap },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  user: AuthUser
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="hidden lg:flex w-60 shrink-0 flex-col h-screen sticky top-0"
      style={{ background: '#252035', borderRight: '1px solid #3A3550' }}
    >
      {/* Logo */}
      <div
        className="flex h-14 items-center justify-center shrink-0"
        style={{ borderBottom: '1px solid #3A3550' }}
      >
        <span
          className="text-2xl font-bold tracking-widest"
          style={{ color: '#F0EDF5' }}
        >
          OLHARR
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              style={{
                background: isActive ? '#B52774' : 'transparent',
                color: isActive ? '#FFFFFF' : '#8B82A0',
              }}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid #3A3550' }}>
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: '#B52774', color: '#FFFFFF' }}
          >
            {getInitials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#F0EDF5' }}>
              {user.name}
            </p>
            <p className="text-xs truncate" style={{ color: '#8B82A0' }}>
              {user.role}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-xs transition-colors"
          style={{ color: '#8B82A0' }}
        >
          <LogOut className="size-3.5" />
          Sair
        </button>
      </div>
    </aside>
  )
}
