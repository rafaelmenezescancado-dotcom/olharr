export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1E1826' }}>
      <div className="text-center">
        <h1 className="text-2xl font-bold" style={{ color: '#F0EDF5' }}>Acesso Negado</h1>
        <p className="mt-2 text-sm" style={{ color: '#8B82A0' }}>Você não tem permissão para acessar esta página.</p>
      </div>
    </div>
  )
}
