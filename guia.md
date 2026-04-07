markdown# Lokal - Documentación Completa del Proyecto

## 📋 Índice
1. [Visión General](#visión-general)
2. [Arquitectura y Tecnología](#arquitectura-y-tecnología)
3. [Funcionalidades Implementadas](#funcionalidades-implementadas)
4. [Componentes y Pantallas](#componentes-y-pantallas)
5. [Sistema de Diseño](#sistema-de-diseño)
6. [Responsive Design](#responsive-design)
7. [Flujos de Usuario](#flujos-de-usuario)
8. [Roadmap y Próximas Funcionalidades](#roadmap-y-próximas-funcionalidades)

---

## 🎯 Visión General

### ¿Qué es Lokal?

Lokal es una plataforma que conecta usuarios que necesitan productos específicos con tiendas locales que pueden proveerlos, funcionando como un **"Mercado Libre inverso"**.

**Modelo tradicional (Mercado Libre):**
- La tienda publica productos → El usuario busca

**Modelo Lokal:**
- El usuario publica lo que busca (demanda) → Las tiendas responden

### Problema que resuelve

En ciudades medianas o pequeñas:
- ❌ Los usuarios no saben qué tienda tiene productos específicos
- ❌ Terminan comprando online aunque exista cerca
- ❌ Pierden tiempo recorriendo múltiples locales
- ❌ Las tiendas no publican catálogos (engorroso, stock cambiante)

### Solución

✅ Usuario crea una **demanda** con foto y descripción
✅ Las tiendas ven la demanda y **responden si tienen el producto**
✅ Usuario compara respuestas (precio, ubicación, horarios)
✅ Compra local sin recorrer la ciudad

---

## 🏗️ Arquitectura y Tecnología

### Stack Tecnológico
Frontend: React + TailwindCSS
Componentes: Lucide React (iconografía)
Estado: React Hooks (useState)
Responsive: Mobile-first con breakpoints

### Estructura de Datos
```javascript
// Demanda
{
  id: number,
  titulo: string,
  descripcion: string,
  foto: emoji/string,
  respuestas: number,
  estado: 'activa' | 'pendiente',
  tiempoCreado: string
}

// Oferta (catálogo opcional de tiendas)
{
  id: number,
  tienda: string,
  titulo: string,
  descripcion: string,
  precio: number | null,
  foto: emoji/string,
  distancia: string,
  tiempoPublicado: string
}

// Tienda
{
  id: number,
  nombre: string,
  rubro: string,
  distancia: string,
  rating: number,
  foto: emoji/string,
  horario: string
}

// Notificación
{
  id: number,
  tipo: 'respuesta' | 'oferta' | 'sistema',
  mensaje: string,
  tiempo: string,
  leido: boolean
}
```

---

## ✨ Funcionalidades Implementadas

### 🔍 Sistema de Búsqueda
- Búsqueda en tiempo real
- Filtra demandas por título/descripción
- Filtra ofertas por título/descripción
- Se adapta al tab activo (Demandas/Ofertas)
- Estado vacío cuando no hay resultados

### 📱 Navegación Principal

#### Mobile
- Bottom navigation con 3 opciones:
  - Demandas (activo por defecto)
  - Crear (botón central elevado)
  - Tiendas
- Header sticky con logo y acciones

#### Desktop
- Sidebar lateral fijo con:
  - Logo y tagline
  - Botón "Nueva Demanda" destacado
  - Navegación por secciones
  - Notificaciones y Perfil al pie

### 🎨 Sistema de Tabs

**Tabs en Home:**
1. **Mis Demandas**: Búsquedas activas del usuario
2. **Ofertas**: Catálogo opcional de productos que publican tiendas

**Comportamiento:**
- Switch visual con fondo negro en tab activo
- Búsqueda se adapta al tab seleccionado
- Grid responsivo según contenido

### 🔔 Notificaciones

**Funcionalidad:**
- Modal con lista de notificaciones
- 3 tipos: respuesta, oferta, sistema
- Indicador visual de no leídas (punto rojo)
- Estados: leído/no leído (fondo verde si no leído)

**Acceso:**
- Click en ícono de campana (header mobile)
- Click en "Notificaciones" (sidebar desktop)

### 👤 Perfil de Usuario

**Modal con:**
- Avatar y datos de usuario
- Opciones:
  - Mis datos
  - Historial de demandas
  - Preferencias
  - Configuración
  - Cerrar sesión

### 💬 Sistema de Chat

**Características:**
- Modal/widget flotante (desktop: esquina inferior derecha)
- Conversación con tienda específica
- Input para escribir mensajes
- Estado "En línea" de la tienda
- Mensajes del usuario (fondo negro) vs tienda (fondo blanco)

**Activación:**
- Click en "Chatear" desde respuesta de tienda

### 🗺️ Integración con Maps

**Función "Cómo llegar":**
```javascript
window.open(
  `https://www.google.com/maps/search/${encodeURIComponent(nombreTienda)}`,
  '_blank'
)
```

**Disponible en:**
- Detalle de demanda → Botón en cada respuesta
- Lista de tiendas → Botón "Navegar"
- Detalle de tienda → Botón principal

---

## 📄 Componentes y Pantallas

### 1. HomeScreen

**Vista principal con dos modos:**

#### Modo: Mis Demandas

Header con búsqueda
CTA "Nueva Demanda" (mobile)
Tabs: [Demandas] | Ofertas
Grid de cards de demandas
Info card explicativa


#### Modo: Ofertas

Header con búsqueda
Tabs: Demandas | [Ofertas]
Grid de cards de ofertas
Info card explicativa


**Cards de Demanda:**
- Emoji/foto del producto
- Título y descripción
- Tiempo de creación
- Número de respuestas
- Estado (Activa/Nueva)
- Click → DetalleDemandaScreen

**Cards de Oferta:**
- Emoji/foto del producto
- Título, descripción y precio
- Nombre de tienda y distancia
- Botón "Consultar"

### 2. CrearDemandaScreen

**Formulario paso a paso:**

Foto del producto (obligatorio)

Drag & drop / Click para seleccionar
Acepta foto real o de internet


¿Qué estás buscando? (obligatorio)

Input de texto
Ej: "Cable USB-C a HDMI 2 metros"


Descripción detallada (opcional)

Textarea
Características, marca preferida, uso


Presupuesto aproximado (opcional)

Rango: Desde $ - Hasta $


Categorías (opcional)

Pills seleccionables
Múltiple selección
⚠️ Advertencia si selecciona 2+



Botón: "Publicar Demanda"

**Advertencia de Sobre-filtrado:**
Trigger: 2+ categorías seleccionadas
Mensaje: "Cuidado con filtrar demasiado. Muchas
categorías pueden ocultar tiendas que tienen
exactamente lo que buscás."

### 3. DetalleDemandaScreen

**Secciones:**

#### Header de Demanda
- Foto grande del producto
- Título y descripción completa
- Estado y tiempo
- Acciones: Editar | Pausar | Finalizar

#### Lista de Respuestas
Para cada respuesta:

Header: Foto tienda, nombre, distancia, rating
Mensaje de la tienda
Precio ofrecido
Horario actual
Acciones:
[Chatear] [Cómo llegar]


### 4. TiendasScreen

**Funcionalidad:**
- Búsqueda de tiendas
- Grid de cards de tiendas (1 col mobile, 2 col desktop)

**Card de Tienda:**
- Foto/emoji
- Nombre y rubro
- Distancia y rating
- Horario actual con indicador visual
- Acciones: [Ver tienda] [Navegar]
- Click en card → TiendaDetailScreen

### 5. TiendaDetailScreen

**Información completa:**
Hero:

Foto grande
Nombre, rubro
Distancia, rating
Horario con estado (abierto/cerrado)
Botones: [Navegar] [Llamar]

Info Adicional:

Dirección completa
Horarios detallados (Lu-Vi, Sáb)


### 6. Modales

#### NotificationsModal
```html
<Modal>
  <Header>
    Notificaciones
    [X Cerrar]
  </Header>
  <List>
    {notificaciones.map(n => (
      <Item leido={n.leido}>
        • Punto verde si no leído
        Mensaje
        Tiempo
      </Item>
    ))}
  </List>
</Modal>
```

#### ProfileModal
```html
<Modal>
  <Header>
    Avatar grande
    Usuario Demo
    demo@lokal.app
  </Header>
  <Menu>
    Mis datos
    Historial
    Preferencias
    Configuración
    Cerrar sesión (rojo)
  </Menu>
</Modal>
```

#### ChatModal
```html
<Modal/FloatingWidget>
  <Header>
    Tienda: {nombre}
    Estado: En línea
    [X Cerrar]
  </Header>
  <Messages>
    <MessageTienda />
    <MessageUsuario />
  </Messages>
  <Input>
    [Escribí mensaje...] [Enviar]
  </Input>
</Modal>
```

### 7. DesktopSidebar

**Estructura fija (visible solo en desktop):**
┌─────────────────────┐
│ [Logo] Lokal        │
│ Encontrá lo que...  │
│                     │
│ [Nueva Demanda]     │
├─────────────────────┤
│ □ Mis Demandas      │
│ □ Ofertas           │
│ □ Tiendas           │
│                     │
│      (espacio)      │
│                     │
├─────────────────────┤
│ □ Notificaciones    │
│ □ Mi Perfil         │
└─────────────────────┘

**Navegación activa:**
- Fondo negro cuando sección activa
- Texto blanco en activo
- Hover: fondo gris claro

---

## 🎨 Sistema de Diseño

### Paleta de Colores
```css
/* Primarios */
--emerald-500: #10b981  /* Botones principales, CTA */
--emerald-600: #059669  /* Hover en botones */
--teal-600: #0d9488    /* Gradientes */

/* Neutrales */
--slate-50: #f8fafc    /* Fondos claros */
--slate-100: #f1f5f9   /* Fondos de input */
--slate-200: #e2e8f0   /* Bordes */
--slate-600: #475569   /* Texto secundario */
--slate-700: #334155   /* Texto terciario */
--slate-900: #0f172a   /* Texto principal, botones */

/* Acentos */
--amber-400: #fbbf24   /* Punto decorativo logo */
--violet-100: #ede9fe  /* Fondos tiendas */
--purple-100: #f3e8ff  /* Gradientes cards */
--rose-500: #f43f5e    /* Notificaciones */
--emerald-50: #ecfdf5  /* Fondos success */

/* Semánticos */
--green (emerald): Estados activos, horarios
--amber/yellow: Advertencias, ratings
--rose/red: Alertas, notificaciones
```

### Tipografía
```css
/* Tamaños */
text-xs: 0.75rem    /* 12px - Labels, meta info */
text-sm: 0.875rem   /* 14px - Descripciones */
text-base: 1rem     /* 16px - Texto principal */
text-lg: 1.125rem   /* 18px - Títulos secundarios */
text-xl: 1.25rem    /* 20px - Títulos principales */
text-2xl: 1.5rem    /* 24px - Headers */

/* Pesos */
font-medium: 500    /* Subtítulos */
font-semibold: 600  /* Etiquetas, tags */
font-bold: 700      /* Títulos, CTA */
```

### Espaciado
```css
/* Padding */
p-1.5: 0.375rem  /* Pills pequeñas */
p-3: 0.75rem     /* Input, buttons */
p-4: 1rem        /* Cards estándar */
p-5: 1.25rem     /* Cards destacadas */
p-6: 1.5rem      /* Secciones grandes */

/* Gap */
gap-2: 0.5rem    /* Elementos cercanos */
gap-3: 0.75rem   /* Elementos relacionados */
gap-4: 1rem      /* Grupos independientes */

/* Margin */
mb-2: 0.5rem     /* Espaciado mínimo */
mb-4: 1rem       /* Espaciado estándar */
mb-6: 1.5rem     /* Separación de secciones */
```

### Bordes y Sombras
```css
/* Bordes */
border: 1px
border-2: 2px    /* Bordes destacados */
rounded-xl: 0.75rem   /* Botones, inputs */
rounded-2xl: 1rem     /* Cards pequeñas */
rounded-3xl: 1.5rem   /* Cards grandes */

/* Sombras */
shadow-sm: Sutil para cards
shadow-md: Media para botones hover
shadow-lg: Grande para modales
shadow-xl: Extra para elementos flotantes
shadow-2xl: Máxima para sidebar desktop
```

### Componentes Reutilizables

#### Botón Primario
```jsx
<button className="
  w-full 
  bg-slate-900 
  text-white 
  py-4 
  rounded-2xl 
  font-bold 
  hover:bg-slate-800 
  transition-all 
  active:scale-[0.98]
">
  Texto
</button>
```

#### Botón Secundario
```jsx
<button className="
  py-3 
  bg-slate-100 
  text-slate-700 
  rounded-xl 
  font-semibold 
  hover:bg-slate-200
">
  Texto
</button>
```

#### Card Estándar
```jsx
<div className="
  bg-white 
  rounded-3xl 
  border-2 
  border-slate-200 
  p-5 
  hover:shadow-lg 
  transition-all
">
  Contenido
</div>
```

#### Input de Texto
```jsx
<input className="
  w-full 
  px-4 
  py-4 
  border-2 
  border-slate-200 
  rounded-2xl 
  focus:outline-none 
  focus:border-emerald-500
" />
```

#### Tag/Badge
```jsx
<span className="
  px-3 
  py-1.5 
  bg-emerald-50 
  text-emerald-700 
  rounded-xl 
  text-xs 
  font-bold 
  border 
  border-emerald-200
">
  ACTIVA
</span>
```

---

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First */
Base: 0px - 1023px (mobile)
lg: 1024px+        (desktop)
xl: 1280px+        (desktop large)
```

### Layouts por Pantalla

#### Mobile (< 1024px)
┌─────────────────────┐
│  Header Sticky      │
│  [Logo] [🔔] [👤]  │
│  [Búsqueda]         │
│  [Tab1] [Tab2]      │
├─────────────────────┤
│                     │
│  [CTA Grande]       │
│                     │
│  Content            │
│  (1 columna)        │
│                     │
│                     │
├─────────────────────┤
│  Bottom Nav         │
│  [📦] [📷] [🏪]    │
└─────────────────────┘

#### Desktop (>= 1024px)
┌───────────┬─────────────────────────────┐
│           │  Header Sticky              │
│  Sidebar  │  Título + Búsqueda          │
│  Fijo     ├─────────────────────────────┤
│           │                             │
│  [Logo]   │  Content Area               │
│  [CTA]    │  (Grid 2-3 columnas)        │
│           │                             │
│  Nav:     │  [Card] [Card] [Card]       │
│  □ Item1  │  [Card] [Card] [Card]       │
│  □ Item2  │                             │
│  □ Item3  │                             │
│           │                             │
│  [🔔]     │                             │
│  [👤]     │                             │
└───────────┴─────────────────────────────┘

### Clases Responsive Clave
```jsx
// Ocultar en mobile, mostrar en desktop
className="hidden lg:block"

// Mostrar en mobile, ocultar en desktop
className="lg:hidden"

// Sidebar responsive
className="hidden lg:flex lg:flex-col w-72"

// Grid responsive
className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"

// Padding responsive
className="px-5 lg:px-8"

// Width responsive
className="max-w-md lg:max-w-7xl mx-auto"
```

### Adaptaciones Específicas

#### Chat Modal
- **Mobile**: Fullscreen
- **Desktop**: Widget flotante (384px × 600px, esquina inferior derecha)
```jsx
className="
  fixed inset-0 
  lg:inset-auto 
  lg:right-8 
  lg:bottom-8 
  lg:w-96 
  lg:h-[600px]
  lg:rounded-3xl
"
```

#### Header
- **Mobile**: Compacto con logo pequeño
- **Desktop**: No se muestra (sidebar lo reemplaza)
```jsx
<div className="lg:hidden">
  {/* Header Mobile */}
</div>
```

---

## 🔄 Flujos de Usuario

### 1. Crear una Demanda
```mermaid
Usuario → Click "Nueva Demanda"
       → Completa formulario
       → Sube foto
       → Escribe título
       → Describe producto
       → (Opcional) Selecciona categorías
       → ⚠️ Si 2+ categorías → Advertencia
       → Click "Publicar"
       → Demanda creada
       → Vuelve a Home
       → Demanda aparece en lista
```

### 2. Ver y Responder a una Demanda (Usuario)
```mermaid
Usuario → Ve lista de demandas en Home
       → Click en una demanda
       → Ve detalle completo
       → Lee respuestas de tiendas
       → Compara precios/distancias
       → Opciones:
          a) Click "Chatear" → Abre chat
          b) Click "Navegar" → Abre Maps
          c) Click "Finalizar" → Cierra demanda
```

### 3. Explorar Ofertas
```mermaid
Usuario → Click tab "Ofertas"
       → Ve grid de ofertas
       → Busca productos específicos
       → Click "Consultar" en oferta
       → (Futuro: chat con tienda)
```

### 4. Buscar Tiendas
```mermaid
Usuario → Click "Tiendas" (nav)
       → Ve lista de tiendas cercanas
       → Busca tienda específica
       → Click en tienda
       → Ve detalle completo
       → Opciones:
          a) Click "Navegar" → Maps
          b) Click "Llamar" → Teléfono
```

### 5. Gestionar Notificaciones
```mermaid
Usuario → Ve indicador rojo (🔔)
       → Click en campana
       → Modal con notificaciones
       → Lee notificaciones
          - Nueva respuesta a demanda
          - Nueva oferta cercana
          - Sistema: demanda vista
       → Click en notificación
       → (Futuro: navega a contexto)
```

---

## 🚀 Roadmap y Próximas Funcionalidades

### Fase 1: MVP Actual ✅

- [x] Sistema de demandas
- [x] Sistema de ofertas
- [x] Lista de tiendas
- [x] Búsqueda funcional
- [x] Notificaciones básicas
- [x] Perfil de usuario
- [x] Chat UI
- [x] Integración Google Maps
- [x] Responsive completo
- [x] Advertencia sobre-filtrado

### Fase 2: Backend e Integración 🔄

#### Base de Datos
- [ ] Cloudflare D1 / R2
- [ ] Modelos de datos
- [ ] API REST con Node.js + Express
- [ ] Autenticación JWT
- [ ] Sistema de tokens para tiendas

#### Funcionalidades Backend
- [ ] CRUD de demandas
- [ ] CRUD de ofertas
- [ ] Sistema de respuestas
- [ ] Chat en tiempo real (WebSockets)
- [ ] Notificaciones push (Firebase)
- [ ] Geolocalización
- [ ] Upload de imágenes (Cloudinary)

### Fase 3: Panel de Tienda 📦

#### Funcionalidades para Tiendas
- [ ] Registro con token temporal
- [ ] Dashboard de tienda
- [ ] Ver demandas relevantes (3 niveles)
- [ ] Responder demandas
- [ ] Publicar ofertas (opcional)
- [ ] Gestionar catálogo de rubros
- [ ] Estadísticas:
  - Demandas respondidas
  - Tasa de conversión
  - Vistas de perfil
- [ ] Configurar perfil:
  - Fotos del local
  - Horarios
  - Ubicación
  - Rubros
- [ ] Sistema de mensajería

### Fase 4: Panel de Admin ⚙️

#### Funcionalidades de Administrador
- [ ] Dashboard general
- [ ] Crear tiendas con tokens
- [ ] Validar pagos
- [ ] Suspender/eliminar tiendas
- [ ] Moderar demandas
- [ ] Contactar creadores de demandas
- [ ] Bloquear usuarios/tiendas
- [ ] Sistema de tickets
- [ ] Estadísticas globales:
  - Tiendas activas
  - Usuarios registrados
  - Demandas totales
  - Tasa de respuesta

### Fase 5: Mejoras UX 🎨

#### Experiencia de Usuario
- [ ] Sistema de reputación
  - Rating de tiendas
  - Reviews de usuarios
  - Verificación de compras
- [ ] Filtros avanzados
  - Por precio
  - Por distancia
  - Por rating
  - Por horario
- [ ] Favoritos
  - Guardar tiendas
  - Guardar búsquedas
- [ ] Historial
  - Demandas finalizadas
  - Compras realizadas
- [ ] Onboarding
  - Tutorial inicial
  - Tips contextuales

### Fase 6: Features Avanzadas 🚀

#### IA y Automatización
- [ ] Sugerencia de rubros por foto (IA)
- [ ] Autocompletado inteligente
- [ ] Recomendaciones personalizadas
- [ ] Detección de productos duplicados

#### Comunicación
- [ ] Notificaciones push nativas
- [ ] Emails transaccionales
- [ ] SMS para tiendas

#### Monetización
- [ ] Sistema de suscripciones para tiendas
- [ ] Planes: Básico, Pro, Premium
- [ ] Pagos con Mercado Pago
- [ ] Destacados en búsquedas

### Fase 7: App Nativa 📱

#### Mobile Apps
- [ ] App iOS (React Native)
- [ ] App Android (React Native)
- [ ] Notificaciones push nativas
- [ ] Geolocalización precisa
- [ ] Cámara integrada
- [ ] Deep links

### Fase 8: Expansión 🌎

#### Nuevas Funcionalidades
- [ ] Sistema de cupones/descuentos
- [ ] Programa de referidos
- [ ] Marketplace completo
- [ ] Entregas a domicilio
- [ ] Reservas de productos
- [ ] Click & Collect

#### Multi-región
- [ ] Soporte multi-ciudad
- [ ] Soporte multi-país
- [ ] Multi-idioma
- [ ] Multi-moneda

---

## 📊 Métricas y KPIs

### Para Usuarios
- Tiempo promedio para encontrar producto
- % de demandas con al menos 1 respuesta
- % de demandas finalizadas exitosamente
- Distancia promedio a tiendas elegidas

### Para Tiendas
- Demandas recibidas
- Tasa de respuesta
- Conversión (respuestas → ventas)
- Rating promedio
- Tiempo de respuesta promedio

### Para la Plataforma
- Usuarios activos (DAU, MAU)
- Tiendas activas
- Demandas creadas por día
- Respuestas por demanda (promedio)
- Retención de usuarios
- Retención de tiendas

---

## 🔐 Seguridad y Privacidad

### Datos del Usuario
- No se comparte ubicación exacta
- Solo distancia aproximada a tiendas
- Chat interno sin compartir teléfonos
- Email/teléfono solo para registro

### Datos de Tiendas
- Verificación de identidad
- Validación de dirección física
- Moderación de contenido
- Sistema de reportes

### Contenido
- Moderación de fotos
- Detección de spam
- Bloqueo de contenido ilegal
- Verificación de demandas

---

## 🛠️ Guía de Desarrollo

### Setup Local
```bash
# Instalar dependencias
npm install react lucide-react

# Iniciar desarrollo
npm run dev

# Build para producción
npm run build
```

### Estructura de Archivos (Futura)
lokal/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DesktopSidebar.jsx
│   │   │   ├── MobileHeader.jsx
│   │   │   └── BottomNav.jsx
│   │   ├── modals/
│   │   │   ├── NotificationsModal.jsx
│   │   │   ├── ProfileModal.jsx
│   │   │   └── ChatModal.jsx
│   │   ├── cards/
│   │   │   ├── DemandaCard.jsx
│   │   │   ├── OfertaCard.jsx
│   │   │   └── TiendaCard.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       └── Badge.jsx
│   ├── screens/
│   │   ├── HomeScreen.jsx
│   │   ├── CrearDemandaScreen.jsx
│   │   ├── DetalleDemandaScreen.jsx
│   │   ├── TiendasScreen.jsx
│   │   └── TiendaDetailScreen.jsx
│   ├── hooks/
│   │   ├── useSearch.js
│   │   ├── useNotifications.js
│   │   └── useGeolocation.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   └── api.js
│   ├── styles/
│   │   └── globals.css
│   └── App.jsx
├── public/
├── package.json
└── README.md

### Convenciones de Código
```javascript
// Nombres de componentes: PascalCase
const HomeScreen = () => {}

// Nombres de funciones: camelCase
const handleClick = () => {}

// Constantes: UPPER_CASE
const MAX_RESULTS = 10

// Props destructuradas
const Card = ({ title, description }) => {}

// Estado siempre con nombres descriptivos
const [searchQuery, setSearchQuery] = useState('')
const [isLoading, setIsLoading] = useState(false)
```

---

## 📝 Notas de Implementación

### Decisiones de Diseño

1. **Sin catálogo obligatorio para tiendas**
   - Las tiendas responden demandas sin publicar inventario
   - Opcionalmente pueden publicar ofertas
   - Reduce fricción de onboarding

2. **Sistema de advertencia de filtros**
   - Aparece con 2+ categorías
   - Educa al usuario sobre el sistema
   - Previene búsquedas demasiado restrictivas

3. **Tabs en Home**
   - Demandas: foco principal (usuario activo)
   - Ofertas: exploración (usuario pasivo)
   - Permite dos flujos de descubrimiento

4. **Responsive mobile-first**
   - Mayor uso esperado en móvil
   - Desktop como complemento
   - No sacrifica funcionalidad

### Optimizaciones Futuras

- [ ] Lazy loading de imágenes
- [ ] Infinite scroll en listas
- [ ] Caché de búsquedas
- [ ] PWA para instalación
- [ ] Service Workers para offline
- [ ] Optimistic UI updates
- [ ] Skeleton loaders
- [ ] Imágenes WebP

---

## 🤝 Contribución

### Git Workflow (Futuro)
```bash
# Feature branches
git checkout -b feature/nombre-feature

# Commits semánticos
git commit -m "feat: agregar búsqueda en tiempo real"
git commit -m "fix: corregir layout en mobile"
git commit -m "docs: actualizar README"

# Pull requests
- Descripción clara del cambio
- Screenshots si es UI
- Tests pasando
```

### Tipos de Commits
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Cambios de estilo
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Tareas de mantenimiento

---

## 📞 Contacto y Soporte

### Canales (Futuros)
- Email: soporte@lokal.app
- Discord: comunidad Lokal
- Twitter: @lokalapp
- GitHub Issues: reportar bugs

---

## 📄 Licencia

Pendiente de definición

---

## 🎉 Conclusión

Lokal es una plataforma completa y funcional que revoluciona la forma en que las personas encuentran productos locales. Con un diseño moderno, responsive y una UX cuidada, está lista para escalar y crecer.

**Estado actual:** MVP funcional con todas las pantallas principales implementadas
**Próximo paso:** Implementación de backend y autenticación

---

*Última actualización: Abril 2026*
*Versión: 1.0.0 (MVP)*