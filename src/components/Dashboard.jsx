// ============================================================
// components/Dashboard.jsx — Panel principal con estadísticas
// ============================================================
import { calcPorcentaje, promedioDiario, calcRacha, totalPaginasSesiones } from '../utils/calculations'

const VIEWS = ['dashboard', 'biblioteca', 'registro', 'plan', 'estadisticas']

export default function Dashboard({ books, sessions }) {
  // ----- Cálculos de resumen -----
  const total     = books.length
  const pendiente = books.filter(b => b.estado === 'pendiente').length
  const leyendo   = books.filter(b => b.estado === 'leyendo').length
  const leido     = books.filter(b => b.estado === 'leído').length
  const paginas   = totalPaginasSesiones(sessions)
  const promedio  = promedioDiario(sessions)
  const racha     = calcRacha(sessions)

  // Libro más avanzado (en curso)
  const enCurso = books.filter(b => b.estado === 'leyendo')
  const masAvanzado = enCurso.sort(
    (a, b) => calcPorcentaje(b.pagina_actual, b.paginas_totales) - calcPorcentaje(a.pagina_actual, a.paginas_totales)
  )[0]

  // Últimas sesiones (5)
  const ultimasSesiones = [...sessions]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5)

  const stats = [
    { label: 'Total de libros', value: total, sub: 'en tu colección', icon: '📚' },
    { label: 'Pendientes',      value: pendiente, sub: 'por empezar', icon: '🕐' },
    { label: 'Leyendo',         value: leyendo,   sub: 'en curso', icon: '📖', highlight: leyendo > 0 },
    { label: 'Leídos',          value: leido,     sub: 'completados', icon: '✅' },
    { label: 'Páginas leídas',  value: paginas.toLocaleString('es'), sub: 'en sesiones', icon: '📄' },
    { label: 'Promedio diario', value: promedio,  sub: 'págs/día (30d)', icon: '📊' },
    { label: 'Racha',           value: racha,     sub: racha === 1 ? 'día seguido' : 'días seguidos', icon: '🔥', highlight: racha >= 3 },
  ]

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Resumen de tu colección y hábitos de lectura</p>
      </div>

      {/* Estadísticas principales */}
      <div className="stat-grid">
        {stats.map(s => (
          <div key={s.label} className={`stat-card${s.highlight ? ' highlight' : ''}`}>
            <div className="label">{s.icon} {s.label}</div>
            <div className="value">{s.value}</div>
            <div className="sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Libro más avanzado */}
        <div className="card">
          <div className="section-title">📖 Leyendo ahora</div>
          {masAvanzado ? (
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              {masAvanzado.portada_url ? (
                <img
                  src={masAvanzado.portada_url}
                  alt="portada"
                  style={{ width: 56, height: 80, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                  onError={e => { e.target.style.display='none' }}
                />
              ) : (
                <div style={{ width: 56, height: 80, background: 'var(--bg3)', borderRadius: 6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>📚</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', marginBottom: 2 }}>{masAvanzado.titulo}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 10 }}>{masAvanzado.autor}</div>
                <div className="progress-bar-wrap">
                  <div
                    className={`progress-bar-fill${masAvanzado.estado === 'leído' ? ' done' : ''}`}
                    style={{ width: `${calcPorcentaje(masAvanzado.pagina_actual, masAvanzado.paginas_totales)}%` }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text3)', marginTop: 5 }}>
                  <span>Pág. {masAvanzado.pagina_actual} / {masAvanzado.paginas_totales}</span>
                  <span>{calcPorcentaje(masAvanzado.pagina_actual, masAvanzado.paginas_totales)}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="icon">📖</div>
              <p>No estás leyendo ningún libro actualmente.</p>
            </div>
          )}
        </div>

        {/* Últimas sesiones */}
        <div className="card">
          <div className="section-title">🕐 Últimas sesiones</div>
          {ultimasSesiones.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="icon">📝</div>
              <p>Aún no registraste sesiones de lectura.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ultimasSesiones.map(s => {
                const libro = books.find(b => b.id === s.libro_id)
                return (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 500 }}>
                        {libro ? libro.titulo : 'Libro eliminado'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{s.fecha}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'Playfair Display', serif", color: 'var(--gold)', fontSize: '1rem' }}>{s.paginas_leidas}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>páginas</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Progreso de libros en curso */}
      {enCurso.length > 0 && (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="section-title">📊 Progreso de libros en curso</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {enCurso.map(b => {
              const pct = calcPorcentaje(b.pagina_actual, b.paginas_totales)
              return (
                <div key={b.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{b.titulo}</span>
                    <span style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>{pct}% · pág. {b.pagina_actual}/{b.paginas_totales}</span>
                  </div>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
