import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'


export default function Home() {
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const cargarPerfil = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        navigate('/login')
        return
      }

      const { data, error } = await supabase
        .from('participantes')
        .select('nombre, equipo_favorito, puntos_total')
        .eq('auth_user_id', session.user.id)
        .single()

      if (error) {
        console.error(error)
      } else {
        setPerfil(data)
      }

      setLoading(false)
    }

    cargarPerfil()
  }, [navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return <div style={styles.container}><p style={styles.text}>Cargando...</p></div>
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⚽ Quiniela Mundial 2026</h1>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Bienvenido, {perfil?.nombre}</h2>
        <p style={styles.text}>Equipo favorito: {perfil?.equipo_favorito || 'No seleccionado'}</p>
        <p style={styles.text}>Puntos: {perfil?.puntos_total ?? 0}</p>

        <button style={styles.mainButton} onClick={() => navigate('/predicciones')}>
        Capturar pronósticos
        </button>

        <button style={styles.mainButton} onClick={() => navigate('/tabla')}>
        Ver tabla general
        </button>

        <button style={styles.mainButton} onClick={() => navigate('/predicciones-especiales')}>
        Predicciones Especiales 🎯
        </button>

        <button style={styles.button} onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a2e',
    gap: '20px',
  },
  card: {
    backgroundColor: '#1a1a4e',
    padding: '32px',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
  },
  title: {
    color: '#FFD700',
    fontSize: '28px',
  },
  subtitle: {
    color: 'white',
    fontSize: '22px',
    margin: 0,
  },
  text: {
    color: 'white',
    fontSize: '18px',
    margin: 0,
  },
  mainButton: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#FFD700',
    color: '#0a0a2e',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
  },
  button: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#ff6b6b',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    width: '100%',
  }
}