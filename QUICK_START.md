# LOKAL - Quick Start Guide

> Cómo empezar a usar la nueva arquitectura modular

---

## 🚀 Hola! Esto es lo que cambia

### Antes (caótico)
```javascript
// Todo mezclado en App.jsx
import App from './App';
// 4000+ líneas...
```

### Ahora (ordenado)
```typescript
import { useAuth } from './core/auth.context';
import { useDemandas, useCreateDemanda } from './modules/demandas';
import { isModuleEnabled } from './config/flags';
import { useForm } from './hooks';
```

---

## 📖 Estructura Mental

```
🌍 ROOT (Root.jsx)
  └─ 🔐 AuthProvider (core/auth.context.tsx)
      ├─ Autenticación
      ├─ Identidad única
      └─ Roles dinámicos
         └─ 🧩 APP (App.jsx)
            └─ 🔌 Módulos (demandas, jobs, servicios, etc.)
               ├─ 🎣 Hooks (useDemandas, useCreateDemanda)
               ├─ 🔗 API (demandasAPI.getAll, create, etc.)
               └─ 📋 Types (Demanda, CreateDemandaInput)
               
            └─ 🧰 Helpers (utils/helpers.ts)
               ├─ tiempoRelativo()
               ├─ isStoreOpen()
               ├─ calculateDistance()
               └─ ...
               
            └─ ⚙️ Config
               ├─ Feature Flags (isModuleEnabled)
               ├─ Constants (CATEGORIES, CITIES, etc.)
               └─ ...
```

---

## 🎯 Casos de Uso Comunes

### 1. Mostrar lista de demandas (en Home, Map, etc.)

```typescript
import { useDemandas } from '../modules/demandas';
import { useAuth } from '../core/auth.context';

export function DemandasList() {
  const { currentUser } = useAuth();
  const { demandas, loading, error } = useDemandas({
    city: currentUser?.location?.city,
  });

  if (loading) return <div>Cargando demandas...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {demandas.map(d => (
        <div key={d.id}>
          <h3>{d.title}</h3>
          <p>{d.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. Crear nueva demanda

```typescript
import { useCreateDemanda } from '../modules/demandas';
import { useForm } from '../hooks';
import { useGeolocation } from '../hooks';
import { useAuth } from '../core/auth.context';

