  import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'

const EQUIPOS = [
  'México', 'Sudáfrica', 'Rep. de Corea', 'Rep. Checa',
  'Canadá', 'Bosnia y Herzegovina', 'Estados Unidos', 'Paraguay',
  'Catar', 'Suiza', 'Brasil', 'Marruecos', 'Haití', 'Escocia',
  'Australia', 'Turquía', 'Alemania', 'Curazao', 'Países Bajos',
  'Japón', 'Costa de Marfil', 'Ecuador', 'Suecia', 'Túnez',
  'España', 'Cabo Verde', 'Bélgica', 'Egipto', 'Arabia Saudí',
  'Uruguay', 'Irán', 'Nueva Zelanda', 'Francia', 'Senegal',
  'Irak', 'Noruega', 'Argentina', 'Argelia', 'Austria', 'Jordania',
  'Portugal', 'RD Congo', 'Inglaterra', 'Croacia', 'Ghana', 'Panamá',
  'Uzbekistán', 'Colombia'
].sort()

const FASES = [
  'Fase de grupos',
  'Dieciseisavos de final',
  'Octavos de final',
  'Cuartos de final',
  'Semifinal',
  'Final',
  'Campeón 🏆'
]

const FECHA_CIERRE_ESPECIALES = new Date('2026-06-18T12:00:00')

const TIPOS = [
  { tipo: 'campeon', descripcion: '🏆 Campeón del torneo', puntos: 5, input: 'lista_equipos' },
  { tipo: 'subcampeon', descripcion: '🥈 Subcampeón del torneo', puntos: 5, input: 'lista_equipos' },
  { tipo: 'goleador', descripcion: '⚽ Goleador del torneo', puntos: 5, input: 'texto_libre' },
  { tipo: 'mejor_jugador', descripcion: '⭐ Mejor jugador del torneo', puntos: 5, input: 'texto_libre' },
  { tipo: 'mejor_portero', descripcion: '🧤 Mejor portero', puntos: 5, input: 'texto_libre' },
  { tipo: 'equipo_mas_goleador', descripcion: '🥅 Equipo más goleador', puntos: 5, input: 'lista_equipos' },
  { tipo: 'equipo_mas_goleado', descripcion: '💀 Equipo más goleado', puntos: 5, input: 'lista_equipos' },
  { tipo: 'hasta_donde_mexico', descripcion: '🦅 ¿Hasta dónde llega México?', puntos: 5, input: 'lista_fases' },
  { tipo: 'hasta_donde_japon', descripcion: '🗾 ¿Hasta dónde llega Japón?', puntos: 5, input: 'lista_fases' },
]

const LABELS = {
  campeon: '🏆 Campeón del torneo',
  subcampeon: '🥈 Subcampeón del torneo',
  goleador: '⚽ Goleador del torneo',
  mejor_jugador: '⭐ Mejor jugador del torneo',
  mejor_portero: '🧤 Mejor portero',
  equipo_mas_goleador: '🥅 Equipo más goleador',
  equipo_mas_goleado: '💀 Equipo más goleado',
  hasta_donde_mexico: '🦅 Hasta donde llega Mexico',
  hasta_donde_japon: '🗾 Hasta donde llega Japon',
}

