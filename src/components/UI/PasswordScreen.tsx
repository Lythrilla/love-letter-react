import { useState } from 'react'

interface PasswordScreenProps {
  onSuccess: () => void
}

export function PasswordScreen({ onSuccess }: PasswordScreenProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === '123') {
      onSuccess()
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Noto Serif SC", serif',
      }}
    >
      {/* 装饰性光晕 */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(100, 80, 150, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      
      <form onSubmit={handleSubmit} style={{ textAlign: 'center', position: 'relative' }}>
        <p
          style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.3)',
            letterSpacing: '0.3em',
            marginBottom: '2rem',
            textTransform: 'uppercase',
          }}
        >
          Private
        </p>
        
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            style={{
              width: '200px',
              padding: '14px 30px 14px 0',
              fontSize: '18px',
              letterSpacing: '0.3em',
              textAlign: 'center',
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${error ? 'rgba(255, 100, 100, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
              color: '#fff',
              outline: 'none',
              transition: 'all 0.3s',
              animation: shake ? 'shake 0.5s ease' : 'none',
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '0',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '14px',
              padding: '5px',
            }}
          >
            {showPassword ? '◉' : '◎'}
          </button>
        </div>
        
        <div style={{ marginTop: '2.5rem' }}>
          <button
            type="submit"
            style={{
              padding: '0',
              fontSize: '12px',
              letterSpacing: '0.15em',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'
            }}
          >
            Enter →
          </button>
        </div>
        
        <p
          style={{
            marginTop: '2rem',
            fontSize: '11px',
            color: error ? 'rgba(255, 100, 100, 0.7)' : 'transparent',
            letterSpacing: '0.1em',
            transition: 'color 0.3s',
            height: '16px',
          }}
        >
          密码错误
        </p>
      </form>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        input::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}
