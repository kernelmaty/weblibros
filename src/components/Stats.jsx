// ============================================================
// components/Stats.jsx — Estadísticas detalladas
// ============================================================
import {
  calcPorcentaje,
  calcPendientes,
  promedioPorSesion,
  totalPaginasSesiones,
  calcRacha,
  promedioDiario,
} from '../utils/calculations'

export default function Stats({ books, sessions }) {
  // ---- Libros ----
  const enCurso    = books.filter(b => b.estado === 'leyendo')
  const pendientes = books.filter(b => b.estado === 'pendiente')
  const leidos     = books.filter(b => b.estado === 'leído')

  // Libro más avanzado (% más alto en curso)
  const masAvanzado = [...enCurso].sort(
    (a, b) => calcPorcentaje(b.pagina_actual, b.paginas_totales) - calcPorcentaje(a.pagina_actual, a.paginas_totales)
  )[0]

  // Libro con más páginas pendientes
  const masPendiente = [...books].sort(
    (a, b) => calcPendientes(b.pagina_actual, b.paginas_totales) - calcPendientes(a.pagina_actual, a.paginas_totales)
  )[0]

  // ---- Sesiones ----
  const totalSesiones   = sessions.length
  const totalPaginas    = totalPaginasSesiones(sessions)
  const promSesion      = promedioPorSesion(sessions)
  const promDia         = promedioDiario(sessions)
  const racha           = calcRacha(sessions)
  const totalMinutos    = sessions.reduce((acc, s) => acc + (s.minutos || 0), 0)
  const totalHoras      = (totalMinutos / 60).toFixed(1)

  // Género más leído (en leídos)
  const genCount = {}
  leidos.forEach(b => { if (b.genero) genCount[b.genero] = (genCount[b.genero] || 0) + 1 })
  const generoTop = Object.entries(genCount).sort((a, b) => b[1] - a[1])[0]

  // Libro más veloz (más páginas/minuto) en sesiones
  const velocidades = sessions.filter(s => s.minutos > 0).map(s => ({
    ...s,
    ppm: (s.paginas_leidas / s.minutos).toFixed(2),
  }))
  velocidades.sort((a, b) => b.ppm - a.ppm)
  const sesionRapida = velocidades[0]
  const libroRapido = sesionRapida ? books.find(b => b.id === sesionRapida.libro_id) : null

  // Distribución por estado
  const total = books.length || 1

  // Sesiones por libro (top 3)
  const sessionsByBook = {}
  sessions.forEach(s => {
    sessionsByBook[s.libro_id] = (sessionsByBook[s.libro_id] || 0) + 1
  })
  const topSesiones = Object.entries(sessionsByBook)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({ book: books.find(b => b.id === id), count }))
    .filter(x => x.book)

  const StatRow = ({ label, value, sub, gold }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>{label}</div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: gold ? 'var(--gold)' : 'var(--text)' }}>{value}</div>
        {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{sub}</div>}
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h2>Estadísticas</h2>
        <p>Un análisis completo de tus hábitos de lectura</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>

        {/* Colección */}
        <div className="card">
          <div className="section-title">📚 Colección</div>
          <StatRow label="Total de libros" value={books.length} />
          <StatRow label="Pendientes" value={pendientes.length} />
          <StatRow label="En curso" value={enCurso.length} />
          <StatRow label="Leídos" value={leidos.length} />
          <StatRow label="Género más leído" value={generoTop ? generoTop[0] : '—'} sub={generoTop ? `${generoTop[1]} libro(s)` : ''} />

          {/* Barra de distribución */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 6 }}>Distribución</div>
            <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', gap: 2 }}>
              <div style={{ flex: pendientes.length, background: 'var(--text3)' }} title="Pendientes" />
              <div style={{ flex: enCurso.length, background: 'var(--blue)' }} title="Leyendo" />
              <div style={{ flex: leidos.length, background: 'var(--green)' }} title="Leídos" />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: '0.72rem', color: 'var(--text3)' }}>
              <span>⬜ Pendientes</span>
              <span style={{ color: '#7ab4d8' }}>📘 Leyendo</span>
              <span style={{ color: '#7dc492' }}>✅ Leídos</span>
            </div>
          </div>
        </div>

        {/* Sesiones */}
        <div className="card">
          <div className="section-title">📖 Sesiones de lectura</div>
          <StatRow label="Total de sesiones" value={totalSesiones} />
          <StatRow label="Páginas leídas (total)" value={totalPaginas.toLocaleString('es')} gold />
          <StatRow label="Promedio por sesión" value={`${promSesion} págs.`} />
          <StatRow label="Promedio diario (30d)" value={`${promDia} págs.`} />
          <StatRow label="Minutos totales" value={totalMinutos.toLocaleString('es')} sub={`${totalHoras} horas`} />
          <StatRow label="Racha actual" value={`${racha} día${racha !== 1 ? 's' : ''}`} gold={racha >= 3} />
        </div>

        {/* Destacados */}
        <div className="card">
          <div className="section-title">🏆 Destacados</div>

          {masAvanzado ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Libro más avanzado</div>
              <div style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text)', fontSize: '0.95rem' }}>{masAvanzado.titulo}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 6 }}>{masAvanzado.autor}</div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${calcPorcentaje(masAvanzado.pagina_actual, masAvanzado.paginas_totales)}%` }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 4 }}>
                {calcPorcentaje(masAvanzado.pagina_actual, masAvanzado.paginas_totales)}% completado
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text3)', fontSize: '0.875rem', marginBottom: 16 }}>No hay libros en curso.</div>
          )}

          {masPendiente && calcPendientes(masPendiente.pagina_actual, masPendiente.paginas_totales) > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Más páginas pendientes</div>
              <div style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text)', fontSize: '0.95rem' }}>{masPendiente.titulo}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                {calcPendientes(masPendiente.pagina_actual, masPendiente.paginas_totales).toLocaleString('es')} páginas por leer
              </div>
            </div>
          )}

          {libroRapido && (
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Sesión más veloz</div>
              <div style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text)', fontSize: '0.95rem' }}>{libroRapido.titulo}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                {sesionRapida.ppm} págs/min · {sesionRapida.fecha}
              </div>
            </div>
          )}
        </div>

        {/* Top libros por sesiones */}
        {topSesiones.length > 0 && (
          <div className="card">
            <div className="section-title">📊 Más trabajados</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 12 }}>Libros con más sesiones registradas</div>
            {topSesiones.map(({ book, count }, i) => (
              <div key={book.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--gold)', width: 32, textAlign: 'center' }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {book.titulo}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{book.autor}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", color: 'var(--gold)' }}>{count}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>sesiones</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
