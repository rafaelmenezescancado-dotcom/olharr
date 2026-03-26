/**
 * Logger centralizado para Server Actions e queries.
 * Em produção, logs vão para stdout (capturados pelo Vercel Logs).
 * Futuramente pode integrar Sentry, Axiom, etc.
 */

type LogLevel = 'info' | 'warn' | 'error'

interface LogContext {
  action?: string
  userId?: string
  entityId?: string
  [key: string]: unknown
}

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString()
  const ctx = context ? ` ${JSON.stringify(context)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctx}`
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.log(formatLog('info', message, context))
  },

  warn(message: string, context?: LogContext) {
    console.warn(formatLog('warn', message, context))
  },

  error(message: string, error?: unknown, context?: LogContext) {
    const errorInfo = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack?.split('\n').slice(0, 3).join(' → ') }
      : { raw: String(error) }

    console.error(formatLog('error', message, { ...context, error: errorInfo }))
  },
}

/**
 * Helper para usar em catch blocks de Server Actions.
 * Loga o erro com contexto e retorna mensagem user-friendly.
 */
export function handleActionError(
  action: string,
  error: unknown,
  userMessage: string,
  context?: Omit<LogContext, 'action'>
): { error: string } {
  logger.error(`Falha em ${action}`, error, { action, ...context })
  return { error: userMessage }
}
