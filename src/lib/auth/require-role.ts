import { redirect } from 'next/navigation'
import { getUser } from './get-user'
import type { UserRole } from '@/generated/prisma/client'

export async function requireRole(roles: UserRole[]): Promise<NonNullable<Awaited<ReturnType<typeof getUser>>>> {
  const user = await getUser()
  if (!user) redirect('/login')
  if (!roles.includes(user.role)) redirect('/unauthorized')
  return user
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}