export default function PrediccionesEspeciales() {
  const [predicciones, setPredicciones] = useState({})
  const [guardando, setGuardando] = useState(null)
  const [participanteId, setParticipanteId] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const especialesCerradas = new Date() >= FECHA_CIERRE_ESPECIALES

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
        .from('predicciones_especiales')
        .select('*')
        .eq('participante_id', participante.id)

      const predsMap = {}
      preds?.forEach(p => {
        predsMap[p.tipo] = p.valor
      })
      setPredicciones(predsMap)
      setLoading(false)
    }

    init()
  }, [])

  const handleGuardar = async (tipo, valor) => {
    if (especialesCerradas) return
    if (!valor) return
    setGuardando(tipo)

    const { error } = await supabase
      .from('predicciones_especiales')
      .upsert({
        participante_id: participanteId,
        tipo,
        valor,
      }, { onConflict: 'participante_id,tipo' })

    if (!error) {
      setPredicciones(prev => ({ ...prev, [tipo]: valor }))
    }

    setGuardando(null)
  }

  const descargarPDFEspeciales = async () => {
    const { data: preds } = await supabase
      .from('predicciones_especiales')
      .select(`
        tipo,
        valor,
        participantes (nombre)
      `)

    if (!preds || preds.length === 0) return

    const porParticipante = {}
    preds.forEach(p => {
      const nombre = p.participantes?.nombre || 'Desconocido'
      if (!porParticipante[nombre]) porParticipante[nombre] = {}
      porParticipante[nombre][p.tipo] = p.valor
    })

    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.setTextColor(10, 10, 46)
    doc.text('Predicciones Especiales - Mundial 2026', 14, 20)

    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.text(`Generado el ${new Date().toLocaleString('es-MX')}`, 14, 28)

    doc.setDrawColor(200)
    doc.line(14, 32, 196, 32)

    let y = 40

    Object.entries(porParticipante)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([nombre, preds]) => {
        if (y > 250) {
          doc.addPage()
          y = 20
        }

        // Nombre del participante
        doc.setFontSize(13)
        doc.setTextColor(10, 10, 46)
        doc.setFont('helvetica', 'bold')
        doc.text(nombre, 14, y)
        y += 6

        doc.setDrawColor(220)
        doc.line(14, y, 196, y)
        y += 6

        // Sus predicciones
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        Object.entries(LABELS).forEach(([tipo, label]) => {
          if (y > 270) {
            doc.addPage()
            y = 20
          }
          const valor = preds[tipo] || 'Sin prediccion'
          doc.setTextColor(80)
          doc.text(label, 18, y)
          doc.setTextColor(valor === 'Sin prediccion' ? 150 : 10)
          doc.text(valor, 120, y)
          y += 7
        })

        y += 8
      })

    doc.save('predicciones_especiales_mundial_2026.pdf')
  }

  if (loading) return (
    <div style={styles.container}>
      <p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/home')}>
          ← Regresar
        </button>
        <h1 style={styles.title}>🎯 Predicciones Especiales</h1>
      </div>

      <p style={styles.subtitle}>
        Estas predicciones CIERRAN EL 18 DE JUNIO a las 12 PM y se resuelven al final del torneo. ¡Elige bien!
      </p>

      {especialesCerradas && (
        <button
          style={styles.btnPDF}
          onClick={descargarPDFEspeciales}
        >
          📄 Descargar todas las predicciones especiales
        </button>
      )}

      {TIPOS.map(({ tipo, descripcion, puntos, input }) => {
        const valorActual = predicciones[tipo]
        const estaGuardando = guardando === tipo

        return (
          <div key={tipo} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.descripcion}>{descripcion}</span>
              <span style={styles.puntosBadge}>{puntos} pts</span>
            </div>

            {valorActual && (
              <p style={styles.valorGuardado}>
                ✅ Tu predicción: <strong>{valorActual}</strong>
              </p>
            )}

            {!valorActual && (
              <p style={styles.pendiente}>⚠️ Pendiente por predecir</p>
            )}

            {input === 'lista_equipos' && (
              <select
                style={styles.select}
                value={valorActual || ''}
                onChange={(e) => handleGuardar(tipo, e.target.value)}
                disabled={estaGuardando || especialesCerradas}
              >
                <option value=''>-- Elige un equipo --</option>
                {EQUIPOS.map(eq => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>
            )}

            {input === 'lista_fases' && (
              <select
                style={styles.select}
                value={valorActual || ''}
                onChange={(e) => handleGuardar(tipo, e.target.value)}
                disabled={estaGuardando || especialesCerradas}
              >
                <option value=''>-- Elige una fase --</option>
                {FASES.map(fase => (
                  <option key={fase} value={fase}>{fase}</option>
                ))}
              </select>
            )}

            {input === 'texto_libre' && (
              <div style={styles.textoRow}>
                <input
                  style={styles.input}
                  type='text'
                  placeholder='Escribe el nombre del jugador...'
                  defaultValue={valorActual || ''}
                  disabled={especialesCerradas}
                  onBlur={(e) => {
                    if (e.target.value !== valorActual) {
                      handleGuardar(tipo, e.target.value)
                    }
                  }}
                />
                {estaGuardando && <span style={styles.guardandoText}>Guardando...</span>}
              </div>
            )}
          </div>
        )
      })}
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
    marginBottom: '10px',
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
  subtitle: {
    color: '#aaa',
    fontSize: '14px',
    marginBottom: '24px',
  },
  btnPDF: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2d2d6e',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  card: {
    backgroundColor: '#1a1a4e',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  descripcion: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '15px',
  },
  puntosBadge: {
    backgroundColor: '#FFD700',
    color: '#0a0a2e',
    fontWeight: 'bold',
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  valorGuardado: {
    color: '#51cf66',
    fontSize: '13px',
    margin: 0,
  },
  pendiente: {
    color: '#FFD700',
    fontSize: '12px',
    margin: 0,
  },
  select: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #444',
    backgroundColor: '#0a0a2e',
    color: 'white',
    fontSize: '14px',
    width: '100%',
  },
  textoRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #444',
    backgroundColor: '#0a0a2e',
    color: 'white',
    fontSize: '14px',
  },
  guardandoText: {
    color: '#aaa',
    fontSize: '12px',
  },
}