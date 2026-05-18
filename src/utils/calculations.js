// ============================================================
// utils/calculations.js — Lógica de cálculos de lectura
// ============================================================

/**
 * Calcula el porcentaje leído de un libro
 */
export const calcPorcentaje = (pagina_actual, paginas_totales) => {
  if (!paginas_totales || paginas_totales === 0) return 0
  return Math.min(100, Math.round((pagina_actual / paginas_totales) * 100))
}

/**
 * Calcula páginas pendientes de un libro
 */
export const calcPendientes = (pagina_actual, paginas_totales) => {
  return Math.max(0, paginas_totales - pagina_actual)
}

/**
 * Total de páginas leídas en todas las sesiones
 */
export const totalPaginasSesiones = (sessions) => {
  return sessions.reduce((acc, s) => acc + (s.paginas_leidas || 0), 0)
}

/**
 * Promedio de páginas por sesión
 */
export const promedioPorSesion = (sessions) => {
  if (!sessions.length) return 0
  return Math.round(totalPaginasSesiones(sessions) / sessions.length)
}

/**
 * Promedio diario de páginas (últimos 30 días)
 */
export const promedioDiario = (sessions) => {
  if (!sessions.length) return 0
  const hace30 = new Date()
  hace30.setDate(hace30.getDate() - 30)
  const recientes = sessions.filter(s => new Date(s.fecha) >= hace30)
  if (!recientes.length) return 0
  const total = recientes.reduce((acc, s) => acc + (s.paginas_leidas || 0), 0)
  return Math.round(total / 30)
}

/**
 * Calcula racha de días consecutivos leyendo
 */
export const calcRacha = (sessions) => {
  if (!sessions.length) return 0
  // Obtener fechas únicas ordenadas desc
  const fechas = [...new Set(sessions.map(s => s.fecha))].sort((a, b) => b.localeCompare(a))
  if (!fechas.length) return 0

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const ayer = new Date(hoy)
  ayer.setDate(ayer.getDate() - 1)

  // La racha empieza solo si leyó hoy o ayer
  const primera = new Date(fechas[0])
  primera.setHours(0, 0, 0, 0)
  if (primera < ayer) return 0

  let racha = 1
  for (let i = 1; i < fechas.length; i++) {
    const actual = new Date(fechas[i])
    const anterior = new Date(fechas[i - 1])
    actual.setHours(0, 0, 0, 0)
    anterior.setHours(0, 0, 0, 0)
    const diff = (anterior - actual) / (1000 * 60 * 60 * 24)
    if (diff === 1) racha++
    else break
  }
  return racha
}

/**
 * Genera cronograma día por día para el plan de lectura
 * @param {Array} books - libros seleccionados con info completa
 * @param {string} fechaInicio - YYYY-MM-DD
 * @param {string} fechaFin - YYYY-MM-DD
 * @param {Array} diasDescanso - [0,6] = dom y sab (números 0-6)
 * @returns {Array} cronograma []
 */
export const generarCronograma = (books, fechaInicio, fechaFin, diasDescanso = []) => {
  if (!books.length || !fechaInicio || !fechaFin) return []

  // Calcular días hábiles disponibles
  const inicio = new Date(fechaInicio + 'T00:00:00')
  const fin = new Date(fechaFin + 'T00:00:00')

  if (fin <= inicio) return []

  // Listar todos los días hábiles
  const diasHabiles = []
  const cursor = new Date(inicio)
  while (cursor <= fin) {
    if (!diasDescanso.includes(cursor.getDay())) {
      diasHabiles.push(new Date(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  if (!diasHabiles.length) return []

  // Total de páginas pendientes
  const totalPendientes = books.reduce((acc, b) => {
    return acc + calcPendientes(b.pagina_actual, b.paginas_totales)
  }, 0)

  const paginasPorDia = Math.ceil(totalPendientes / diasHabiles.length)

  // Generar asignaciones día a día
  const cronograma = []
  let libroIdx = 0
  let paginaActual = books[0] ? books[0].pagina_actual : 0

  for (const dia of diasHabiles) {
    if (libroIdx >= books.length) break

    const libro = books[libroIdx]
    const pendientesLibro = libro.paginas_totales - paginaActual
    if (pendientesLibro <= 0) {
      libroIdx++
      if (libroIdx < books.length) paginaActual = books[libroIdx].pagina_actual
      continue
    }

    const pagsDia = Math.min(paginasPorDia, pendientesLibro)
    const desde = paginaActual + 1
    const hasta = paginaActual + pagsDia

    cronograma.push({
      fecha: dia.toISOString().split('T')[0],
      libro: libro.titulo,
      autor: libro.autor,
      desde,
      hasta,
      paginas: pagsDia,
    })

    paginaActual += pagsDia

    // Si terminó el libro, pasar al siguiente
    if (paginaActual >= libro.paginas_totales) {
      libroIdx++
      if (libroIdx < books.length) paginaActual = books[libroIdx].pagina_actual
    }
  }

  return cronograma
}

/**
 * Formatea una fecha YYYY-MM-DD a texto legible en español
 */
export const formatFecha = (fechaStr) => {
  if (!fechaStr) return '—'
  const [y, m, d] = fechaStr.split('-')
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${parseInt(d)} ${meses[parseInt(m) - 1]} ${y}`
}

/**
 * Genera un ID único simple
 */
export const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
