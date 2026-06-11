import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

export default function TablaGeneral() {
  const [participantes, setParticipantes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    cargarTabla()

    // Actualización en tiempo real
    const canal = supabase
      .channel('tabla-general')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'participantes'
      }, () => cargarTabla())
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [])

  const cargarTabla = async () => {
    const { data } = await supabase
      .from('participantes')
      .select('nombre, puntos_total, equipo_abreviacion')
      .order('puntos_total', { ascending: false })

    setParticipantes(data || [])
    setLoading(false)
  }

  const podio = participantes.slice(0, 3)
  const resto = participantes.slice(3)

  if (loading) return (
    <div style={styles.container}>
      <p style={{ color: 'white', textAlign: 'center' }}>Cargando tabla...</p>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/home')}>
          ← Regresar
        </button>
        <h1 style={styles.title}>🏆 Tabla General</h1>
      </div>

      {/* Podio */}
      {podio.length > 0 && (
        <div style={styles.podioContainer}>

          {/* 2do lugar */}
          {podio[1] && (
            <div style={styles.podioItem}>
              <div style={styles.medallaSilver}>🥈</div>
              <div style={styles.podioCard}>
                <span style={styles.podioAbrev}>{podio[1].equipo_abreviacion || '🌍'}</span>
                <span style={styles.podioNombre}>{podio[1].nombre}</span>
                <span style={styles.podioPuntos}>{podio[1].puntos_total} pts</span>
              </div>
              <div style={{ ...styles.podioPedestal, height: '60px', backgroundColor: '#C0C0C0' }}>
                2°
              </div>
            </div>
          )}

          {/* 1er lugar */}
          {podio[0] && (
            <div style={styles.podioItem}>
              <div style={styles.medallaGold}>👑</div>
              <div style={{ ...styles.podioCard, borderColor: '#FFD700' }}>
                <span style={styles.podioAbrev}>{podio[0].equipo_abreviacion || '🌍'}</span>
                <span style={styles.podioNombre}>{podio[0].nombre}</span>
                <span style={styles.podioPuntos}>{podio[0].puntos_total} pts</span>
              </div>
              <div style={{ ...styles.podioPedestal, height: '90px', backgroundColor: '#FFD700' }}>
                1°
              </div>
            </div>
          )}

          {/* 3er lugar */}
          {podio[2] && (
            <div style={styles.podioItem}>
              <div style={styles.medallabronce}>🥉</div>
              <div style={styles.podioCard}>
                <span style={styles.podioAbrev}>{podio[2].equipo_abreviacion || '🌍'}</span>
                <span style={styles.podioNombre}>{podio[2].nombre}</span>
                <span style={styles.podioPuntos}>{podio[2].puntos_total} pts</span>
              </div>
              <div style={{ ...styles.podioPedestal, height: '45px', backgroundColor: '#CD7F32' }}>
                3°
              </div>
            </div>
          )}

        </div>
      )}

      {/* Resto de participantes */}
      {resto.length > 0 && (
        <div style={styles.listaContainer}>
          {resto.map((p, index) => (
            <div key={p.nombre} style={styles.filaLista}>
              <span style={styles.posicion}>{index + 4}</span>
              <span style={styles.abrev}>{p.equipo_abreviacion || '🌍'}</span>
              <span style={styles.nombreLista}>{p.nombre}</span>
              <span style={styles.puntosLista}>{p.puntos_total} pts</span>
            </div>
          ))}
        </div>
      )}

      {participantes.length === 0 && (
        <p style={styles.empty}>Aún no hay participantes registrados</p>
      )}

    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a2e',
    padding: '20px',
    paddingBottom: '60px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px',
  },
  backButton: {
    backgroundColor: 'transparent',
    border: '1px solid #FFD700',
    color: '#FFD700',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  title: {
    color: '#FFD700',
    fontSize: '24px',
    margin: 0,
  },
  podioContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: '12px',
    marginBottom: '30px',
  },
  podioItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  medallaGold: { fontSize: '32px' },
  medallaSilver: { fontSize: '28px' },
  medallabronce: { fontSize: '24px' },
  podioCard: {
    backgroundColor: '#1a1a4e',
    border: '2px solid #444',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    width: '100px',
  },
  podioAbrev: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  podioNombre: {
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  podioPuntos: {
    color: '#aaa',
    fontSize: '11px',
  },
  podioPedestal: {
    width: '100px',
    borderRadius: '4px 4px 0 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0a0a2e',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  listaContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filaLista: {
    backgroundColor: '#1a1a4e',
    borderRadius: '10px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  posicion: {
    color: '#888',
    fontSize: '14px',
    fontWeight: 'bold',
    width: '24px',
  },
  abrev: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: '14px',
    width: '40px',
  },
  nombreLista: {
    color: 'white',
    fontSize: '14px',
    flex: 1,
  },
  puntosLista: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: '40px',
  }
}