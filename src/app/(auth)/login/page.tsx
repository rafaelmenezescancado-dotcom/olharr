import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1E1826' }}>
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#F0EDF5', letterSpacing: '0.1em' }}>
            OLHARR
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8B82A0' }}>
            Sistema de Gestão
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
