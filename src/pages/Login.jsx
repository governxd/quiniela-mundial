import { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError('Usuario o contraseña incorrectos')
    } else {
      navigate('/home')
    }

    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>⚽ Quiniela Mundial 2026</h1>
        <h2 style={styles.subtitle}>Iniciar sesión</h2>

        <input
          style={styles.input}
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={styles.button}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <p style={styles.link}>
          {new Date() <new Date('2026-06-12 08:00:00')?(
            <>
              ¿No tienes cuenta?{' '}
              <Link to="/signup">Regístrate aquí</Link>
            </>
          ) : (
            <span style={{ color: '#888'}}>⛔ El registro ya está cerrado</span>
          )}  
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a2e',
  },
  card: {
    backgroundColor: '#1a1a4e',
    padding: '40px',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  title: {
    color: '#FFD700',
    textAlign: 'center',
    fontSize: '24px',
    margin: 0,
  },
  subtitle: {
    color: 'white',
    textAlign: 'center',
    fontSize: '18px',
    margin: 0,
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #444',
    backgroundColor: '#0a0a2e',
    color: 'white',
    fontSize: '16px',
  },
  button: {
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#FFD700',
    color: '#0a0a2e',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  error: {
    color: '#ff6b6b',
    textAlign: 'center',
    margin: 0,
  },
  link: {
    color: 'white',
    textAlign: 'center',
    fontSize: '14px',
  }
}