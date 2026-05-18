// ============================================================
// App.jsx — Componente raíz: estado global + navegación
// ============================================================
import { useState, useEffect } from 'react'
import Dashboard   from './components/Dashboard'
import BookList    from './components/BookList'
import ReadingLog  from './components/ReadingLog'
import ReadingPlan from './components/ReadingPlan'
import Stats       from './components/Stats'
import {
  getBooks, saveBooks,
  getSessions, saveSessions,
  getPlan, savePlan,
  SAMPLE_BOOKS, SAMPLE_SESSIONS,
} from './utils/storage'

// Ítems del menú lateral
const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',        icon: '🏠' },
  { id: 'biblioteca',   label: 'Biblioteca',        icon: '📚' },
  { id: 'registro',     label: 'Registro diario',   icon: '📝' },
  { id: 'plan',         label: 'Plan de lectura',   icon: '🗓️' },
  { id: 'estadisticas', label: 'Estadísticas',      icon: '📊' },
]

export default function App() {
  const [vista,    setVista]    = useState('dashboard')
  const [books,    setBooks]    = useState([])
  const [sessions, setSessions] = useState([])
  const [plan,     setPlan]     = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // ----- Carga inicial -----
  useEffect(() => {
    const storedBooks = getBooks()
    setBooks(storedBooks ?? SAMPLE_BOOKS)

    const storedSessions = getSessions()
    setSessions(storedSessions.length ? storedSessions : SAMPLE_SESSIONS)

    const storedPlan = getPlan()
    if (storedPlan) setPlan(storedPlan)
  }, [])

  // ----- Guardar en localStorage al cambiar -----
  useEffect(() => { if (books.length)    saveBooks(books)      }, [books])
  useEffect(() => { if (sessions.length) saveSessions(sessions) }, [sessions])
  useEffect(() => { if (plan)            savePlan(plan)         }, [plan])

  // ----- Handlers de libros -----
  const handleSaveBook = (book) => {
    setBooks(prev => {
      const exists = prev.find(b => b.id === book.id)
      return exists
        ? prev.map(b => b.id === book.id ? book : b)
        : [...prev, book]
    })
  }

  const handleDeleteBook = (id) => {
    setBooks(prev => prev.filter(b => b.id !== id))
  }

  // ----- Handlers de sesiones -----
  const handleAddSession = (session) => {
    setSessions(prev => [session, ...prev])
  }

  // ----- Navegar cerrando menú en mobile -----
  const navigate = (id) => {
    setVista(id)
    setMenuOpen(false)
  }

  // ----- Renderizar vista activa -----
  const renderVista = () => {
    switch (vista) {
      case 'dashboard':
        return <Dashboard books={books} sessions={sessions} />
      case 'biblioteca':
        return <BookList books={books} onSave={handleSaveBook} onDelete={handleDeleteBook} />
      case 'registro':
        return (
          <ReadingLog
            books={books}
            sessions={sessions}
            onAddSession={handleAddSession}
            onUpdateBook={handleSaveBook}
          />
        )
      case 'plan':
        return <ReadingPlan books={books} plan={plan} onSavePlan={setPlan} />
      case 'estadisticas':
        return <Stats books={books} sessions={sessions} />
      default:
        return null
    }
  }

  return (
    <div className="app-wrapper">
      {/* ---- Header mobile ---- */}
      <div className="mobile-header">
        <div className="mobile-logo">WebLibros</div>
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menú">
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* ---- Overlay mobile ---- */}
      <div
        className={`sidebar-overlay${menuOpen ? ' visible' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* ---- Sidebar ---- */}
      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <h1>WebLibros</h1>
          <span>Tu biblioteca digital</span>
        </div>

        <nav>
          {NAV_ITEMS.map(item => (
            <div
              key={item.id}
              className={`nav-item${vista === item.id ? ' active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {books.length} libro{books.length !== 1 ? 's' : ''} · {sessions.length} sesión{sessions.length !== 1 ? 'es' : ''}
        </div>
      </aside>

      {/* ---- Contenido principal ---- */}
      <main className="main-content">
        {renderVista()}
      </main>
    </div>
  )
}
