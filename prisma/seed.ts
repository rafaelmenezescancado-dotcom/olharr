import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config } from 'dotenv'
config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ─── HELPERS ────────────────────────────────────────────────────────────────

function classifyTransaction(
  descricao: string,
  type: 'ENTRADA' | 'SAIDA',
  amount: number,
  dateStr: string,
  freelancerMap: Map<string, string>,
): { categoria?: string; descOverride?: string } {
  const desc = descricao.trim()

  if (type === 'ENTRADA') return {}

  // Rafael retirada do sócio
  if (desc === 'Rafael Menezes Cancado' && amount === 10000 && dateStr === '05/02/2026') {
    return { categoria: 'CUSTO_FIXO / SALARIOS_FIXOS', descOverride: 'Retirada do sócio' }
  }

  if (desc === 'Joao Vitor Araujo Da Silva') {
    return { categoria: 'CUSTO_FIXO / CUSTOS_ESCRITORIO' }
  }
  if (desc === 'Roberto Pereira De Souza Neto') {
    return { categoria: 'CUSTO_PROJETO / OUTROS' }
  }
  if (desc === 'Safra Imoveis') {
    return { categoria: 'CUSTO_FIXO / ALUGUEL' }
  }
  if (desc.includes('CEMIG') || desc.includes('Copasa')) {
    return { categoria: 'CUSTO_FIXO / CUSTOS_ESCRITORIO' }
  }
  if (desc.includes('Receita Federal') || desc.includes('Simples Nacional')) {
    return { categoria: 'CUSTO_FIXO / IMPOSTOS' }
  }
  if (desc.includes('Fatura') || desc.includes('Pagamento Fatura')) {
    return { categoria: 'CUSTO_FIXO / OUTROS' }
  }
  if (desc.startsWith('Ref.:')) {
    return { categoria: 'CUSTO_FIXO / EMPRESTIMO' }
  }
  if (freelancerMap.has(desc)) {
    return { categoria: 'CUSTO_PROJETO / CACHE_EQUIPE' }
  }

  return { categoria: 'CUSTO_PROJETO / OUTROS' }
}

