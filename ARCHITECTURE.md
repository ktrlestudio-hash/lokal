## LOKAL - Arquitectura Modular

> Un sistema operativo local. Un ecosistema modular para conectar necesidades, oportunidades, personas, comercios y movimiento económico/social dentro de una ciudad.

---

## 📁 Estructura del Proyecto

```
src/
├── core/                      # ⭐ Core: Identidad única, autenticación, roles
│   ├── auth.context.tsx       # Contexto de autenticación e identidad
│   └── ...
│
├── modules/                   # 🔌 Módulos: Funcionalidades independientes
│   ├── demandas/              # Ej: Demandas (necesidades/búsquedas)
│   │   ├── types.ts          # Tipos TypeScript del módulo
│   │   ├── api.ts            # Funciones de API
│   │   ├── hooks.ts          # Custom hooks del módulo
│   │   └── index.ts          # Exportaciones
│   ├── oportunidades/         # (próximo módulo)
│   ├── servicios/
│   ├── viajes/
│   └── productos/
│
├── components/                # 🧩 Componentes reutilizables
│   ├── ui/                   # Átomos: Button, Input, etc.
│   ├── cards/                # Cards de contenido
│   └── layout/               # Layout: Header, Footer, Nav
│
├── styles/                    # 🎨 Sistema de diseño CSS modular
│   ├── tokens.css            # Variables CSS
│   ├── base.css              # Reset + base
│   ├── components.css        # Clases reutilizables
│   └── animations.css        # Animaciones
│
├── config/                    # ⚙️ Configuración global
│   ├── flags.ts              # Feature flags
│   └── constants.ts          # Constantes
│
├── hooks/                     # 🎣 Hooks personalizados reutilizables
│   └── index.ts              # useLocalStorage, useAsync, etc.
│
├── utils/                     # 🛠️ Utilidades (funciones puras)
│   └── helpers.ts            # Helpers: tiempo, ubicación, strings, etc.
│
├── types/                     # 📋 Tipos centrales de la app
│   └── index.ts              # UserProfile, StoreProfile, etc.
│
└── root/                      # 🌍 Archivos raíz (por refactorizar)
    ├── Root.jsx              # Shell de la app + Firebase auth
    ├── App.jsx               # Vista de usuario
    ├── StoreApp.jsx          # Vista de tienda
    └── ...
```

---

## 🏛️ Arquitectura Conceptual

### LOKAL Core

El **core** centraliza:

- **Autenticación**: Firebase OAuth
- **Identidad única**: `UserProfile` (una persona, múltiples capacidades)
- **Roles dinámicos**: NO múltiples cuentas. Una identidad con roles:
  - `user`: Usuario que busca
  - `entrepreneur`: Emprendedor con tienda
  - `verified_store`: Tienda verificada
  - `admin`: Administrador

- **Capabilidades**: Permisos dinámicos según rol
  - `canCreateDemandas`
  - `canPublishJobs`
  - `canAccessStats`
  - etc.

### Módulos

Cada módulo es **independiente pero conectado al core**:

```
Módulo Demandas
├── types.ts         → Interfaces específicas
├── api.ts           → Llamadas al API
├── hooks.ts         → Custom hooks (useDemandas, useCreateDemanda)
└── (pronto) components/  → UI del módulo
```

**Principio**: Cada módulo puede habilitarse/deshabilitarse vía feature flags.

### Feature Flags

Control granular de funcionalidades:

```typescript
// src/config/flags.ts
isFlagEnabled('module.demandas', {
  userCity: 'buenos_aires',
  userRole: 'user',
  userId: 'user-123',
})
```

Permite:
- Activar/desactivar módulos
- Beta features
- A/B testing
- Limitaciones por ciudad/rol

---

## 🎯 Filosofía de Implementación

### ✅ Reutiliza lo que funciona

Los archivos existentes (`App.jsx`, `StoreApp.jsx`, etc.) **no se tocan** hasta que sea necesario refactorizar. Trabajan como están.

### ✅ Agrega sin romper

Nuevas funcionalidades van en módulos nuevos. Si el módulo necesita existentes, **extrae sin modificar**.

### ✅ Modularidad progresiva