export function CreateDemandaForm() {
  const { currentUser } = useAuth();
  const { location } = useGeolocation();
  const { create, isLoading, error } = useCreateDemanda();

  const { values, handleChange, handleSubmit } = useForm({
    initialValues: { title: '', description: '', category: '' },
    onSubmit: async (formData) => {
      const demanda = await create({
        ...formData,
        location: {
          lat: location?.lat || currentUser?.location?.lat || 0,
          lng: location?.lng || currentUser?.location?.lng || 0,
          city: currentUser?.location?.city || 'buenos_aires',
        },
      });

      if (demanda) {
        // Éxito! redireccionar, limpiar form, toast, etc.
      }
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="title"
        value={values.title}
        onChange={handleChange}
        placeholder="¿Qué buscas?"
      />
      <input
        name="description"
        value={values.description}
        onChange={handleChange}
        placeholder="Cuéntanos más..."
      />
      <select name="category" value={values.category} onChange={handleChange}>
        <option value="">Categoría</option>
        {DEMANDA_CATEGORIES.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Publicando...' : 'Publicar demanda'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
```

### 3. Verificar si usuario tiene permiso (capability)

```typescript
import { useCapability, useAuth } from '../core/auth.context';
import { isModuleEnabled } from '../config/flags';

export function JobsSection() {
  const { currentUser } = useAuth();
  const canPublishJobs = useCapability('canPublishJobs');

  // ❌ No tiene permiso
  if (!canPublishJobs) {
    return <div>Solo tiendas verificadas pueden publicar trabajos</div>;
  }

  // ✅ Tiene permiso
  return <PublishJobForm />;
}
```

### 4. Usar feature flags para mostrar/ocultar módulos

```typescript
import { isModuleEnabled } from '../config/flags';
import { useAuth } from '../core/auth.context';

export function MainNavigation() {
  const { currentUser } = useAuth();

  return (
    <nav>
      <a href="/">Inicio</a>

      {/* Demandas siempre visible */}
      <a href="/demandas">Demandas</a>

      {/* Trabajos solo si está habilitado */}
      {isModuleEnabled('oportunidades', { userId: currentUser?.id }) && (
        <a href="/jobs">Trabajos</a>
      )}

      {/* Viajes solo si está habilitado y es en ciudad soportada */}
      {isModuleEnabled('viajes', {
        userCity: currentUser?.location?.city,
        userId: currentUser?.id,
      }) && <a href="/viajes">Viajes</a>}

      {/* Servicios en beta, solo para testers */}
      {isModuleEnabled('servicios', { userId: currentUser?.id }) && (
        <a href="/servicios">Servicios (Beta)</a>
      )}
    </nav>
  );
}
```

### 5. Usar helpers de tiempo y ubicación

```typescript
import {
  tiempoRelativo,
  isStoreOpen,
  calculateDistance,
  formatCurrency,
  formatDistance,
} from '../utils/helpers';

export function StoreCard({ store }) {
  const distanceKm = calculateDistance(
    { lat: -34.6, lng: -58.3 },
    { lat: store.location.lat, lng: store.location.lng }
  );

  return (
    <div>
      <h3>{store.name}</h3>
      <p>
        {isStoreOpen(store.schedules) ? (
          <span style={{ color: 'green' }}>Abierto ahora</span>
        ) : (
          <span style={{ color: 'red' }}>{isStoreOpen(store.schedules)}</span>
        )}
      </p>
      <p>📍 {formatDistance(distanceKm)}</p>
      <p>⭐ {store.reputation.rating}/5 ({store.reputation.reviewCount} reseñas)</p>
    </div>
  );
}
```

### 6. Usar localStorage hooks

```typescript
import { useLocalStorage } from '../hooks';

export function UserPreferences() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [language, setLanguage] = useLocalStorage('language', 'es');
  const [recentSearches, setRecentSearches] = useLocalStorage('recentSearches', []);

  return (
    <div>
      <select value={theme} onChange={e => setTheme(e.target.value)}>
        <option value="light">Claro</option>
        <option value="dark">Oscuro</option>
      </select>

      <select value={language} onChange={e => setLanguage(e.target.value)}>
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>

      <button onClick={() => setRecentSearches([])}>
        Limpiar búsquedas recientes
      </button>
    </div>
  );
}
```

### 7. Usar debounce para búsquedas

```typescript
import { useDebounce } from '../hooks';
import { useDemandas } from '../modules/demandas';

export function SearchDemandas() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedTerm = useDebounce(searchTerm, 300); // 300ms delay

  // Solo hace fetch cuando typing termina
  const { demandas } = useDemandas({
    searchTerm: debouncedTerm,
  });

  return (
    <div>
      <input
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder="Buscar demandas..."
      />
      {demandas.map(d => (
        <div key={d.id}>{d.title}</div>
      ))}
    </div>
  );
}
```

### 8. Usar form hook con validación

```typescript
import { useForm } from '../hooks';

export function ProfileForm({ user }) {
  const { values, errors, touched, handleChange, handleBlur, handleSubmit } =
    useForm({
      initialValues: {
        displayName: user.displayName,
        bio: user.bio || '',
        email: user.email,
      },
      onSubmit: async (data) => {
        // Validar
        if (!data.displayName) {
          // Setear error...
        }
        // Enviar
      },
    });

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="displayName"
        value={values.displayName}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {touched.displayName && errors.displayName && (
        <span style={{ color: 'red' }}>{errors.displayName}</span>
      )}

      <textarea
        name="bio"
        value={values.bio}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={500}
      />

      <button type="submit">Guardar perfil</button>
    </form>
  );
}
```

---

## 📚 Archivos que Necesitas Conocer

### Tipos Centrales
```typescript
import type {
  UserProfile,
  StoreProfile,
  UserCapabilities,
  Demanda,
  JobOpportunity,
  // ...
} from '../types/index';
```

### Auth Context
```typescript
import { useAuth, useCapability, useRole, useMode } from '../core/auth.context';
```

### Módulos
```typescript
// Demandas
import {
  useDemandas,
  useCreateDemanda,
  demandasAPI,
  type Demanda,
} from '../modules/demandas';

// En el futuro:
// import { useJobs, useApplyJob, jobsAPI } from '../modules/oportunidades';
// import { useServices, useServiceAPI } from '../modules/servicios';
```

### Helpers
```typescript
import {
  tiempoRelativo,
  isStoreOpen,
  calculateDistance,
  formatCurrency,
  isValidEmail,
  truncate,
  // ... 30+ funciones
} from '../utils/helpers';
```

### Hooks
```typescript
import {
  useLocalStorage,
  useAsync,
  useFetch,
  useDebounce,
  useThrottle,
  useGeolocation,
  useForm,
  useIntersectionObserver,
  useToggle,
  useMounted,
  useClickOutside,
  useWindowSize,
} from '../hooks';
```

### Config
```typescript
import {
  isModuleEnabled,
  isFlagEnabled,
  FEATURE_FLAGS,
} from '../config/flags';

import {
  DEMANDA_CATEGORIES,
  JOB_CATEGORIES,
  CITIES,
  CURRENCY,
  TIMING,
  LIMITS,
  MESSAGES,
  STORE_QUICK_REPLIES,
  ROUTES,
} from '../config/constants';
```

---

## 🔄 Workflow Típico de Desarrollo

### Agregar nueva funcionalidad:

1. **Importar lo que necesitas**
   ```typescript
   import { useAuth } from '../core/auth.context';
   import { useForm } from '../hooks';
   import { TIMING, MESSAGES } from '../config/constants';
   ```

2. **Usar hooks y helpers**
   ```typescript
   const { values, handleChange, handleSubmit } = useForm({...});
   const { demandas, loading } = useDemandas({...});
   ```

3. **Verificar permisos/módulos**
   ```typescript
   if (!isModuleEnabled('demandas', { userId })) return null;
   if (!useCapability('canCreateDemandas')) return null;
   ```

4. **Renderizar**
   ```typescript
   return (
     <form onSubmit={handleSubmit}>
       {/* componente */}
     </form>
   );
   ```

---

## 🚨 Errores Comunes

### ❌ Importar mal

```typescript
// ❌ INCORRECTO
import { Demanda } from '../modules/demandas.tsx';

// ✅ CORRECTO
import type { Demanda } from '../modules/demandas';
import { useDemandas } from '../modules/demandas';
```

### ❌ Olvidar feature flag

```typescript
// ❌ Mostrar siempre
return <ViajesModule />;

// ✅ Mostrar solo si está habilitado
if (!isModuleEnabled('viajes', { userId })) return null;
return <ViajesModule />;
```

### ❌ No usar useAuth

```typescript
// ❌ Tomar user de prop
function MyComponent({ user }) { ... }

// ✅ Obtener de contexto
function MyComponent() {
  const { currentUser } = useAuth();
  // ...
}
```

### ❌ API calls directas sin hook

```typescript
// ❌ Hacer
fetch(...).then(...);

// ✅ Hacer
const { demandas } = useDemandas();
// o
const { create, isLoading } = useCreateDemanda();
```

---

## 📞 Necesitas Ayuda?

1. **Arquitectura general** → Lee [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Próximos pasos** → Lee [NEXT_STEPS.md](./NEXT_STEPS.md)
3. **Crear módulo nuevo** → Lee ARCHITECTURE.md → "Cómo crear un módulo"
4. **Usar un hook** → Mira [src/hooks/index.ts](./src/hooks/index.ts)
5. **Types disponibles** → Mira [src/types/index.ts](./src/types/index.ts)

---

## ✨ Ahora estás listo!

Empieza a usar la nueva arquitectura. Es segura porque:

1. ✅ App.jsx y StoreApp.jsx **siguen intactos**
2. ✅ Todo es **gradual** - refactor poco a poco
3. ✅ Feature flags te permiten **activar/desactivar** cambios
4. ✅ Tipos TypeScript **evitan errores**
5. ✅ Hooks reutilizables **ahorran tiempo**

¡A buildear! 🚀
