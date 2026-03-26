/**
 * Tipo padronizado para retorno de Server Actions.
 *
 * Resolve o problema de TypeScript onde `result.error` não é reconhecido
 * em union types `{ error: string } | { success: true }`.
 *
 * Com ActionResult, o TypeScript reconhece ambas as propriedades como opcionais.
 */
export type ActionResult<T = void> = {
  success?: boolean
  error?: string
} & (T extends void ? object : { data?: T })