1. Crear tipos (TypeScript)
2. Crear API functions
3. Crear custom hooks
4. Crear componentes reutilizables
5. Exportar todo via `index.ts`

### ✅ Una identidad, múltiples capacidades

```typescript
// ❌ NO hacer
const userAccount = { ... }
const storeAccount = { ... }
const cvAccount = { ... }

// ✅ SÍ hacer
const user = {
  id: 'user-123',
  email: '...',
  roles: ['user', 'entrepreneur', 'verified_store'],
  capabilities: {
    canCreateDemandas: true,
    canPublishJobs: true,
    canAccessStats: true,
    ...
  }
}
```

---

## 🚀 Cómo Crear un Módulo Nuevo

### Paso 1: Crear estructura

```bash
src/modules/[nombre-modulo]/
├── types.ts
├── api.ts
├── hooks.ts
└── index.ts
```

### Paso 2: Definir tipos

```typescript
// src/modules/[nombre-modulo]/types.ts

export interface MiEntidad {
  id: string;
  userId: string;
  title: string;
  // ...
}

export interface CreateMiEntidadInput {
  title: string;
  // ...
}
```

### Paso 3: API functions

```typescript
// src/modules/[nombre-modulo]/api.ts

import { API_BASE } from '../../config/flags';

export const miModuloAPI = {
  async getAll() { /* ... */ },
  async getById(id: string) { /* ... */ },
  async create(data: CreateMiEntidadInput) { /* ... */ },
  async update(id: string, data: Partial<MiEntidad>) { /* ... */ },
  async delete(id: string) { /* ... */ },
};
```

### Paso 4: Custom hooks

```typescript
// src/modules/[nombre-modulo]/hooks.ts

import { useAsync } from '../../hooks/index';

export function useMiEntidades() {
  const { data, status, error, execute } = useAsync(
    () => miModuloAPI.getAll(),
    true
  );
  return {
    entities: (data as MiEntidad[]) || [],
    loading: status === 'pending',
    error: error?.message || null,
    refetch: execute,
  };
}

// Más hooks...
```

### Paso 5: Exportar

```typescript
// src/modules/[nombre-modulo]/index.ts

export type { MiEntidad, CreateMiEntidadInput } from './types';
export { miModuloAPI } from './api';
export { useMiEntidades, useCreateMiEntidad, ... } from './hooks';
```

### Paso 6: Registrar en módulos index

```typescript
// src/modules/index.ts

export * from './demandas/index';
export * from './[nombre-modulo]/index';  // ← Agregar aquí
```

### Paso 7: Agregar feature flag

```typescript
// src/config/flags.ts

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // ...
  MI_MODULO: {
    key: 'module.mi-modulo',
    name: 'Mi Módulo',
    enabled: true,
    beta: false,
  },
};
```

---

## 🔌 Cómo Usar un Módulo

### Desde un componente

```typescript
import { useDemandas, useCreateDemanda } from '../modules';
import { useAuth } from '../core/auth.context';
import { isModuleEnabled } from '../config/flags';

export function MiComponente() {
  const { currentUser } = useAuth();
  
  // Verificar si módulo está habilitado
  if (!isModuleEnabled('demandas', { userId: currentUser?.id })) {
    return <div>Módulo no disponible</div>;
  }

  // Usar hook del módulo
  const { demandas, loading } = useDemandas({
    city: currentUser?.location?.city,
  });

  return (
    <div>
      {loading ? 'Cargando...' : demandas.map(d => (...))}
    </div>
  );
}
```

---

## 🎨 Utilidades y Helpers

### Helpers (funciones puras)

```typescript
import {
  tiempoRelativo,
  isStoreOpen,
  calculateDistance,
  formatCurrency,
  isValidEmail,
  truncate,
} from '../utils/helpers';

tiempoRelativo('2024-05-15T10:30:00Z'); // "Hace 2h"
calculateDistance({ lat: -34.6, lng: -58.3 }, {...}); // 2.5 km
```

### Custom Hooks

