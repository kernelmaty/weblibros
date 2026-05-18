// ============================================================
// components/ReadingPlan.jsx — Generador de plan de lectura
// ============================================================
import { useState, useEffect } from 'react'
import { generarCronograma, calcPendientes, formatFecha } from '../utils/calculations'

const DIAS_SEMANA = [
  { label: 'Lun', val: 1 },
  { label: 'Mar', val: 2 },
  { label: 'Mié', val: 3 },
  { label: 'Jue', val: 4 },
  { label: 'Vie', val: 5 },
  { label: 'Sáb', val: 6 },
  { label: 'Dom', val: 0 },
]

export default function ReadingPlan({ books, plan, onSavePlan }) {
  const today = new Date().toISOString().split('T')[0]

  const [selectedIds, setSelectedIds] = useState(plan?.selectedIds || [])
  const [fechaInicio, setFechaInicio] = useState(plan?.fechaInicio || today)
  const [fechaFin,    setFechaFin]    = useState(plan?.fechaFin    || '')
  const [descanso,    setDescanso]    = useState(plan?.descanso    || [])
  const [cronograma,  setCronograma]  = useState([])
  const [errors,      setErrors]      = useState({})
  const [generated,   setGenerated]   = useState(false)

  const booksConPendientes = books.filter(b => calcPendientes(b.pagina_actual, b.paginas_totales) > 0)

  const toggleBook = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setGenerated(false)
  }

  const toggleDescanso = (val) => {
    setDescanso(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])
    setGenerated(false)
  }

  const validate = () => {
    const errs = {}
    if (!selectedIds.length) errs.books     = 'Seleccioná al menos un libro.'
    if (!fechaInicio)         errs.inicio    = 'La fecha de inicio es obligatoria.'
    if (!fechaFin)            errs.fin       = 'La fecha objetivo es obligatoria.'
    if (fechaFin && fechaFin <= fechaInicio) errs.fin = 'La fecha objetivo debe ser posterior al inicio.'
    return errs
  }

  const handleGenerar = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    const booksSeleccionados = selectedIds
      .map(id => books.find(b => b.id === id))
      .filter(Boolean)

    const crono = generarCronograma(booksSeleccionados, fechaInicio, fechaFin, descanso)
    setCronograma(crono)
    setGenerated(true)

    const planData = { selectedIds, fechaInicio, fechaFin, descanso }
    onSavePlan(planData)
  }

  // Resumen del plan
  const selectedBooks = selectedIds.map(id => books.find(b => b.id === id)).filter(Boolean)
  const totalPendientes = selectedBooks.reduce((acc, b) => acc + calcPendientes(b.pagina_actual, b.paginas_totales), 0)

  // Días hábiles estimados
  const diasHabilesCount = (() => {
    if (!fechaInicio || !fechaFin) return 0
    const ini = new Date(fechaInicio + 'T00:00:00')
    const fin = new Date(fechaFin + 'T00:00:00')
    let count = 0, cur = new Date(ini)
    while (cur <= fin) {
      if (!descanso.includes(cur.getDay())) count++
      cur.setDate(cur.getDate() + 1)
    }
    return count
  })()

  const paginasPorDia = diasHabilesCount > 0 ? Math.ceil(totalPendientes / diasHabilesCount) : 0

  return (
    <div>
      <div className="page-header">
        <h2>Plan de lectura</h2>
        <p>Generá un cronograma personalizado para tus libros</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
        {/* Selector de libros */}
        <div className="card">
          <div className="section-title">📚 Seleccioná los libros</div>

          {errors.books && <div className="alert alert-error">⚠️ {errors.books}</div>}

          {booksConPendientes.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <div className="icon">🎉</div>
              <p>¡No tenés libros con páginas pendientes!</p>
            </div>
          ) : (
            <div className="book-select-list">
              {booksConPendientes.map(b => {
                const sel = selectedIds.includes(b.id)
                const pendientes = calcPendientes(b.pagina_actual, b.paginas_totales)
                return (
                  <div
                    key={b.id}
                    className={`book-select-item${sel ? ' selected' : ''}`}
                    onClick={() => toggleBook(b.id)}
                  >
                    <div className="book-select-check">{sel ? '✓' : ''}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.titulo}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
                        {b.autor} · {pendientes} págs. pendientes
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Configuración */}
        <div className="card">
          <div className="section-title">⚙️ Configuración del plan</div>

          <div className="form-group">
            <label className="form-label">Fecha de inicio *</label>
            <input className="form-control" type="date" value={fechaInicio}
              onChange={e => { setFechaInicio(e.target.value); setGenerated(false) }}
              style={errors.inicio ? { borderColor: 'var(--red)' } : {}} />
            {errors.inicio && <span style={{ color: 'var(--red)', fontSize: '0.78rem' }}>{errors.inicio}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Fecha objetivo *</label>
            <input className="form-control" type="date" value={fechaFin}
              onChange={e => { setFechaFin(e.target.value); setGenerated(false) }}
              style={errors.fin ? { borderColor: 'var(--red)' } : {}} />
            {errors.fin && <span style={{ color: 'var(--red)', fontSize: '0.78rem' }}>{errors.fin}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Días de descanso</label>
            <div className="check-group">
              {DIAS_SEMANA.map(d => (
                <label key={d.val} className={`check-chip${descanso.includes(d.val) ? ' selected' : ''}`}>
                  <input type="checkbox" checked={descanso.includes(d.val)} onChange={() => toggleDescanso(d.val)} />
                  {d.label}
                </label>
              ))}
            </div>
          </div>

          {/* Preview del plan */}
          {selectedIds.length > 0 && fechaInicio && fechaFin && (
            <div className="card-sm" style={{ marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Libros', value: selectedBooks.length },
                  { label: 'Págs. pendientes', value: totalPendientes.toLocaleString('es') },
                  { label: 'Días hábiles', value: diasHabilesCount },
                  { label: 'Págs. por día', value: paginasPorDia },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--gold)' }}>{item.value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleGenerar}>
              🗓️ Generar cronograma
            </button>
          </div>
        </div>
      </div>

      {/* Cronograma */}
      {generated && (
        <div>
          {cronograma.length === 0 ? (
            <div className="alert alert-error">
              ⚠️ No se pudo generar el cronograma. Verificá que las fechas sean correctas y que haya días hábiles suficientes.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                  🗓️ Cronograma generado — {cronograma.length} días
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>
                  {formatFecha(fechaInicio)} → {formatFecha(fechaFin)}
                </div>
              </div>

              <div className="table-wrap">
                <table className="plan-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Fecha</th>
                      <th>Libro</th>
                      <th>Autor</th>
                      <th>Desde pág.</th>
                      <th>Hasta pág.</th>
                      <th>Páginas del día</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cronograma.map((row, i) => (
                      <tr key={i} className="plan-day-row">
                        <td style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>{i + 1}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatFecha(row.fecha)}</td>
                        <td className="td-title">{row.libro}</td>
                        <td style={{ color: 'var(--text3)' }}>{row.autor}</td>
                        <td style={{ textAlign: 'right' }}>{row.desde}</td>
                        <td style={{ textAlign: 'right' }}>{row.hasta}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="cronograma-pages">{row.paginas}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
