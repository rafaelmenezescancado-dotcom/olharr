import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #ede9ff, #f8f6ff 45%, #e8e3ff)' }}>
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#1C1730', letterSpacing: '0.1em' }}>
            OLHARR
          </h1>
          <p className="text-sm mt-1" style={{ color: '#676767' }}>
            Sistema de Gestão
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