```typescript
import {
  useLocalStorage,
  useAsync,
  useDebounce,
  useGeolocation,
  useForm,
} from '../hooks';

const [user, setUser] = useLocalStorage('user', null);
const { location } = useGeolocation();
const { values, handleChange, handleSubmit } = useForm({...});
```

### Config y Constantes

```typescript
import {
  DEMANDA_CATEGORIES,
  CITIES,
  TIMING,
  MESSAGES,
  ROUTES,
} from '../config/constants';

import { isFlagEnabled, isModuleEnabled } from '../config/flags';
```

---

## 📋 Flujo de Datos

```
App (Root.jsx)
  ↓
AuthProvider (core/auth.context.tsx)
  ├─ User Identity
  ├─ Capabilities
  └─ Mode (user | store)
    ↓
  Componentes
    ├─ useAuth() → Obtener identidad
    ├─ useCapability() → Verificar permisos
    ├─ useRole() → Verificar rol
    ├─ useDemandas() → Datos del módulo
    ├─ useLocalStorage() → Persistencia
    └─ useGeolocation() → Ubicación
      ↓
    API Calls
      ↓
    Backend (/.netlify/functions)
```

---

## 🧪 Ejemplo Completo: Crear Demanda

### 1. Componente que crea demanda

```typescript
import { useCreateDemanda } from '../modules/demandas';
import { useAuth } from '../core/auth.context';
import { useGeolocation } from '../hooks';
import { useForm } from '../hooks';

export function CreateDemandaForm() {
  const { currentUser } = useAuth();
  const { location } = useGeolocation();
  const { create, isLoading, error } = useCreateDemanda();

  const { values, handleChange, handleSubmit } = useForm({
    initialValues: {
      title: '',
      description: '',
      category: '',
    },
    onSubmit: async (data) => {
      const demanda = await create({
        ...data,
        location: {
          lat: location?.lat || 0,
          lng: location?.lng || 0,
          city: currentUser?.location?.city || 'buenos_aires',
        },
      });

      if (demanda) {
        // Success: redirigir, mostrar toast, etc.
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
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creando...' : 'Publicar'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

### 2. Hook `useCreateDemanda` reutilizable

```typescript
// src/modules/demandas/hooks.ts

export function useCreateDemanda() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await demandasAPI.create(data);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}
```

### 3. API function

```typescript
// src/modules/demandas/api.ts

export const demandasAPI = {
  async create(data: CreateDemandaInput): Promise<Demanda> {
    const response = await fetch(`${API_BASE}/demandas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Error al crear demanda');
    return response.json();
  },
};
```

---

## 🔄 Refactor Gradual

### Fase 1 (HOY ✅)
- [x] Estructura de carpetas
- [x] Types centrales
- [x] Feature flags
- [x] Helpers y utilidades
- [x] Custom hooks
- [x] Auth context con roles dinámicos
- [x] Primer módulo (demandas) como ejemplo

### Fase 2 (Próxima)
- [ ] Crear módulos: oportunidades, servicios, viajes, productos
- [ ] Refactorizar App.jsx para usar Auth context
- [ ] Crear componentes reutilizables (UI atoms)
- [ ] Modularizar CSS

### Fase 3 (Futuro)
- [ ] Migrar App.jsx a TypeScript
- [ ] Separar App en pantallas modulares
- [ ] Integrar módulos en Root.jsx
- [ ] Agregar más feature flags por ciudad

---

## 📚 Referencias Internas

- **Feature Flags**: `src/config/flags.ts`
- **Constantes**: `src/config/constants.ts`
- **Tipos centrales**: `src/types/index.ts`
- **Auth Context**: `src/core/auth.context.tsx`
- **Helpers**: `src/utils/helpers.ts`
- **Hooks**: `src/hooks/index.ts`
- **Módulo Demandas**: `src/modules/demandas/`

---

## 🎯 Principios

1. **Modularidad**: Cada módulo es independiente
2. **Reutilización**: Helpers, hooks, componentes compartidos
3. **Una identidad**: No múltiples cuentas, un usuario con roles
4. **Feature flags**: Control granular de qué se muestra
5. **Type safety**: TypeScript en todo lo nuevo
6. **Sin romper**: Lo existente funciona mientras lo refactorizamos

---

¡Listo para escalar! 🚀
