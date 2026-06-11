import { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function Signup() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [equipoFavorito, setEquipoFavorito] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async () => {
    setError('')

    if (!nombre) return setError('El nombre es obligatorio')
    if (password !== confirmar) return setError('Las contraseñas no coinciden')
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')

    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email: email || `${nombre.toLowerCase().replace(/\s/g, '')}@quiniela.com`,
      password,
    })

    if (authError) {
      console.error(authError)  
      setError(`Error al crear la cuenta, intenta con otro correo: ${authError.message}`)
      setLoading(false)
      return
    }

    // Guardar datos extra en tabla participantes
    const { error: dbError } = await supabase
      .from('participantes')
      .insert({
        nombre,
        equipo_favorito: equipoFavorito,
        codigo_acceso: data.user.id,
        auth_user_id: data.user.id,
      })

    if (dbError) {
      console.error(dbError)  
      setError(`Error al guardar perfil: ${dbError.message}`)
      setLoading(false)
      return
    }

    navigate('/home')
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>⚽ Quiniela Mundial 2026</h1>
        <h2 style={styles.subtitle}>Crear cuenta</h2>

        <input
          style={styles.input}
          type="text"
          placeholder="Nombre (aparecerá en la tabla) *"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          style={styles.input}
          type="email"
          placeholder="Correo electrónico (No el de la empresa)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
            style={styles.input}
            value={equipoFavorito}
            onChange={(e) => setEquipoFavorito(e.target.value)}
        >
            <option value="Alemania">🇩🇪 Alemania</option>
            <option value="Arabia Saudita">🇸🇦 Arabia Saudita</option>
            <option value="Argelia">🇩🇿 Argelia</option>
            <option value="Argentina">🇦🇷 Argentina</option>
            <option value="Australia">🇦🇺 Australia</option>
            <option value="Austria">🇦🇹 Austria</option>
            <option value="Bélgica">🇧🇪 Bélgica</option>
            <option value="Brasil">🇧🇷 Brasil</option>
            <option value="Cabo Verde">🇨🇻 Cabo Verde</option>
            <option value="Camerún">🇨🇲 Camerún</option>
            <option value="Canadá">🇨🇦 Canadá</option>
            <option value="Chile">🇨🇱 Chile</option>
            <option value="Colombia">🇨🇴 Colombia</option>
            <option value="Corea del Sur">🇰🇷 Corea del Sur</option>
            <option value="Costa de Marfil">🇨🇮 Costa de Marfil</option>
            <option value="Croacia">🇭🇷 Croacia</option>
            <option value="Curazao">🇨🇼 Curazao</option>
            <option value="Dinamarca">🇩🇰 Dinamarca</option>
            <option value="Ecuador">🇪🇨 Ecuador</option>
            <option value="Egipto">🇪🇬 Egipto</option>
            <option value="España">🇪🇸 España</option>
            <option value="Estados Unidos">🇺🇸 Estados Unidos</option>
            <option value="Francia">🇫🇷 Francia</option>
            <option value="Ghana">🇬🇭 Ghana</option>
            <option value="Haití">🇭🇹 Haití</option>
            <option value="Inglaterra">🏴 Inglaterra</option>
            <option value="Irak">🇮🇶 Irak</option>
            <option value="Irán">🇮🇷 Irán</option>
            <option value="Japón">🇯🇵 Japón</option>
            <option value="Jordania">🇯🇴 Jordania</option>
            <option value="Marruecos">🇲🇦 Marruecos</option>
            <option value="México">🇲🇽 México</option>
            <option value="Noruega">🇳🇴 Noruega</option>
            <option value="Nueva Zelanda">🇳🇿 Nueva Zelanda</option>
            <option value="Países Bajos">🇳🇱 Países Bajos</option>
            <option value="Panamá">🇵🇦 Panamá</option>
            <option value="Paraguay">🇵🇾 Paraguay</option>
            <option value="Perú">🇵🇪 Perú</option>
            <option value="Polonia">🇵🇱 Polonia</option>
            <option value="Portugal">🇵🇹 Portugal</option>
            <option value="Qatar">🇶🇦 Qatar</option>
            <option value="Senegal">🇸🇳 Senegal</option>
            <option value="Serbia">🇷🇸 Serbia</option>
            <option value="Sudáfrica">🇿🇦 Sudáfrica</option>
            <option value="Suiza">🇨🇭 Suiza</option>
            <option value="Túnez">🇹🇳 Túnez</option>
            <option value="Uruguay">🇺🇾 Uruguay</option>
            <option value="Uzbekistán">🇺🇿 Uzbekistán</option>
        </select>
        <input
          style={styles.input}
          type="password"
          placeholder="Contraseña *"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Confirmar contraseña *"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={styles.button}
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <p style={styles.link}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login">Inicia sesión</Link>
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