import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Predicciones from './pages/Predicciones'
import TablaGeneral from './pages/TablaGeneral'
import PrediccionesEspeciales from './pages/PrediccionesEspeciales'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/home" element={<Home />} />
      <Route path="/predicciones" element={<Predicciones />} />
      <Route path="/tabla" element={<TablaGeneral />} />
      <Route path="/predicciones-especiales" element={<PrediccionesEspeciales />} />
    </Routes>
  )
}

export default App