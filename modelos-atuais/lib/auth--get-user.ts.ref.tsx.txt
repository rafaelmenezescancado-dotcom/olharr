import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { UserRole } from '@/generated/prisma/client'

export type AuthUser = {
  id: string
  authId: string
  name: string
  email: string
  role: UserRole
  avatarUrl: string | null
}

export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: {
      id: true,
      authId: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
    },
  })

  return dbUser
}
