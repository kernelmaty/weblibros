// ============================================================
// components/ReadingLog.jsx — Registro diario de sesiones
// ============================================================
import { useState } from 'react'
import { genId } from '../utils/calculations'

const EMPTY_FORM = {
  libro_id: '',
  fecha: new Date().toISOString().split('T')[0],
  pagina_inicio: '',
  pagina_fin: '',
  minutos: '',
  comentario: '',
}

export default function ReadingLog({ books, sessions, onAddSession, onUpdateBook }) {
  const [form,   setForm]   = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [toast,  setToast]  = useState(null)
  const [filtroLibro, setFiltroLibro] = useState('todos')

  const booksActivos = books.filter(b => b.estado !== 'leído')
  const libro = books.find(b => b.id === form.libro_id)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  const paginasLeidas = () => {
    const ini = parseInt(form.pagina_inicio)
    const fin = parseInt(form.pagina_fin)
    if (!isNaN(ini) && !isNaN(fin) && fin > ini) return fin - ini
    return null
  }

  const validate = () => {
    const errs = {}
    if (!form.libro_id)             errs.libro_id      = 'Seleccioná un libro.'
    if (!form.fecha)                errs.fecha         = 'La fecha es obligatoria.'
    const ini = parseInt(form.pagina_inicio)
    const fin = parseInt(form.pagina_fin)
    if (!form.pagina_inicio || isNaN(ini) || ini < 0) errs.pagina_inicio = 'Ingresá la página inicial.'
    if (!form.pagina_fin    || isNaN(fin) || fin < 0) errs.pagina_fin    = 'Ingresá la página final.'
    if (!isNaN(ini) && !isNaN(fin) && fin <= ini)     errs.pagina_fin    = 'La página final debe ser mayor que la inicial.'
    if (libro && !isNaN(fin) && fin > libro.paginas_totales)
      errs.pagina_fin = `No puede superar el total (${libro.paginas_totales} págs.).`
    return errs
  }

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const ini = parseInt(form.pagina_inicio)
    const fin = parseInt(form.pagina_fin)
    const pagLeidas = fin - ini

    const session = {
      id: genId(),
      libro_id: form.libro_id,
      fecha: form.fecha,
      pagina_inicio: ini,
      pagina_fin: fin,
      minutos: parseInt(form.minutos) || 0,
      comentario: form.comentario.trim(),
      paginas_leidas: pagLeidas,
    }

    onAddSession(session)

    // Actualizar página actual del libro
    if (libro && fin > libro.pagina_actual) {
      const updated = { ...libro, pagina_actual: fin }
      if (fin >= libro.paginas_totales) updated.estado = 'leído'
      onUpdateBook(updated)
    }

    setForm(EMPTY_FORM)
    showToast(`Sesión registrada: ${pagLeidas} páginas leídas.`)
  }

  // Sesiones filtradas por libro
  const sessionsOrdenadas = [...sessions].sort((a, b) => b.fecha.localeCompare(a.fecha))
  const sessionsFiltradas = filtroLibro === 'todos'
    ? sessionsOrdenadas
    : sessionsOrdenadas.filter(s => s.libro_id === filtroLibro)

  const errStyle = (key) => errors[key] ? { borderColor: 'var(--red)' } : {}

  return (
    <div>
      <div className="page-header">
        <h2>Registro diario</h2>
        <p>Anotá cada sesión de lectura para llevar tu progreso</p>
      </div>

      {toast && (
        <div className={`alert alert-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.msg}
        </div>
      )}

      {/* Formulario */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">📝 Nueva sesión</div>

        <div className="form-grid">
          {/* Libro */}
          <div className="form-group">
            <label className="form-label">Libro *</label>
            <select className="form-control" value={form.libro_id} onChange={e => set('libro_id', e.target.value)} style={errStyle('libro_id')}>
              <option value="">— Seleccioná un libro —</option>
              {booksActivos.map(b => (
                <option key={b.id} value={b.id}>{b.titulo} ({b.autor})</option>
              ))}
              {books.filter(b => b.estado === 'leído').length > 0 && (
                <>
                  <option disabled>── Leídos ──</option>
                  {books.filter(b => b.estado === 'leído').map(b => (
                    <option key={b.id} value={b.id}>{b.titulo} ({b.autor})</option>
                  ))}
                </>
              )}
            </select>
            {errors.libro_id && <span style={{ color: 'var(--red)', fontSize: '0.78rem' }}>{errors.libro_id}</span>}
          </div>

          {/* Fecha */}
          <div className="form-group">
            <label className="form-label">Fecha *</label>
            <input className="form-control" type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} style={errStyle('fecha')} />
            {errors.fecha && <span style={{ color: 'var(--red)', fontSize: '0.78rem' }}>{errors.fecha}</span>}
          </div>

          {/* Páginas */}
          <div className="form-group">
            <label className="form-label">Página inicial *</label>
            <input className="form-control" type="number" min="0" value={form.pagina_inicio}
              onChange={e => set('pagina_inicio', e.target.value)} style={errStyle('pagina_inicio')}
              placeholder={libro ? `Última: ${libro.pagina_actual}` : '0'} />
            {errors.pagina_inicio && <span style={{ color: 'var(--red)', fontSize: '0.78rem' }}>{errors.pagina_inicio}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Página final *</label>
            <input className="form-control" type="number" min="0" value={form.pagina_fin}
              onChange={e => set('pagina_fin', e.target.value)} style={errStyle('pagina_fin')}
              placeholder={libro ? `Máx: ${libro.paginas_totales}` : '0'} />
            {errors.pagina_fin && <span style={{ color: 'var(--red)', fontSize: '0.78rem' }}>{errors.pagina_fin}</span>}
          </div>

          {/* Minutos */}
          <div className="form-group">
            <label className="form-label">Minutos leídos</label>
            <input className="form-control" type="number" min="0" value={form.minutos}
              onChange={e => set('minutos', e.target.value)} placeholder="Ej: 45" />
          </div>

          {/* Preview páginas */}
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {paginasLeidas() !== null ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--gold)' }}>{paginasLeidas()}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>páginas en esta sesión</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '0.85rem' }}>
                Ingresá las páginas<br />para ver el cálculo
              </div>
            )}
          </div>

          {/* Comentario */}
          <div className="form-group col-span-2">
            <label className="form-label">Comentario</label>
            <input className="form-control" type="text" value={form.comentario}
              onChange={e => set('comentario', e.target.value)}
              placeholder="¿Qué pasó? ¿Qué te pareció?" />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          <button className="btn btn-outline" onClick={() => { setForm(EMPTY_FORM); setErrors({}) }}>Limpiar</button>
          <button className="btn btn-primary" onClick={handleSubmit}>✅ Registrar sesión</button>
        </div>
      </div>

      {/* Historial */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
            📋 Historial de sesiones ({sessions.length})
          </div>
          <select className="form-control" style={{ width: 'auto' }} value={filtroLibro} onChange={e => setFiltroLibro(e.target.value)}>
            <option value="todos">Todos los libros</option>
            {books.map(b => <option key={b.id} value={b.id}>{b.titulo}</option>)}
          </select>
        </div>

        {sessionsFiltradas.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📝</div>
            <h3>Sin sesiones registradas</h3>
            <p>Completá el formulario de arriba para registrar tu primera sesión.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Libro</th>
                  <th>Págs. inicio</th>
                  <th>Págs. fin</th>
                  <th>Leídas</th>
                  <th>Minutos</th>
                  <th>Comentario</th>
                </tr>
              </thead>
              <tbody>
                {sessionsFiltradas.map(s => {
                  const b = books.find(x => x.id === s.libro_id)
                  return (
                    <tr key={s.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{s.fecha}</td>
                      <td className="td-title">{b ? b.titulo : <span style={{ color: 'var(--text3)' }}>Eliminado</span>}</td>
                      <td style={{ textAlign: 'right' }}>{s.pagina_inicio}</td>
                      <td style={{ textAlign: 'right' }}>{s.pagina_fin}</td>
                      <td style={{ textAlign: 'right', color: 'var(--gold)', fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{s.paginas_leidas}</td>
                      <td style={{ textAlign: 'right' }}>{s.minutos || '—'}</td>
                      <td style={{ color: 'var(--text3)', fontStyle: s.comentario ? 'italic' : 'normal' }}>
                        {s.comentario || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
