// ============================================================
// components/BookForm.jsx — Formulario para agregar / editar libro
// ============================================================
import { useState, useEffect } from 'react'
import { genId } from '../utils/calculations'

const ESTADOS    = ['pendiente', 'leyendo', 'leído']
const PRIORIDADES = ['alta', 'media', 'baja']
const FORMATOS   = ['físico', 'ebook', 'audiolibro']
const GENEROS    = [
  'Ficción', 'No ficción', 'Ciencia ficción', 'Fantasía', 'Realismo mágico',
  'Misterio', 'Thriller', 'Romance', 'Historia', 'Biografía', 'Autoayuda',
  'Filosofía', 'Ciencia', 'Ensayo', 'Poesía', 'Otro',
]

const EMPTY = {
  titulo: '', autor: '', genero: 'Ficción', editorial: '',
  paginas_totales: '', pagina_actual: '0',
  estado: 'pendiente', prioridad: 'media', formato: 'físico',
  portada_url: '', notas: '', fecha_inicio: '', fecha_fin: '',
}

export default function BookForm({ book, onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  // Cargar datos si se edita
  useEffect(() => {
    if (book) {
      setForm({
        ...EMPTY,
        ...book,
        paginas_totales: book.paginas_totales?.toString() || '',
        pagina_actual:   book.pagina_actual?.toString()   || '0',
      })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
  }, [book])

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  const validate = () => {
    const errs = {}
    if (!form.titulo.trim())       errs.titulo = 'El título es obligatorio.'
    if (!form.autor.trim())        errs.autor  = 'El autor es obligatorio.'
    const tot = parseInt(form.paginas_totales)
    if (!form.paginas_totales || isNaN(tot) || tot < 1)
      errs.paginas_totales = 'Ingresá un número mayor a 0.'
    const act = parseInt(form.pagina_actual)
    if (isNaN(act) || act < 0)    errs.pagina_actual = 'Debe ser 0 o mayor.'
    if (act > tot)                 errs.pagina_actual = 'No puede superar el total de páginas.'
    return errs
  }

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const saved = {
      ...form,
      id: book?.id || genId(),
      paginas_totales: parseInt(form.paginas_totales),
      pagina_actual:   parseInt(form.pagina_actual),
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin:    form.fecha_fin    || null,
    }
    onSave(saved)
  }

  const field = (label, key, type = 'text', extra = {}) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className={`form-control${errors[key] ? ' error' : ''}`}
        type={type}
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        style={errors[key] ? { borderColor: 'var(--red)' } : {}}
        {...extra}
      />
      {errors[key] && <span style={{ color: 'var(--red)', fontSize: '0.78rem' }}>{errors[key]}</span>}
    </div>
  )

  const select = (label, key, options) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select className="form-control" value={form[key]} onChange={e => set(key, e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
      </select>
    </div>
  )

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{book ? 'Editar libro' : 'Agregar libro'}</h3>
          <button className="btn btn-outline btn-icon" onClick={onCancel}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <div className="col-span-2">{field('Título *', 'titulo', 'text', { placeholder: 'Ej: El nombre del viento' })}</div>
            {field('Autor *', 'autor', 'text', { placeholder: 'Ej: Patrick Rothfuss' })}
            {field('Editorial', 'editorial', 'text', { placeholder: 'Ej: Plaza & Janés' })}
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Género</label>
              <select className="form-control" value={form.genero} onChange={e => set('genero', e.target.value)}>
                {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            {field('Páginas totales *', 'paginas_totales', 'number', { min: 1, placeholder: '0' })}
            {field('Página actual', 'pagina_actual', 'number', { min: 0, placeholder: '0' })}
          </div>

          <div className="form-grid-3">
            {select('Estado', 'estado', ESTADOS)}
            {select('Prioridad', 'prioridad', PRIORIDADES)}
            {select('Formato', 'formato', FORMATOS)}
          </div>

          <div className="form-grid">
            {field('Fecha de inicio', 'fecha_inicio', 'date')}
            {field('Fecha de fin', 'fecha_fin', 'date')}
          </div>

          <div className="form-group">
            <label className="form-label">URL de portada</label>
            <input
              className="form-control"
              type="url"
              value={form.portada_url}
              onChange={e => set('portada_url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          {form.portada_url && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={form.portada_url}
                alt="portada"
                style={{ height: 100, borderRadius: 6, objectFit: 'cover' }}
                onError={e => e.target.style.display = 'none'}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Notas</label>
            <textarea
              className="form-control"
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
              placeholder="Comentarios, recomendaciones, recordatorios..."
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {book ? '💾 Guardar cambios' : '➕ Agregar libro'}
          </button>
        </div>
      </div>
    </div>
  )
}
