export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #ede9ff, #f8f6ff 45%, #e8e3ff)' }}>
      <div className="text-center">
        <h1 className="text-2xl font-bold" style={{ color: '#1C1730' }}>Acesso Negado</h1>
        <p className="mt-2 text-sm" style={{ color: '#676767' }}>Você não tem permissão para acessar esta página.</p>
      </div>
    </div>
  )
}