function parseTransaction(
  line: string,
  accountId: string,
  freelancerMap: Map<string, string>,
) {
  const [dateStr, historico, descricao, valorStr] = line.split(';')
  const [day, month, year] = dateStr.split('/')
  const date = new Date(+year, +month - 1, +day, 12, 0, 0)

  const valorClean = valorStr.replace(/\./g, '').replace(',', '.')
  const valor = parseFloat(valorClean)
  const isEntrada = valor > 0
  const amount = Math.abs(valor)

  const type = isEntrada ? 'ENTRADA' as const : 'SAIDA' as const
  const desc = descricao.trim()
  const classification = classifyTransaction(desc, type, amount, dateStr, freelancerMap)

  const externalId = `inter-${dateStr}-${desc.substring(0, 30)}-${valorClean}`

  return {
    data: date,
    tipo: type,
    valor: amount,
    descricao: classification.descOverride || desc,
    categoria: classification.categoria || historico.trim(),
    contaId: accountId,
    externalId,
  }
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🗑️  Limpando dados existentes...')

  // Delete in FK order
  await prisma.custoEventoTurma.deleteMany()
  await prisma.eventoTurma.deleteMany()
  await prisma.parcelaFormando.deleteMany()
  await prisma.formando.deleteMany()
  await prisma.turmaFormatura.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.post.deleteMany()
  await prisma.agendaEvent.deleteMany()
  await prisma.crmInteracao.deleteMany()
  await prisma.crmFollowUp.deleteMany()
  await prisma.orcamentoItem.deleteMany()
  await prisma.orcamento.deleteMany()
  await prisma.tarefa.deleteMany()
  await prisma.pagamentoFreelancer.deleteMany()
  await prisma.projectCost.deleteMany()
  await prisma.projetoLabel.deleteMany()
  await prisma.project.deleteMany()
  await prisma.label.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.financialAccount.deleteMany()
  await prisma.freelancer.deleteMany()
  await prisma.clienteContatoOperacional.deleteMany()
  await prisma.clienteContatoFinanceiro.deleteMany()
  await prisma.client.deleteMany()
  await prisma.fornecedor.deleteMany()

  console.log('✅ Dados limpos')

  // ── 1. Find existing user (contato@olharr.com.br) ──
  const user = await prisma.user.findFirst({ where: { email: 'contato@olharr.com.br' } })
  if (!user) {
    throw new Error('Usuário contato@olharr.com.br não encontrado. Crie-o antes de rodar o seed.')
  }
  console.log(`✅ Usuário encontrado: ${user.name} (${user.email})`)

  // ── 2. Clientes ──
  const clientNames = [
    'Night Market', 'doBrasil', 'Maionoise', 'EXP', 'Be Smart', 'Alliance',
    'BeBox', 'Macaco', 'CEMIG', 'Doizum', 'Havayanas Usadas', 'FMD',
    'GERDAU', 'Natália Sereno', 'AMCHAM', 'Núcleo X', 'Kelly', 'Distrital',
  ]

  const clienteMap = new Map<string, { id: string }>()
  for (const name of clientNames) {
    const client = await prisma.client.create({
      data: { name, stage: 'FECHADO_GANHO' },
    })
    clienteMap.set(name, client)
  }
  console.log(`✅ ${clientNames.length} clientes criados`)

  // ── 3. Freelancers ──
  const freelancerData = [
    { name: 'Rafael Menezes', fullName: 'Rafael Menezes Cancado', specialties: ['Produção', 'Fotografia', 'Direção'] },
    { name: 'Rafael Macedo', fullName: 'Rafael Macedo Guimaraes', specialties: ['Edição', 'Motion'] },
    { name: 'Igor Soares', fullName: 'Igor Soares Figueiredo', specialties: ['Fotografia', 'Vídeo'] },
    { name: 'Toshiba', fullName: 'Viggiano', specialties: ['Fotografia'] },
    { name: 'Mateus Costa', fullName: 'Mateus Costa De Almeida', specialties: ['Vídeo', 'Drone'] },
    { name: 'Guilherme Monteiro', fullName: 'Antonio Guilherme Monteiro Costa', specialties: ['Vídeo', 'Edição'] },
    { name: 'Veagá', fullName: 'Victor Hugo Ribeiro Barbosa', specialties: ['Produção'] },
    { name: 'Daniboy', fullName: null, specialties: ['Fotografia'] },
    { name: 'Bean', fullName: 'Joao Paulo Macedo Prais', specialties: ['Vídeo'] },
    { name: 'Beatriz Werneck', fullName: 'Beatriz Alves Werneck', specialties: [] as string[] },
    { name: 'Bruno Werneck', fullName: 'Bruno Alves Werneck', specialties: [] as string[] },
    { name: 'Charles', fullName: 'Charles Pereira Cardoso', specialties: [] as string[] },
    { name: 'Daniel', fullName: 'Daniel Felipe Duarte De Oliveira', specialties: [] as string[] },
    { name: 'Dany', fullName: 'Daniely Ferreira Sousa', specialties: [] as string[] },
    { name: 'Davi', fullName: 'Davi Ribeiro De Souza', specialties: [] as string[] },
    { name: 'Gilberto', fullName: 'Gilberto Martins Machado Junior', specialties: [] as string[] },
    { name: 'Igor Monte', fullName: 'Igor Nunes Monteiro', specialties: [] as string[] },
    { name: 'Jamal', fullName: 'Jml Company Audiovisual', specialties: [] as string[] },
    { name: 'Lais', fullName: 'Lais Cristina De Oliveira Souza', specialties: [] as string[] },
    { name: 'Lari', fullName: 'Larissa Silva Maia', specialties: [] as string[] },
    { name: 'Marcão', fullName: 'Luiza Helena Abreu Primo', specialties: [] as string[] },
    { name: 'Nath', fullName: 'Nathalia Kathleen Mendes Fonseca Candido', specialties: [] as string[] },
    { name: 'Tharick', fullName: 'Tharick Ranie Lourenco Dos Santos', specialties: [] as string[] },
    { name: 'Túlio Barros', fullName: 'Tulio Galvao Barros', specialties: [] as string[] },
    { name: 'Raquel', fullName: null, specialties: [] as string[] },
    { name: 'Rabetim', fullName: null, specialties: [] as string[] },
    { name: 'Ana Vasconcelos', fullName: 'Ana Carolina Vasconcelos Gonçalves', specialties: [] as string[] },
    { name: 'Julia Dias', fullName: null, specialties: [] as string[] },
    { name: 'Léo Kesley', fullName: null, specialties: [] as string[] },
    { name: 'Rodolfo', fullName: 'Rodolgo Magela Silva', specialties: [] as string[] },
  ]

  const freelancerMap = new Map<string, string>() // fullName → id
  const freelancerByNickname = new Map<string, string>() // nickname → id

  for (const f of freelancerData) {
    const created = await prisma.freelancer.create({
      data: {
        name: f.name,
        fullName: f.fullName,
        specialties: f.specialties,
      },
    })
    freelancerByNickname.set(f.name, created.id)
    if (f.fullName) {
      freelancerMap.set(f.fullName, created.id)
    }
  }

  // Aliases for bank extract names
  freelancerMap.set('62 030 767 Rafael Macedo Guimaraes', freelancerByNickname.get('Rafael Macedo')!)
  freelancerMap.set('Tulio Galvao Barros 08053621694', freelancerByNickname.get('Túlio Barros')!)

  console.log(`✅ ${freelancerData.length} freelancers criados`)

  // Nickname → freelancer ID mapping for events
  const nicknameToId: Record<string, string> = {
    'RAFAEL MENEZES': freelancerByNickname.get('Rafael Menezes')!,
    'RAFAEL MACEDO': freelancerByNickname.get('Rafael Macedo')!,
    'IGOR': freelancerByNickname.get('Igor Soares')!,
    'TOSHIBA': freelancerByNickname.get('Toshiba')!,
    'MORENO': freelancerByNickname.get('Mateus Costa')!,
    'MATEUS COSTA': freelancerByNickname.get('Mateus Costa')!,
    'GUILHERME': freelancerByNickname.get('Guilherme Monteiro')!,
    'VEAGÁ': freelancerByNickname.get('Veagá')!,
    'DANIBOY': freelancerByNickname.get('Daniboy')!,
    'BEAN': freelancerByNickname.get('Bean')!,
    'BEATRIZ': freelancerByNickname.get('Beatriz Werneck')!,
    'WERNECK': freelancerByNickname.get('Bruno Werneck')!,
    'BRUNO': freelancerByNickname.get('Bruno Werneck')!,
    'CHARLES': freelancerByNickname.get('Charles')!,
    'DANIEL': freelancerByNickname.get('Daniel')!,
    'DANY': freelancerByNickname.get('Dany')!,
    'DAVI': freelancerByNickname.get('Davi')!,
    'GILBERTO': freelancerByNickname.get('Gilberto')!,
    'IGOR MONTE': freelancerByNickname.get('Igor Monte')!,
    'JAMAL': freelancerByNickname.get('Jamal')!,
    'LAIS CRISTINA': freelancerByNickname.get('Lais')!,
    'LARISSA': freelancerByNickname.get('Lari')!,
    'MARCÃO': freelancerByNickname.get('Marcão')!,
    'NATH': freelancerByNickname.get('Nath')!,
    'THARICK': freelancerByNickname.get('Tharick')!,
    'TULIO': freelancerByNickname.get('Túlio Barros')!,
    'TÚLIO': freelancerByNickname.get('Túlio Barros')!,
    'RAQUEL': freelancerByNickname.get('Raquel')!,
    'RABETIM': freelancerByNickname.get('Rabetim')!,
    'ANA VASCONCELOS': freelancerByNickname.get('Ana Vasconcelos')!,
    'JULIA DIAS': freelancerByNickname.get('Julia Dias')!,
    'LÉO KESLEY': freelancerByNickname.get('Léo Kesley')!,
    'RODOLFO': freelancerByNickname.get('Rodolfo')!,
  }

  // ── 4. Contas Financeiras ──
  const asaas = await prisma.financialAccount.create({ data: { nome: 'Asaas', banco: 'Asaas', tipo: 'CORRENTE' } })
  const inter = await prisma.financialAccount.create({ data: { nome: 'Inter', banco: 'Inter', tipo: 'CORRENTE' } })
  console.log('✅ 2 contas financeiras criadas')

  // ── 5. Orçamentos + Projetos (44 eventos) ──

  const clienteAlias: Record<string, string> = {
    'NIGHT MARKET': 'Night Market',
    'DOBRASIL': 'doBrasil',
    'MAIONOISE': 'Maionoise',
    'EXP': 'EXP',
    'BE SMART': 'Be Smart',
    'ALIANCE': 'Alliance',
    'BEBOX': 'BeBox',
    'MACACO': 'Macaco',
    'CEMIG': 'CEMIG',
    'DOIZUM': 'Doizum',
    'HAVAYANAS USADAS': 'Havayanas Usadas',
    'FMD': 'FMD',
    'GERDAU': 'GERDAU',
    'NATÁLIA SERENO': 'Natália Sereno',
    'AMCHAM': 'AMCHAM',
    'NUCLEO X': 'Núcleo X',
    'GABRIELA ANTUNES': 'Havayanas Usadas',
    'KELLY': 'Kelly',
    'DISTRITAL': 'Distrital',
  }

  interface EventData {
    title: string
    date: string
    vertente: string
    subvertente: string
    captacao: string
    custo: number
    venda: number
    freelas: string[]
    custosFreelas: number[]
    outrosCustos: string[]
    valorOutrosCustos: number[]
    cliente: string
  }

  const eventos: EventData[] = [
    // ── JANEIRO 2026 ──
    {
      title: 'Reveillon Night Market', date: '01/01/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'BALADA', captacao: 'OLHARR',
      custo: 1000, venda: 1500,
      freelas: ['LARISSA'], custosFreelas: [1000],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'NIGHT MARKET',
    },
    {
      title: 'CEMIG - doBrasil', date: '15/01/2026',
      vertente: 'CORPORATIVO', subvertente: 'EVENTO', captacao: 'RAFAEL MENEZES',
      custo: 3300, venda: 5410,
      freelas: ['IGOR', 'VEAGÁ', 'TOSHIBA'], custosFreelas: [850, 1500, 500],
      outrosCustos: ['LOGÍSTICA', 'ALIMENTAÇÃO'], valorOutrosCustos: [300, 150],
      cliente: 'DOBRASIL',
    },
    {
      title: 'Aniversário 70 anos Ademir', date: '17/01/2026',
      vertente: 'PARTICULAR', subvertente: 'ANIVERSÁRIO', captacao: 'OLHARR',
      custo: 680, venda: 1080,
      freelas: ['MORENO'], custosFreelas: [680],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'NATÁLIA SERENO',
    },
    {
      title: 'Maionoise', date: '23/01/2026',
      vertente: 'CORPORATIVO', subvertente: 'EVENTO', captacao: 'OLHARR',
      custo: 1709, venda: 2500,
      freelas: ['IGOR', 'RAFAEL MACEDO'], custosFreelas: [1100, 550],
      outrosCustos: ['LOGÍSTICA'], valorOutrosCustos: [59],
      cliente: 'MAIONOISE',
    },
    {
      title: 'EXP Baile Formatura', date: '24/01/2026',
      vertente: 'FORMATURA', subvertente: 'BAILE', captacao: 'RAFAEL MENEZES',
      custo: 4060, venda: 5000,
      freelas: ['MORENO', 'GUILHERME'], custosFreelas: [1400, 2100],
      outrosCustos: ['LOGÍSTICA'], valorOutrosCustos: [560.27],
      cliente: 'EXP',
    },
    {
      title: 'Smart Experience', date: '29/01/2026',
      vertente: 'CORPORATIVO', subvertente: 'EVENTO', captacao: 'OLHARR',
      custo: 27000, venda: 37900,
      freelas: ['JAMAL', 'NATH', 'TOSHIBA', 'TÚLIO', 'VEAGÁ', 'BEATRIZ', 'CHARLES', 'BEAN', 'RAFAEL MACEDO'],
      custosFreelas: [3000, 6000, 2000, 1500, 800, 1600, 3600, 1500, 900],
      outrosCustos: ['LOGÍSTICA', 'NF'], valorOutrosCustos: [3000, 3100],
      cliente: 'BE SMART',
    },
    {
      title: 'Maionoise Ensaio', date: '29/01/2026',
      vertente: 'CORPORATIVO', subvertente: 'ENSAIO', captacao: 'OLHARR',
      custo: 1000, venda: 2000,
      freelas: ['DANIEL'], custosFreelas: [1000],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'MAIONOISE',
    },
    {
      title: 'Jantar Alliance', date: '29/01/2026',
      vertente: 'FORMATURA', subvertente: 'EVENTO', captacao: 'OLHARR',
      custo: 300, venda: 0,
      freelas: ['DANIEL'], custosFreelas: [300],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'ALIANCE',
    },
    {
      title: 'Love Wine', date: '31/01/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'BALADA', captacao: 'OLHARR',
      custo: 2800, venda: 4000,
      freelas: ['IGOR', 'VEAGÁ', 'DAVI'], custosFreelas: [800, 1000, 1000],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'BEBOX',
    },
    // ── FEVEREIRO 2026 ──
    {
      title: 'Baile do Birico', date: '01/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'BALADA', captacao: 'OLHARR',
      custo: 2800, venda: 4200,
      freelas: ['IGOR', 'GUILHERME', 'DAVI'], custosFreelas: [800, 1000, 1000],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'BEBOX',
    },
    {
      title: 'Bloco do Sarará', date: '01/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'CARNAVAL', captacao: 'OLHARR',
      custo: 2000, venda: 3000,
      freelas: ['IGOR', 'LARISSA'], custosFreelas: [1200, 800],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'MACACO',
    },
    {
      title: 'Bloco Besourinhos', date: '08/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'CARNAVAL', captacao: 'VEAGÁ',
      custo: 1150, venda: 1539,
      freelas: ['VEAGÁ', 'RAQUEL'], custosFreelas: [1000, 150],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'CEMIG',
    },
    {
      title: 'Carnakvsh', date: '08/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'CARNAVAL', captacao: 'VEAGÁ',
      custo: 2150, venda: 2877,
      freelas: ['VEAGÁ', 'RAQUEL', 'IGOR'], custosFreelas: [1000, 150, 1000],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'CEMIG',
    },
    {
      title: 'Plano de Voo - AMCHAM', date: '09/02/2026',
      vertente: 'CORPORATIVO', subvertente: 'EVENTO', captacao: 'OLHARR',
      custo: 6178, venda: 8800,
      freelas: ['TULIO', 'IGOR', 'GUILHERME', 'VEAGÁ', 'LAIS CRISTINA', 'BEATRIZ'],
      custosFreelas: [800, 800, 1800, 800, 400, 800],
      outrosCustos: ['NF', 'LOGÍSTICA'], valorOutrosCustos: [578, 200],
      cliente: 'AMCHAM',
    },
    {
      title: 'Ensaio CMR', date: '10/02/2026',
      vertente: 'CORPORATIVO', subvertente: 'ENSAIO', captacao: 'VEAGÁ',
      custo: 1200, venda: 1800,
      freelas: ['RAFAEL MENEZES'], custosFreelas: [1200],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'AMCHAM',
    },
    {
      title: 'Maionoise Fev', date: '11/02/2026',
      vertente: 'CORPORATIVO', subvertente: 'EVENTO', captacao: 'OLHARR',
      custo: 1125, venda: 1500,
      freelas: ['RAFAEL MACEDO', 'IGOR'], custosFreelas: [750, 375],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'MAIONOISE',
    },
    {
      title: 'Bloco Chama o Síndico', date: '11/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'CARNAVAL', captacao: 'VEAGÁ',
      custo: 3300, venda: 4417,
      freelas: ['VEAGÁ', 'IGOR', 'DAVI', 'RAQUEL', 'RAFAEL MACEDO'],
      custosFreelas: [1000, 1000, 1000, 150, 150],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'CEMIG',
    },
    {
      title: 'Maionoise 12/02', date: '12/02/2026',
      vertente: 'CORPORATIVO', subvertente: 'EVENTO', captacao: 'OLHARR',
      custo: 2100, venda: 3150,
      freelas: ['RAFAEL MACEDO', 'RAFAEL MENEZES', 'DANIEL'],
      custosFreelas: [700, 450, 950],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'MAIONOISE',
    },
    {
      title: 'Maionoise 13/02', date: '13/02/2026',
      vertente: 'CORPORATIVO', subvertente: 'EVENTO', captacao: 'OLHARR',
      custo: 2100, venda: 2800,
      freelas: ['RAFAEL MACEDO', 'DANIEL', 'BEATRIZ'],
      custosFreelas: [800, 800, 500],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'MAIONOISE',
    },
    {
      title: 'Bloco Diretucada', date: '13/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'CARNAVAL', captacao: 'OLHARR',
      custo: 600, venda: 0,
      freelas: ['BEAN'], custosFreelas: [600],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'NUCLEO X',
    },
    {
      title: 'Baile do Birico 13/02', date: '13/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'BALADA', captacao: 'OLHARR',
      custo: 1800, venda: 2500,
      freelas: ['IGOR', 'DANY'], custosFreelas: [1000, 800],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'BEBOX',
    },
    {
      title: 'Bloco WS Elétrico', date: '13/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'CARNAVAL', captacao: 'VEAGÁ',
      custo: 3300, venda: 4417,
      freelas: ['VEAGÁ', 'GUILHERME', 'DAVI', 'RAQUEL', 'TOSHIBA'],
      custosFreelas: [1000, 1000, 1000, 150, 150],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'CEMIG',
    },
    {
      title: 'Então Brilha', date: '14/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'CARNAVAL', captacao: 'OLHARR',
      custo: 4900, venda: 7500,
      freelas: ['VEAGÁ', 'GUILHERME', 'GILBERTO', 'DAVI', 'DANY', 'TOSHIBA'],
      custosFreelas: [1200, 1200, 1200, 1000, 150, 150],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'DOIZUM',
    },
    {
      title: 'Night Market 14/02', date: '14/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'BALADA', captacao: 'OLHARR',
      custo: 560, venda: 800,
      freelas: ['RAFAEL MACEDO'], custosFreelas: [560],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'NIGHT MARKET',
    },
    {
      title: 'Bloco QCSL', date: '14/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'CARNAVAL', captacao: 'VEAGÁ',
      custo: 3300, venda: 4417,
      freelas: ['VEAGÁ', 'IGOR', 'DAVI', 'RAQUEL', 'DANY'],
      custosFreelas: [1000, 1000, 1000, 150, 150],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'CEMIG',
    },
    {
      title: 'É o Amor', date: '15/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'CARNAVAL', captacao: 'OLHARR',
      custo: 6200, venda: 9000,
      freelas: ['IGOR', 'RAFAEL MACEDO', 'DANIEL', 'GUILHERME', 'VEAGÁ', 'DANY', 'DAVI', 'RABETIM'],
      custosFreelas: [850, 850, 850, 900, 900, 500, 1200, 150],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'GABRIELA ANTUNES',
    },
    {
      title: 'Night Market 15/02', date: '15/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'BALADA', captacao: 'OLHARR',
      custo: 560, venda: 800,
      freelas: ['LARISSA'], custosFreelas: [560],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'NIGHT MARKET',
    },
    {
      title: 'Havayanas Usadas', date: '16/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'CARNAVAL', captacao: 'OLHARR',
      custo: 7000, venda: 11400,
      freelas: ['IGOR', 'RAFAEL MACEDO', 'DANIEL', 'ANA VASCONCELOS', 'VEAGÁ', 'DANY', 'DAVI', 'RABETIM'],
      custosFreelas: [850, 850, 850, 900, 1300, 900, 1200, 150],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'HAVAYANAS USADAS',
    },
    {
      title: 'Night Market 16/02', date: '16/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'BALADA', captacao: 'OLHARR',
      custo: 560, venda: 800,
      freelas: ['RAFAEL MACEDO'], custosFreelas: [560],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'NIGHT MARKET',
    },
    {
      title: 'Casa CEMIG', date: '16/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'CARNAVAL', captacao: 'VEAGÁ',
      custo: 3150, venda: 4216,
      freelas: ['VEAGÁ', 'RAQUEL'], custosFreelas: [3000, 150],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'CEMIG',
    },
    {
      title: 'Baile Distrital', date: '16/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'CARNAVAL', captacao: 'OLHARR',
      custo: 4500, venda: 6700,
      freelas: ['RODOLFO', 'GUILHERME', 'GILBERTO'],
      custosFreelas: [1500, 1500, 1500],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'BEBOX',
    },
    {
      title: 'Bloco Pisa na Fulô', date: '17/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'CARNAVAL', captacao: 'VEAGÁ',
      custo: 2300, venda: 3078,
      freelas: ['VEAGÁ', 'DAVI', 'RAQUEL', 'DANY'],
      custosFreelas: [1000, 1000, 150, 150],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'CEMIG',
    },
    {
      title: 'Panorama', date: '26/02/2026',
      vertente: 'CORPORATIVO', subvertente: 'EVENTO', captacao: 'OLHARR',
      custo: 1900, venda: 3750,
      freelas: ['VEAGÁ', 'RAFAEL MACEDO'], custosFreelas: [1200, 700],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'FMD',
    },
    {
      title: 'AMCHAM Jantar', date: '26/02/2026',
      vertente: 'CORPORATIVO', subvertente: 'EVENTO', captacao: 'OLHARR',
      custo: 2100, venda: 3000,
      freelas: ['RAFAEL MACEDO', 'GILBERTO'], custosFreelas: [600, 1500],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'AMCHAM',
    },
    {
      title: 'Maionoise 28/02', date: '28/02/2026',
      vertente: 'CORPORATIVO', subvertente: 'EVENTO', captacao: 'OLHARR',
      custo: 2250, venda: 3250,
      freelas: ['IGOR', 'VEAGÁ'], custosFreelas: [750, 1500],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'AMCHAM',
    },
    {
      title: '15 Anos Luiza', date: '28/02/2026',
      vertente: 'PARTICULAR', subvertente: '15 ANOS', captacao: 'OLHARR',
      custo: 4100, venda: 5500,
      freelas: ['DANIEL', 'IGOR', 'GUILHERME', 'RAFAEL MACEDO'],
      custosFreelas: [1000, 1000, 1500, 600],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'KELLY',
    },
    {
      title: 'Savá Distrital', date: '28/02/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'BALADA', captacao: 'IGOR',
      custo: 1500, venda: 1600,
      freelas: ['MORENO', 'DANY'], custosFreelas: [750, 750],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'DISTRITAL',
    },
    // ── MARÇO 2026 ──
    {
      title: 'Foto Empreendimento', date: '02/03/2026',
      vertente: 'CORPORATIVO', subvertente: 'EVENTO', captacao: 'OLHARR',
      custo: 450, venda: 800,
      freelas: ['RAFAEL MENEZES'], custosFreelas: [450],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'MAIONOISE',
    },
    {
      title: 'Calourada COMED 171', date: '02/03/2026',
      vertente: 'FORMATURA', subvertente: 'EVENTO', captacao: 'OLHARR',
      custo: 1500, venda: 0,
      freelas: ['RAFAEL MENEZES', 'RAFAEL MACEDO', 'DANIEL'],
      custosFreelas: [600, 300, 600],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'NUCLEO X',
    },
    {
      title: 'Trote COMED 171', date: '06/03/2026',
      vertente: 'FORMATURA', subvertente: 'EVENTO', captacao: 'OLHARR',
      custo: 500, venda: 0,
      freelas: ['LARISSA'], custosFreelas: [500],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'NUCLEO X',
    },
    {
      title: 'Night Market 08/03', date: '08/03/2026',
      vertente: 'SHOWS E FESTAS', subvertente: 'BALADA', captacao: 'OLHARR',
      custo: 380, venda: 450,
      freelas: ['DANIEL'], custosFreelas: [380],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'NIGHT MARKET',
    },
    {
      title: 'Maionoise Ensaio Mar', date: '10/03/2026',
      vertente: 'CORPORATIVO', subvertente: 'ENSAIO', captacao: 'OLHARR',
      custo: 550, venda: 650,
      freelas: ['RAFAEL MENEZES'], custosFreelas: [550],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'MAIONOISE',
    },
    {
      title: 'GERDAU', date: '12/03/2026',
      vertente: 'CORPORATIVO', subvertente: 'EVENTO', captacao: 'OLHARR',
      custo: 1200, venda: 1700,
      freelas: ['RAFAEL MACEDO'], custosFreelas: [1200],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'GERDAU',
    },
    {
      title: 'Ensaio Convite - Arquitetura PUC', date: '20/03/2026',
      vertente: 'FORMATURA', subvertente: 'ENSAIO', captacao: 'OLHARR',
      custo: 2600, venda: 2600,
      freelas: ['JULIA DIAS', 'LÉO KESLEY', 'RAFAEL MACEDO', 'TOSHIBA'],
      custosFreelas: [900, 900, 400, 400],
      outrosCustos: [], valorOutrosCustos: [],
      cliente: 'NUCLEO X',
    },
  ]

  let eventCount = 0
  for (const evento of eventos) {
    const clientName = clienteAlias[evento.cliente] || evento.cliente
    const clientObj = clienteMap.get(clientName)
    if (!clientObj) {
      console.warn(`⚠️ Cliente não encontrado: ${evento.cliente} → ${clientName}`)
      continue
    }

    const [day, month, year] = evento.date.split('/')
    const eventDate = new Date(+year, +month - 1, +day, 12, 0, 0)

    // March events are still in progress
    const isMarco = eventDate.getMonth() >= 2
    const projectStage = isMarco ? 'PRE_PRODUCAO' : 'ENTREGUE'
    const costPago = !isMarco

    // Create Orcamento
    const orcamento = await prisma.orcamento.create({
      data: {
        clienteId: clientObj.id,
        titulo: evento.title,
        status: 'APROVADO',
        vertical: evento.vertente,
        totalBruto: evento.venda,
        observacoes: `Subvertente: ${evento.subvertente} | Captação: ${evento.captacao} | Data: ${evento.date}`,
      },
    })

    // Create OrcamentoItems
    const orcamentoItems = [
      ...evento.freelas.map((nickname, i) => ({
        orcamentoId: orcamento.id,
        descricao: nickname,
        quantidade: 1,
        valorUnit: evento.custosFreelas[i],
        categoria: 'EQUIPE',
      })),
      ...evento.outrosCustos.map((desc, i) => ({
        orcamentoId: orcamento.id,
        descricao: desc,
        quantidade: 1,
        valorUnit: evento.valorOutrosCustos[i],
        categoria: 'PROJETO',
      })),
    ]
    if (orcamentoItems.length > 0) {
      await prisma.orcamentoItem.createMany({ data: orcamentoItems })
    }

    // Create Project
    const project = await prisma.project.create({
      data: {
        title: evento.title,
        clienteId: clientObj.id,
        responsavelId: user.id,
        stage: projectStage as any,
        vertical: evento.vertente,
        dataEvento: eventDate,
        revenueExpected: evento.venda,
        observacoes: `Subvertente: ${evento.subvertente} | Captação: ${evento.captacao}`,
      },
    })

    // Create ProjectCosts
    const projectCosts = [
      ...evento.freelas.map((nickname, i) => ({
        projectId: project.id,
        descricao: nickname,
        amount: evento.custosFreelas[i],
        categoria: 'FREELANCER',
        pago: costPago,
      })),
      ...evento.outrosCustos.map((desc, i) => ({
        projectId: project.id,
        descricao: desc,
        amount: evento.valorOutrosCustos[i],
        categoria: 'OUTROS',
        pago: costPago,
      })),
    ]
    if (projectCosts.length > 0) {
      await prisma.projectCost.createMany({ data: projectCosts })
    }

    // Create PagamentoFreelancer for each freelancer
    for (let i = 0; i < evento.freelas.length; i++) {
      const freelancerId = nicknameToId[evento.freelas[i]]
      if (freelancerId) {
        await prisma.pagamentoFreelancer.create({
          data: {
            freelancerId,
            projectId: project.id,
            escopo: evento.title,
            valorCombinado: evento.custosFreelas[i],
            dataProjeto: eventDate,
            dataPagamento: costPago ? eventDate : null,
            fase: costPago ? 'PAGO' : 'CONTRATACAO',
          },
        })
      }
    }

    eventCount++
  }
  console.log(`✅ ${eventCount} eventos criados (orçamento + projeto + custos + pagamentos freelancer)`)

  // ── 6. Transações ──

  const janLines = `31/01/2026;Pix enviado;Bar E Lanches Caculinha;-42,50
29/01/2026;Pix recebido;Besmart Ltda;18.950,00
29/01/2026;Pix recebido;Ana Laura Veloso Balisa;500,00
22/01/2026;Pix recebido;Rafael Menezes Cancado Ltda;5.000,00
22/01/2026;Pix enviado;Safra Imoveis;-3.150,00
22/01/2026;Pix enviado;Mateus Costa De Almeida;-680,00
22/01/2026;Pix recebido;Kelly Silveira Gomes Figueiroa;2.750,00
22/01/2026;Pix enviado;Viggiano;-102,83
22/01/2026;Pix enviado;Mateus Costa De Almeida;-250,00
22/01/2026;Pix enviado;Buser Brasil Tecnologia Ltda;-87,90
22/01/2026;Pix enviado;Antonio Guilherme Monteiro Costa;-222,37
22/01/2026;Pix enviado;Mateus Costa De Almeida;-600,00
21/01/2026;Pix recebido;American Chamber Of Commerce For Brazil Sao Paulo;3.800,00
21/01/2026;Pix recebido;Natalia Norberto Marques Sereno;580,00
20/01/2026;Pix recebido;Maionoise Digital Content Ltda;2.600,00
19/01/2026;Pix enviado;Rafael Menezes Cancado;-42,00
19/01/2026;Pix recebido;Tharick Ranie Lourenco Dos Santos;1.000,00
19/01/2026;Pix recebido;Propague A C Comunicacao;2.800,00
15/01/2026;Pix recebido;Rafael Menezes Cancado Ltda;5.000,00
14/01/2026;Débito automático;CEMIG;-446,59
12/01/2026;Pagamento efetuado;Fatura cartão Inter;-917,52
12/01/2026;Pix enviado;Daniely Ferreira Sousa;-1.000,00
12/01/2026;Pix enviado;Daniely Ferreira Sousa;-225,00
12/01/2026;Pix enviado;Daniel Felipe Duarte De Oliveira;-3.000,00
12/01/2026;Pix recebido;Daniely Ferreira Sousa;1.000,00
12/01/2026;Pix enviado devolvido;Daniely Ferreira Sousa;225,00
12/01/2026;Pix enviado;Daniel Felipe Duarte De Oliveira;-1.400,00
12/01/2026;Pix enviado;Daniel Felipe Duarte De Oliveira;-600,00
10/01/2026;Pix enviado;Rafael Menezes Cancado;-69,90
10/01/2026;Pix enviado;Daniely Ferreira Sousa;-1.000,00
10/01/2026;Pix enviado;Daniely Ferreira Sousa;-225,00
09/01/2026;Pix enviado;Luiza Helena Abreu Primo;-3.000,00
08/01/2026;Pix recebido;Rafael Menezes Cancado Ltda;5.000,00
08/01/2026;Pix recebido;Sgpay Pagamentos Eletronicos Ltda;5.000,00
08/01/2026;Pix enviado;Joao Vitor Araujo Da Silva;-705,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-600,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-750,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-700,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-600,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-600,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-600,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-300,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-450,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-650,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-650,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-650,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-380,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-1.500,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-450,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-450,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-500,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-225,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-2.000,00
08/01/2026;Pix enviado;Igor Soares Figueiredo;-3.000,00
08/01/2026;Pix recebido;Mrb Entretenimento Ltda;1.950,00
08/01/2026;Pix enviado;Larissa Silva Maia;-1.000,00
08/01/2026;Pix enviado;Beatriz Alves Werneck;-300,00
08/01/2026;Pix enviado;Beatriz Alves Werneck;-250,00
07/01/2026;Pix enviado;Rafael Macedo Guimaraes;-5.140,38
06/01/2026;Pix recebido;Natalia Norberto Marques Sereno;500,00
06/01/2026;Pix recebido;Rafael Menezes Cancado;2.500,00
05/01/2026;Pix recebido;Rafael Menezes Cancado;20.000,00
05/01/2026;Pix enviado;Tharick Ranie Lourenco Dos Santos;-1.000,00
05/01/2026;Pix enviado;Tharick Ranie Lourenco Dos Santos;-1.000,00
05/01/2026;Pix enviado;Rafael Menezes Cancado;-200,00
05/01/2026;Pix enviado;Rafael Menezes Cancado;-300,00
05/01/2026;Pix enviado;Rafael Menezes Cancado;-1.200,00
05/01/2026;Pix enviado;Rafael Menezes Cancado;-268,33
05/01/2026;Pix enviado;Rafael Menezes Cancado;-850,00
05/01/2026;Pix enviado;Rafael Menezes Cancado;-550,00
05/01/2026;Pix enviado;Rafael Menezes Cancado;-1.720,00
05/01/2026;Pix enviado;Rafael Menezes Cancado;-739,99
05/01/2026;Pix enviado;Rafael Menezes Cancado;-276,77
05/01/2026;Pix enviado;Rafael Menezes Cancado;-2.500,00
02/01/2026;Débito título KG;Ref.: 325003754 - 6;-648,97
01/01/2026;Pix enviado;Rafael Menezes Cancado;-80,64
01/01/2026;Pix recebido;Rafael Menezes Cancado Ltda;5.000,00
01/01/2026;Pix enviado;Joao Vitor Araujo Da Silva;-235,00`

  let txCount = 0
  for (const line of janLines.trim().split('\n')) {
    const tx = parseTransaction(line, inter.id, freelancerMap)
    await prisma.transaction.upsert({
      where: { externalId: tx.externalId },
      update: {},
      create: tx,
    })
    txCount++
  }
  console.log(`✅ Extrato Janeiro: ${txCount} transações`)

  const febLines = `27/02/2026;Pix enviado;Roberto Pereira De Souza Neto;-1.500,00
27/02/2026;Pix recebido;Kelly Silveira Gomes Figueiroa;2.750,00
27/02/2026;Pix enviado;Viggiano;-500,00
27/02/2026;Pix enviado;Victor Hugo Ribeiro Barbosa;-1.500,00
27/02/2026;Pix enviado;Igor Soares Figueiredo;-850,00
27/02/2026;Pix enviado;Viggiano;-450,00
27/02/2026;Pix enviado;Igor Soares Figueiredo;-1.100,00
27/02/2026;Pix enviado;Mateus Costa De Almeida;-1.400,00
27/02/2026;Pix enviado;Antonio Guilherme Monteiro Costa;-2.100,00
27/02/2026;Pix enviado;Daniel Felipe Duarte De Oliveira;-1.000,00
27/02/2026;Pix enviado;Daniel Felipe Duarte De Oliveira;-300,00
27/02/2026;Pix enviado;Igor Soares Figueiredo;-800,00
27/02/2026;Pix enviado;Victor Hugo Ribeiro Barbosa;-1.000,00
27/02/2026;Pix enviado;Davi Ribeiro De Souza;-1.000,00
27/02/2026;Pix enviado;Igor Soares Figueiredo;-800,00
27/02/2026;Pix enviado;Antonio Guilherme Monteiro Costa;-1.000,00
27/02/2026;Pix enviado;Davi Ribeiro De Souza;-1.000,00
27/02/2026;Pix enviado;Larissa Silva Maia;-800,00
27/02/2026;Pix enviado;Igor Soares Figueiredo;-1.200,00
27/02/2026;Pix enviado;Victor Hugo Ribeiro Barbosa;-1.800,00
27/02/2026;Pix enviado;Beatriz Alves Werneck;-450,00
27/02/2026;Pix enviado;Igor Soares Figueiredo;-800,00
27/02/2026;Pix enviado;Lais Cristina De Oliveira Souza;-800,00
27/02/2026;Pix enviado;Tulio Galvao Barros 08053621694;-800,00
27/02/2026;Pix enviado;Igor Soares Figueiredo;-375,00
27/02/2026;Pix enviado;Beatriz Alves Werneck;-500,00
27/02/2026;Pix enviado;Rafael Menezes Cancado;-1.200,00
27/02/2026;Pix enviado;62 030 767 Rafael Macedo Guimaraes;-700,00
27/02/2026;Pix enviado;Rafael Menezes Cancado;-450,00
27/02/2026;Pix enviado;62 030 767 Rafael Macedo Guimaraes;-750,00
27/02/2026;Pix enviado;Daniel Felipe Duarte De Oliveira;-950,00
27/02/2026;Pix enviado;Daniel Felipe Duarte De Oliveira;-800,00
27/02/2026;Pix enviado;62 030 767 Rafael Macedo Guimaraes;-800,00
27/02/2026;Pix enviado;Joao Paulo Macedo Prais;-600,00
27/02/2026;Pix enviado;Igor Soares Figueiredo;-1.000,00
27/02/2026;Pix enviado;Daniely Ferreira Sousa;-800,00
27/02/2026;Pix enviado;62 030 767 Rafael Macedo Guimaraes;-560,00
27/02/2026;Pix enviado;Davi Ribeiro De Souza;-1.000,00
27/02/2026;Pix enviado;Victor Hugo Ribeiro Barbosa;-1.200,00
27/02/2026;Pix enviado;Daniely Ferreira Sousa;-150,00
27/02/2026;Pix enviado;Gilberto Martins Machado Junior;-1.200,00
27/02/2026;Pix enviado;Antonio Guilherme Monteiro Costa;-1.200,00
27/02/2026;Pix enviado;Viggiano;-150,00
27/02/2026;Pix enviado;Viggiano;-3.000,00
27/02/2026;Pix enviado;Viggiano;-3.000,00
27/02/2026;Pix enviado;Viggiano;-3.000,00
27/02/2026;Pix enviado;Viggiano;-3.000,00
26/02/2026;Pix recebido;Rafael Menezes Cancado Ltda;5.000,00
26/02/2026;Pix recebido;Havayanas Usadas;11.400,00
25/02/2026;Pix enviado;Jml Company Audiovisual;-3.000,00
25/02/2026;Pix enviado;Nathalia Kathleen Mendes Fonseca Candido;-6.000,00
25/02/2026;Pix enviado;Viggiano;-2.000,00
25/02/2026;Pix enviado;Tulio Galvao Barros 08053621694;-1.500,00
25/02/2026;Pix enviado;Victor Hugo Ribeiro Barbosa;-800,00
25/02/2026;Pix enviado;Beatriz Alves Werneck;-1.600,00
25/02/2026;Pix enviado;Charles Pereira Cardoso;-3.600,00
25/02/2026;Pix enviado;Joao Paulo Macedo Prais;-1.500,00
25/02/2026;Pix enviado;Rafael Menezes Cancado;-900,00
25/02/2026;Pix enviado;Bruno Alves Werneck;-3.000,00
25/02/2026;Pix enviado;Antonio Guilherme Monteiro Costa;-2.400,00
25/02/2026;Pix enviado;Igor Nunes Monteiro;-700,00
25/02/2026;Pix recebido;Associacao C Entao Brilha;7.500,00
24/02/2026;Pix enviado;Copasa Mg;-85,69
24/02/2026;Pix enviado;Copasa Mg;-43,61
20/02/2026;Pix recebido;Rooftop;2.400,00
20/02/2026;Pix enviado;Receita Federal;-1.886,85
20/02/2026;Pix enviado;Joao Vitor Araujo Da Silva;-470,00
20/02/2026;Pix enviado;Safra Imoveis;-3.150,00
20/02/2026;Pix recebido;Ast Servicos De Bar;2.500,00
19/02/2026;Pix enviado;Rafael Menezes Cancado;-42,00
19/02/2026;Pix recebido;Rafael Menezes Cancado Ltda;5.000,00
19/02/2026;Pix enviado;Gallery Estudios Fotograficos Limitada;-850,00
18/02/2026;Débito automático;CEMIG;-386,26
12/02/2026;Pix recebido;Rafael Menezes Cancado Ltda;5.000,00
12/02/2026;Pix enviado;62 030 767 Rafael Macedo Guimaraes;-608,70
12/02/2026;Pix recebido;Carvalho Maia Real Adv;1.800,00
12/02/2026;Pix recebido;Do Brasil Live Marketing S.a.;5.301,26
12/02/2026;Pix recebido;Gallery Estudios Fo;1.450,00
10/02/2026;Pagamento efetuado;Pagamento Fatura - RAFAEL MENEZES CANCADO LTDA;-1.219,52
10/02/2026;Pix enviado;Rafael Menezes Cancado;-69,90
10/02/2026;Pix recebido;Igor Soares Figueiredo;200,00
10/02/2026;Pix enviado;Pix Marketplace;-389,97
06/02/2026;Pix enviado;Gallery Estudios Fotograficos Limitada;-1.450,00
05/02/2026;Pagamento Simples Nacional;Simples Nacional;-1.313,36
05/02/2026;Transferência recebida;Ultra Ticket Eventos E Ingressos Lt;4.200,00
05/02/2026;Pix recebido;A Macaco Industria Criativa Ltda;2.939,70
05/02/2026;Pix recebido;Ast Servicos De Bar;4.000,00
05/02/2026;Pix enviado;Rafael Menezes Cancado;-1.523,96
05/02/2026;Pix enviado;Rafael Menezes Cancado;-1.190,00
05/02/2026;Pix enviado;Rafael Menezes Cancado;-10.000,00
05/02/2026;Pix enviado;Rafael Menezes Cancado;-1.638,61
05/02/2026;Pix enviado;Rafael Menezes Cancado;-797,66
05/02/2026;Pix enviado;Rafael Menezes Cancado;-700,00
04/02/2026;Pix enviado;Joao Vitor Araujo Da Silva;-705,00
04/02/2026;Pix recebido;Vinte4sete Filmes Ltda;2.000,00
03/02/2026;Pix recebido;Sgpay Pagamentos Eletronicos Ltda;5.000,00
03/02/2026;Débito título KG;Ref.: 325003754 - 7;-673,72
02/02/2026;Pix enviado;Rafael Menezes Cancado;-5.000,00
01/02/2026;Pix enviado;Rafael Menezes Cancado;-80,64
01/02/2026;Pix enviado;Ponto Da Empada;-100,00`

  let txFebCount = 0
  for (const line of febLines.trim().split('\n')) {
    const tx = parseTransaction(line, inter.id, freelancerMap)
    await prisma.transaction.upsert({
      where: { externalId: tx.externalId },
      update: {},
      create: tx,
    })
    txFebCount++
  }
  console.log(`✅ Extrato Fevereiro: ${txFebCount} transações`)

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log(`   - 18 clientes`)
  console.log(`   - 30 freelancers`)
  console.log(`   - 2 contas financeiras`)
  console.log(`   - ${eventCount} eventos (orçamento + projeto + custos)`)
  console.log(`   - ${txCount + txFebCount} transações`)

  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
