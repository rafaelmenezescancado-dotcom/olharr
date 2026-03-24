import { prisma } from '@/lib/prisma'
import type { PostStatus } from '@/generated/prisma/client'

export const POST_STATUSES: PostStatus[] = [
  'RASCUNHO',
  'AGUARDANDO_APROVACAO',
  'APROVADO',
  'PUBLICADO',
  'REJEITADO',
]

export async function getPostsKanban() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const byStatus = POST_STATUSES.reduce((acc, s) => {
    acc[s] = []
    return acc
  }, {} as Record<PostStatus, typeof posts>)

  for (const p of posts) {
    byStatus[p.status].push(p)
  }

  return byStatus
}
