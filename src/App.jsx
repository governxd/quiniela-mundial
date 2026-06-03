import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function App() {
  const [partidos, setPartidos] = useState([])
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function cargarPartidos() {
      const { data, error } = await supabase
        .from('partidos')
        .select('*')

      if (error) {
        console.error(error)
        setErrorMsg(error.message)
      } else {
        setPartidos(data)
      }
    }

    cargarPartidos()
  }, [])

  return (
    <div>
      <h1>🏆 Quiniela Mundial 2026</h1>

      {errorMsg && <p>Error: {errorMsg}</p>}

      {partidos.length === 0 && !errorMsg && (
        <p>No se encontraron partidos.</p>
      )}

      {partidos.map((partido) => (
        <p key={partido.id}>
          {partido.equipo1} vs {partido.equipo2}
        </p>
      ))}
    </div>
  )
}

export default App