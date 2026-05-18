// ============================================================
// utils/storage.js — Persistencia con localStorage
// ============================================================

const KEYS = {
  BOOKS: 'weblibros_books',
  SESSIONS: 'weblibros_sessions',
  PLAN: 'weblibros_plan',
}

// ---------- Libros ----------
export const getBooks = () => {
  try {
    const data = localStorage.getItem(KEYS.BOOKS)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export const saveBooks = (books) => {
  localStorage.setItem(KEYS.BOOKS, JSON.stringify(books))
}

// ---------- Sesiones de lectura ----------
export const getSessions = () => {
  try {
    const data = localStorage.getItem(KEYS.SESSIONS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const saveSessions = (sessions) => {
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions))
}

// ---------- Plan de lectura ----------
export const getPlan = () => {
  try {
    const data = localStorage.getItem(KEYS.PLAN)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export const savePlan = (plan) => {
  localStorage.setItem(KEYS.PLAN, JSON.stringify(plan))
}

// ---------- Datos de ejemplo ----------
export const SAMPLE_BOOKS = [
  {
    id: '1',
    titulo: 'Cien años de soledad',
    autor: 'Gabriel García Márquez',
    genero: 'Realismo mágico',
    editorial: 'Sudamericana',
    paginas_totales: 471,
    pagina_actual: 120,
    estado: 'leyendo',
    prioridad: 'alta',
    formato: 'físico',
    portada_url: 'https://covers.openlibrary.org/b/id/8224658-L.jpg',
    notas: 'Obra maestra de la literatura latinoamericana.',
    fecha_inicio: '2024-01-10',
  },
  {
    id: '2',
    titulo: 'El nombre del viento',
    autor: 'Patrick Rothfuss',
    genero: 'Fantasía',
    editorial: 'Plaza & Janés',
    paginas_totales: 662,
    pagina_actual: 662,
    estado: 'leído',
    prioridad: 'alta',
    formato: 'ebook',
    portada_url: 'https://covers.openlibrary.org/b/id/8412946-L.jpg',
    notas: 'Increíble construcción del mundo.',
    fecha_inicio: '2023-11-01',
    fecha_fin: '2023-12-15',
  },
  {
    id: '3',
    titulo: 'Sapiens',
    autor: 'Yuval Noah Harari',
    genero: 'Historia',
    editorial: 'Debate',
    paginas_totales: 496,
    pagina_actual: 0,
    estado: 'pendiente',
    prioridad: 'media',
    formato: 'físico',
    portada_url: 'https://covers.openlibrary.org/b/id/8571167-L.jpg',
    notas: 'Recomendado por varios amigos.',
    fecha_inicio: null,
    fecha_fin: null,
  },
  {
    id: '4',
    titulo: 'El principito',
    autor: 'Antoine de Saint-Exupéry',
    genero: 'Ficción',
    editorial: 'Salamandra',
    paginas_totales: 96,
    pagina_actual: 96,
    estado: 'leído',
    prioridad: 'baja',
    formato: 'físico',
    portada_url: 'https://covers.openlibrary.org/b/id/8358782-L.jpg',
    notas: 'Clásico atemporal.',
    fecha_inicio: '2023-09-01',
    fecha_fin: '2023-09-03',
  },
  {
    id: '5',
    titulo: 'Dune',
    autor: 'Frank Herbert',
    genero: 'Ciencia ficción',
    editorial: 'Debolsillo',
    paginas_totales: 896,
    pagina_actual: 200,
    estado: 'leyendo',
    prioridad: 'alta',
    formato: 'ebook',
    portada_url: 'https://covers.openlibrary.org/b/id/9255566-L.jpg',
    notas: 'Worldbuilding extraordinario.',
    fecha_inicio: '2024-02-01',
    fecha_fin: null,
  },
]

export const SAMPLE_SESSIONS = [
  {
    id: 's1',
    libro_id: '1',
    fecha: '2024-02-10',
    pagina_inicio: 80,
    pagina_fin: 120,
    minutos: 45,
    comentario: 'Gran capítulo.',
    paginas_leidas: 40,
  },
  {
    id: 's2',
    libro_id: '5',
    fecha: '2024-02-11',
    pagina_inicio: 150,
    pagina_fin: 200,
    minutos: 60,
    comentario: 'Empezando a entender la política de Arrakis.',
    paginas_leidas: 50,
  },
  {
    id: 's3',
    libro_id: '1',
    fecha: '2024-02-12',
    pagina_inicio: 60,
    pagina_fin: 80,
    minutos: 30,
    comentario: '',
    paginas_leidas: 20,
  },
]
