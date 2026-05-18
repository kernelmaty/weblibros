// ============================================================
// components/BookList.jsx — Biblioteca: lista y cards de libros
// ============================================================
import { useState } from 'react'
import { calcPorcentaje } from '../utils/calculations'
import BookForm from './BookForm'

const ESTADOS    = ['todos', 'pendiente', 'leyendo', 'leído']
const PRIORIDADES = ['todas', 'alta', 'media', 'baja']

export default function BookList({ books, onSave, onDelete }) {
  const [showForm,   setShowForm]   = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [confirm,    setConfirm]    = useState(null)
  const [search,     setSearch]     = useState('')
  const [filtroEst,  setFiltroEst]  = useState('todos')
  const [filtroPri,  setFiltroPri]  = useState('todas')
  const [filtroGen,  setFiltroGen]  = useState('todos')
  const [toast,      setToast]      = useState(null)

  const generos = ['todos', ...new Set(books.map(b => b.genero).filter(Boolean))]

  const filtered = books.filter(b => {
    const q = search.toLowerCase()
    const matchSearch  = !q || b.titulo.toLowerCase().includes(q) || b.autor.toLowerCase().includes(q)
    const matchEstado  = filtroEst  === 'todos'  || b.estado    === filtroEst
    const matchPrior   = filtroPri  === 'todas'  || b.prioridad === filtroPri
    const matchGenero  = filtroGen  === 'todos'  || b.genero    === filtroGen
    return matchSearch && matchEstado && matchPrior && matchGenero
  })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }

  const handleSave = (book) => {
    onSave(book)
    setShowForm(false)
    setEditing(null)
    showToast(editing ? 'Libro actualizado correctamente.' : 'Libro agregado a tu biblioteca.')
  }

  const handleDelete = (id) => {
    onDelete(id)
    setConfirm(null)
    showToast('Libro eliminado.', 'error')
  }

  const openEdit = (book) => {
    setEditing(book)
    setShowForm(true)
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>Biblioteca</h2>
          <p>{books.length} libro{books.length !== 1 ? 's' : ''} en tu colección</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
          ➕ Agregar libro
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`alert alert-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '🗑️'} {toast.msg}
        </div>
      )}

      {/* Filtros */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <span className="icon">🔍</span>
          <input
            className="form-control"
            placeholder="Buscar por título o autor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className="form-control" style={{ width: 'auto' }} value={filtroEst} onChange={e => setFiltroEst(e.target.value)}>
          {ESTADOS.map(e => <option key={e} value={e}>{e === 'todos' ? 'Todos los estados' : e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
        </select>

        <select className="form-control" style={{ width: 'auto' }} value={filtroPri} onChange={e => setFiltroPri(e.target.value)}>
          {PRIORIDADES.map(p => <option key={p} value={p}>{p === 'todas' ? 'Todas las prioridades' : 'Prioridad ' + p}</option>)}
        </select>

        <select className="form-control" style={{ width: 'auto' }} value={filtroGen} onChange={e => setFiltroGen(e.target.value)}>
          {generos.map(g => <option key={g} value={g}>{g === 'todos' ? 'Todos los géneros' : g}</option>)}
        </select>
      </div>

      {/* Grid de libros */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📚</div>
          <h3>No se encontraron libros</h3>
          <p>Intentá con otros filtros o agregá un nuevo libro.</p>
        </div>
      ) : (
        <div className="books-grid">
          {filtered.map(book => (
            <BookCard
              key={book.id}
              book={book}
              onEdit={() => openEdit(book)}
              onDelete={() => setConfirm(book.id)}
            />
          ))}
        </div>
      )}

      {/* Modal formulario */}
      {showForm && (
        <BookForm
          book={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {/* Confirmación de borrado */}
      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Eliminar libro</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text2)' }}>¿Estás seguro de que querés eliminar este libro? Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirm)}>🗑️ Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Card individual ----------
function BookCard({ book, onEdit, onDelete }) {
  const pct = calcPorcentaje(book.pagina_actual, book.paginas_totales)

  return (
    <div className="book-card">
      {/* Portada */}
      <div className="book-card-cover">
        {book.portada_url ? (
          <img src={book.portada_url} alt={book.titulo} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
        ) : null}
        <div className="book-card-cover-placeholder" style={{ display: book.portada_url ? 'none' : 'flex' }}>📚</div>
      </div>

      {/* Cuerpo */}
      <div className="book-card-body">
        <div className="book-card-title">{book.titulo}</div>
        <div className="book-card-author">{book.autor}</div>

        <div className="book-card-meta">
          <span className={`badge badge-${book.estado.replace('í','i')}`}>
            {book.estado === 'leyendo' ? '📖' : book.estado === 'leído' ? '✅' : '🕐'} {book.estado}
          </span>
          <span className={`badge badge-${book.prioridad}`}>
            {book.prioridad === 'alta' ? '🔴' : book.prioridad === 'media' ? '🟡' : '🟢'} {book.prioridad}
          </span>
          {book.genero && <span className="badge" style={{ background: 'var(--bg3)', color: 'var(--text3)' }}>{book.genero}</span>}
          {book.formato && <span className="badge" style={{ background: 'var(--bg3)', color: 'var(--text3)' }}>{book.formato}</span>}
        </div>

        {book.notas && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text3)', fontStyle: 'italic', borderLeft: '2px solid var(--border2)', paddingLeft: 8, marginTop: 4 }}>
            {book.notas.length > 80 ? book.notas.slice(0, 80) + '…' : book.notas}
          </div>
        )}

        {/* Progreso */}
        <div className="book-card-progress">
          <div className="book-card-progress-label">
            <span>Pág. {book.pagina_actual} / {book.paginas_totales}</span>
            <span>{pct}%</span>
          </div>
          <div className="progress-bar-wrap">
            <div className={`progress-bar-fill${pct === 100 ? ' done' : ''}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="book-card-actions">
        <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={onEdit}>✏️ Editar</button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>🗑️</button>
      </div>
    </div>
  )
}
