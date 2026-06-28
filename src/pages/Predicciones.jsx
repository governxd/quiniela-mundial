import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const FASES = [
  'Grupos',
  'Dieciseisavos',
  'Octavos',
  'Cuartos',
  'Semifinal',
  'Final'
]

export default function Predicciones() {
  const [partidos, setPartidos] = useState([])
  const [predicciones, setPredicciones] = useState({})
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(null)
  const [participanteId, setParticipanteId] = useState(null)
  const [participantes, setParticipantes] = useState([])
  const [faseActiva, setFaseActiva] = useState('Grupos')
  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return navigate('/login')

      const { data: participante } = await supabase
        .from('participantes')
        .select('id')
        .eq('codigo_acceso', session.user.id)
        .single()

      if (!participante) return
      setParticipanteId(participante.id)

      const { data: preds } = await supabase
        .from('predicciones')
        .select('*')
        .eq('participante_id', participante.id)

      const predsMap = {}
      preds?.forEach(p => {
        predsMap[p.partido_id] = {
          resultado_predicho: p.resultado_predicho,
          puntos_obtenidos: p.puntos_obtenidos ?? 0
        }
      })
      setPredicciones(predsMap)

      const { data: todosParticipantes } = await supabase
        .from('participantes')
        .select('nombre')
        .order('nombre', { ascending: true })

      setParticipantes(todosParticipantes || [])
      setLoading(false)
    }

    init()
  }, [])

  useEffect(() => {
    const cargarPartidos = async () => {
      const { data } = await supabase
        .from('partidos')
        .select('*')
        .eq('fase', faseActiva)
        .order('fecha', { ascending: true })

      setPartidos(data || [])
    }

    cargarPartidos()
  }, [faseActiva])

  const handlePrediccion = async (partidoId, resultado) => {
    setGuardando(partidoId)

    const { error } = await supabase
      .from('predicciones')
      .upsert({
        participante_id: participanteId,
        partido_id: partidoId,
        resultado_predicho: resultado,
        prediccion_equipo1: 0,
        prediccion_equipo2: 0,
      }, { onConflict: 'participante_id,partido_id' })

    if (error) {
      console.error('Error guardando prediccion:', error)
    } else {
      setPredicciones(prev => ({
        ...prev,
        [partidoId]: {
          resultado_predicho: resultado,
          puntos_obtenidos: 0
        }
      }))
    }

    setGuardando(null)
  }

  const descargarPDF = async (partido) => {
    const { data: preds } = await supabase
      .from('predicciones')
      .select(`
        resultado_predicho,
        participantes (nombre)
      `)
      .eq('partido_id', partido.id)

    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.setTextColor(10, 10, 46)
    doc.text(`${partido.equipo1} vs ${partido.equipo2}`, 14, 20)

    doc.setFontSize(11)
    doc.setTextColor(100)
    const fecha = new Date(partido.fecha).toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
    const hora = new Date(partido.fecha).toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit'
    })
    doc.text(`${fecha} — ${hora} hrs`, 14, 30)

    doc.setDrawColor(200)
    doc.line(14, 35, 196, 35)

    const filas = preds?.map(p => [
      p.participantes?.nombre || 'Desconocido',
      p.resultado_predicho === 'equipo1' ? `Gana ${partido.equipo1}` :
      p.resultado_predicho === 'equipo2' ? `Gana ${partido.equipo2}` :
      'Empate'
    ]) || []

    const conPrediccion = new Set(preds?.map(p => p.participantes?.nombre))
    const sinPrediccion = participantes
      .filter(p => !conPrediccion.has(p.nombre))
      .map(p => [p.nombre, 'Sin predicción'])

    autoTable(doc, {
      startY: 40,
      head: [['Participante', 'Predicción']],
      body: [...filas, ...sinPrediccion],
      headStyles: {
        fillColor: [10, 10, 46],
        textColor: [255, 215, 0],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 255]
      },
      styles: {
        fontSize: 11,
        cellPadding: 6,
      }
    })

    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text(
      `Generado el ${new Date().toLocaleString('es-MX')}`,
      14,
      doc.internal.pageSize.height - 10
    )

    doc.save(`${partido.equipo1}_vs_${partido.equipo2}.pdf`)
  }

  const estaAbierto = (fecha) => {
    return new Date() < new Date(fecha)
  }

  const partidosPorFecha = partidos.reduce((acc, partido) => {
    const fecha = new Date(partido.fecha).toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
    if (!acc[fecha]) acc[fecha] = []
    acc[fecha].push(partido)
    return acc
  }, {})

  if (loading) return (
    <div style={styles.container}>
      <p style={{ color: 'white' }}>Cargando partidos...</p>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/home')}>
          ← Regresar
        </button>
        <h1 style={styles.title}>⚽ Mis Predicciones</h1>
      </div>

      {/* Pestañas de fases */}
      <div style={styles.tabsContainer}>
        {FASES.map(fase => (
          <button
            key={fase}
            style={{
              ...styles.tab,
              ...(faseActiva === fase ? styles.tabActivo : {})
            }}
            onClick={() => setFaseActiva(fase)}
          >
            {fase}
          </button>
        ))}
      </div>

      {/* Partidos */}
      {Object.keys(partidosPorFecha).length === 0 ? (
        <p style={styles.sinPartidos}>Aún no hay partidos disponibles en esta fase.</p>
      ) : (
        Object.entries(partidosPorFecha).map(([fecha, partidos]) => (
          <div key={fecha} style={styles.fechaGroup}>
            <h2 style={styles.fechaTitle}>{fecha}</h2>

            {partidos.map(partido => {
              const abierto = estaAbierto(partido.fecha)
              const prediccionData = predicciones[partido.id]
              const prediccion = prediccionData?.resultado_predicho
              const puntosObtenidos = prediccionData?.puntos_obtenidos ?? 0
              const partidoConResultado =
                partido.resultado_equipo1 !== null &&
                partido.resultado_equipo2 !== null
              const marcadorFinal = `${partido.equipo1} ${partido.resultado_equipo1} - ${partido.resultado_equipo2} ${partido.equipo2}`
              const hora = new Date(partido.fecha).toLocaleTimeString('es-MX', {
                hour: '2-digit', minute: '2-digit'
              })

              return (
                <div key={partido.id} style={styles.partidoCard}>

                  <div style={styles.estadoRow}>
                    {!prediccion && abierto && (
                      <span style={styles.pendiente}>⚠️ Pendiente por predecir</span>
                    )}
                    {prediccion && (
                      <span style={styles.predichoLabel}>✅ Predicción guardada</span>
                    )}
                    {!abierto && !prediccion && (
                      <span style={styles.cerrado}>🔒 Cerrado sin predicción</span>
                    )}
                  </div>

                  <div style={styles.equiposRow}>
                    <span style={styles.equipo}>{partido.equipo1}</span>
                    <div style={styles.centro}>
                      <span style={styles.vs}>VS</span>
                      <span style={styles.hora}>{hora} hrs</span>
                      {partido.es_triple && (
                        <span style={styles.triple}>🔥 TRIPLE</span>
                      )}
                      {partido.es_doble && (
                        <span style={styles.triple}>⚡ DOBLE</span>
                      )}
                    </div>
                    <span style={styles.equipo}>{partido.equipo2}</span>
                  </div>

                  {/* Botones abiertos */}
                  {abierto ? (
                    <div style={styles.botonesRow}>
                      <button
                        style={{
                          ...styles.btnPrediccion,
                          ...(prediccion === 'equipo1' ? styles.btnSeleccionado : {})
                        }}
                        onClick={() => handlePrediccion(partido.id, 'equipo1')}
                        disabled={guardando === partido.id}
                      >
                        Gana {partido.equipo1}
                      </button>
                      {faseActiva === 'Grupos' && (
                        <button
                          style={{
                            ...styles.btnPrediccion,
                            ...(prediccion === 'empate' ? styles.btnSeleccionado : {})
                          }}
                          onClick={() => handlePrediccion(partido.id, 'empate')}
                          disabled={guardando === partido.id}
                        >
                          Empate
                        </button>
                      )}
                      <button
                        style={{
                          ...styles.btnPrediccion,
                          ...(prediccion === 'equipo2' ? styles.btnSeleccionado : {})
                        }}
                        onClick={() => handlePrediccion(partido.id, 'equipo2')}
                        disabled={guardando === partido.id}
                      >
                        Gana {partido.equipo2}
                      </button>
                    </div>

                  ) : (
                    /* Botones cerrados */
                    <div style={styles.botonesRow}>
                      <div style={{
                        ...styles.btnPrediccion,
                        ...(prediccion === 'equipo1' ? styles.btnCerradoSeleccionado : styles.btnCerrado)
                      }}>
                        Gana {partido.equipo1}
                      </div>
                      {faseActiva === 'Grupos' && (
                        <div style={{
                          ...styles.btnPrediccion,
                          ...(prediccion === 'empate' ? styles.btnCerradoSeleccionado : styles.btnCerrado)
                        }}>
                          Empate
                        </div>
                      )}
                      <div style={{
                        ...styles.btnPrediccion,
                        ...(prediccion === 'equipo2' ? styles.btnCerradoSeleccionado : styles.btnCerrado)
                      }}>
                        Gana {partido.equipo2}
                      </div>
                    </div>
                  )}

                  {!abierto && (
                    <button
                      style={styles.btnPDF}
                      onClick={() => descargarPDF(partido)}
                    >
                      📄 Descargar predicciones
                    </button>
                  )}

                  {prediccion && partidoConResultado && (
                    <div style={styles.resultadoBox}>
                      <p style={styles.resultaodFinal}>
                        Resultado final: {marcadorFinal}
                      </p>
                      <p style={puntosObtenidos > 0 ? styles.puntosGanados : styles.puntosCero}>
                        {puntosObtenidos > 0
                          ? `🏆 Obtuviste ${puntosObtenidos} pts`
                          : '😔 Obtuviste 0 pts'}
                      </p>
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        ))
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
    marginBottom: '20px',
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
  tabsContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  tab: {
    padding: '8px 14px',
    borderRadius: '20px',
    border: '2px solid #444',
    backgroundColor: 'transparent',
    color: '#aaa',
    fontSize: '13px',
    cursor: 'pointer',
  },
  tabActivo: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
    color: '#0a0a2e',
    fontWeight: 'bold',
  },
  sinPartidos: {
    color: '#888',
    textAlign: 'center',
    marginTop: '40px',
    fontSize: '14px',
  },
  fechaGroup: {
    marginBottom: '30px',
  },
  fechaTitle: {
    color: '#FFD700',
    fontSize: '16px',
    textTransform: 'capitalize',
    borderBottom: '1px solid #333',
    paddingBottom: '8px',
    marginBottom: '12px',
  },
  partidoCard: {
    backgroundColor: '#1a1a4e',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
  },
  estadoRow: {
    marginBottom: '8px',
  },
  pendiente: {
    color: '#FFD700',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  predichoLabel: {
    color: '#51cf66',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  cerrado: {
    color: '#888',
    fontSize: '12px',
  },
  equiposRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  equipo: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
    flex: 1,
    textAlign: 'center',
  },
  centro: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
  },
  vs: {
    color: '#888',
    fontSize: '12px',
  },
  hora: {
    color: '#aaa',
    fontSize: '11px',
  },
  triple: {
    color: '#ff6b6b',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  botonesRow: {
    display: 'flex',
    gap: '8px',
  },
  btnPrediccion: {
    flex: 1,
    padding: '8px 4px',
    borderRadius: '8px',
    border: '2px solid #444',
    backgroundColor: 'transparent',
    color: 'white',
    fontSize: '12px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  btnSeleccionado: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
    color: '#0a0a2e',
    fontWeight: 'bold',
  },
  btnCerrado: {
    opacity: 0.4,
    cursor: 'default',
  },
  btnCerradoSeleccionado: {
    backgroundColor: '#444',
    borderColor: '#666',
    color: 'white',
    fontWeight: 'bold',
    opacity: 0.8,
  },
  btnPDF: {
    marginTop: '10px',
    width: '100%',
    padding: '8px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2d2d6e',
    color: 'white',
    fontSize: '12px',
    cursor: 'pointer',
  },
  puntosGanados: {
    color: '#FFD700',
    fontSize: '13px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: '10px',
    marginBottom: 0,
  },
  puntosCero: {
    color: '#aaa',
    fontSize: '13px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: '10px',
    marginBottom: 0,
  },
  resultadoBox: {
    marginTop: '10px',
  },
  resultaodFinal: {
    color: 'white',
    fontSize: '13px',
    textAlign: 'center',
    margin: 0,
  },
}