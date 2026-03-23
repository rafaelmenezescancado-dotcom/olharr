'use client'

import { useState, useTransition } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Email ou senha inválidos.')
        return
      }
      router.push('/dashboard')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: '#F0EDF5' }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-10 w-full rounded-md px-3 text-sm"
          style={{ background: '#252035', border: '1px solid #3A3550', color: '#F0EDF5' }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: '#F0EDF5' }}>
          Senha
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="h-10 w-full rounded-md px-3 text-sm"
          style={{ background: '#252035', border: '1px solid #3A3550', color: '#F0EDF5' }}
        />
      </div>

      {error && (
        <p className="text-sm text-center" style={{ color: '#EF4444' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="h-10 w-full rounded-md text-sm font-semibold transition-opacity disabled:opacity-50"
        style={{ background: '#B52774', color: '#FFFFFF' }}
      >
        {isPending ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
