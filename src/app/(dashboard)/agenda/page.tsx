import { requireAuth } from '@/lib/auth/require-role'
import { getEventos } from '@/modules/agenda/queries'
import { getProjetosList } from '@/modules/projetos/queries'
import { AgendaList } from '@/components/agenda/agenda-list'

export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
  const user = await requireAuth()
  const [eventos, projetos] = await Promise.all([
    getEventos(),
    getProjetosList(),
  ])

  const eventosSer = eventos.map(e => ({
    ...e,
    inicio: e.inicio,
    fim: e.fim,
  }))

  return <AgendaList eventos={eventosSer} projetos={projetos} />
}
