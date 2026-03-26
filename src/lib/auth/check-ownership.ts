import type { AuthUser } from './get-user'

/**
 * Verifica se o usuário tem permissão para acessar/modificar um recurso.
 *
 * ADMIN sempre pode acessar tudo.
 * Outros roles só podem acessar recursos onde são o responsável/criador.
 *
 * Uso:
 *   const user = await requireRole(['ADMIN', 'PRODUTOR'])
 *   if (!canAccess(user, projeto.responsavelId)) {
 *     return { error: 'Sem permissão para editar este projeto' }
 *   }
 */
export function canAccess(
  user: AuthUser,
  ownerId: string | null | undefined
): boolean {
  // ADMIN pode tudo
  if (user.role === 'ADMIN') return true

  // Se não há owner definido, qualquer usuário com role correto pode acessar
  if (!ownerId) return true

  // Caso contrário, só o owner pode acessar
  return user.id === ownerId
}

/**
 * Versão que retorna um ActionResult de erro se não tiver permissão.
 * Retorna null se a permissão é válida.
 */
export function checkOwnership(
  user: AuthUser,
  ownerId: string | null | undefined,
  message = 'Sem permissão para esta ação'
): { error: string } | null {
  if (canAccess(user, ownerId)) return null
  return { error: message }
}
