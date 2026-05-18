# 📚 WebLibros

Gestión de colección de libros, progreso de lectura y cronogramas automáticos.

## Tecnologías

- React 18 + Vite
- JavaScript
- CSS personalizado (sin dependencias de UI externas)
- localStorage para persistencia

## Funcionalidades

- **Dashboard**: estadísticas generales, libros en curso, últimas sesiones
- **Biblioteca**: agregar / editar / eliminar libros, filtros, barra de progreso
- **Registro diario**: registrar sesiones, calcular páginas leídas, historial
- **Plan de lectura**: cronograma día a día con días de descanso configurables
- **Estadísticas**: racha, promedios, libro más avanzado, sesiones por libro

---

## ▶️ Ejecutar localmente

### 1. Instalá las dependencias

```bash
npm install
```

### 2. Iniciá el servidor de desarrollo

```bash
npm run dev
```

Abrí tu navegador en **http://localhost:5173**

---

## 🏗️ Build de producción

```bash
npm run build
```

Los archivos quedan en la carpeta `dist/`.

---

## 🚀 Despliegue en GitHub Pages

### Paso 1 — Configurar base en vite.config.js

Editá `vite.config.js` y cambiá `base` por el nombre de tu repositorio:

```js
export default defineConfig({
  plugins: [react()],
  base: '/nombre-de-tu-repo/',
})
```

### Paso 2 — Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/nombre-de-tu-repo.git
git push -u origin main
```

### Paso 3 — Instalar gh-pages

```bash
npm install --save-dev gh-pages
```

### Paso 4 — Agregar script en package.json

```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

### Paso 5 — Desplegar

```bash
npm run deploy
```

En tu repo de GitHub → Settings → Pages → seleccioná la rama `gh-pages`.

---

## 🚀 Despliegue en Vercel (más fácil)

### Opción A — Desde la web

1. Subí el proyecto a GitHub.
2. Entrá a [vercel.com](https://vercel.com) y conectá tu cuenta de GitHub.
3. Importá el repositorio.
4. Vercel detecta Vite automáticamente. Hacé clic en **Deploy**.

### Opción B — CLI

```bash
npm install -g vercel
vercel
```

Seguí las instrucciones en terminal. En la próxima actualización:

```bash
vercel --prod
```

> **Nota**: Para Vercel no necesitás cambiar el `base` en vite.config.js.

---

## 📁 Estructura del proyecto

```
weblibros/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles.css
    ├── components/
    │   ├── Dashboard.jsx
    │   ├── BookForm.jsx
    │   ├── BookList.jsx
    │   ├── ReadingLog.jsx
    │   ├── ReadingPlan.jsx
    │   └── Stats.jsx
    └── utils/
        ├── storage.js
        └── calculations.js
```
