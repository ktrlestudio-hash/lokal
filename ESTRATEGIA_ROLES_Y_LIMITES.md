# LOKAL — Estrategia de Roles, Límites y Monetización

> Documento vivo. Actualizar cuando cambien decisiones de producto.

---

## Filosofía central

**No cobrar en el registro. Dejar entrar, generar valor, cobrar en el límite.**

El usuario ya invertido (perfil armado, productos cargados, contactos) tiene
muchísimo más incentivo a pagar que uno que acaba de llegar.
Cada límite es una oportunidad de conversión, no una barrera de entrada.

---

## Jerarquía de roles

```
Usuario
  └─ Usuario Premium (opcional, pago por extras puntuales)
       └─ Emprendimiento (gratis, upgrade de usuario)
            └─ Empresa free (gratis, con límites duros)
                 └─ Empresa pago (suscripción mensual/anual)
```

Una sola identidad (cuenta Google). Los roles son **capacidades habilitadas**,
no cuentas separadas. Subir de rol nunca borra datos anteriores.

---

## Tabla de capacidades por rol

| Capacidad | Usuario | Usuario Premium | Emprendimiento | Empresa free | Empresa pago |
|-----------|:-------:|:---------------:|:--------------:|:------------:|:------------:|
| Publicar demandas | ✅ ∞ | ✅ ∞ | ✅ ∞ | ✅ ∞ | ✅ ∞ |
| Productos **usados** | ✅ 3 | ✅ 10 | ✅ 10 | ✅ ∞ | ✅ ∞ |
| Productos **nuevos** | ❌ nudge | ✅ 5 | ✅ 5 | ✅ 3 | ✅ ∞ |
| Búsquedas laborales | ❌ | ❌ | ✅ 1 activa | ✅ 3 activas | ✅ ∞ |
| Feed de demandas de usuarios | ❌ | ❌ | ✅ limitado | ✅ completo | ✅ completo |
| CV / perfil laboral | ✅ | ✅ | ✅ | ✅ | ✅ |
| Aparece en mapa | como CV/persona | como CV/persona | como negocio | como negocio | destacado |
| Ver CVs en Oportunidades | ✅ vista básica | ✅ vista básica | ✅ vista básica | ✅ vista básica | ✅ vista completa |
| Contactar candidatos (chat) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Marcar candidato como interesado | ❌ | ❌ | ❌ | ✅ | ✅ |
| Página propia `/t/slug` | ❌ | ❌ | ❌ | ✅ | ✅ |
| Estadísticas | ❌ | ❌ | ❌ | ❌ | ✅ |
| Badge verificada | ❌ | ❌ | ❌ | ❌ | ✅ |
| Local físico en mapa | ❌ | ❌ | ❌ | ✅ toggle | ✅ destacado |

---

## Sistema de CV (rama del Usuario)

El CV no es un perfil separado — es una extensión del perfil de usuario.

**Cualquier rol puede tener CV.** Esto incluye dueños de empresas que también
buscan trabajo, freelancers con emprendimiento, etc.

### Lo que compone el CV
- Foto de perfil
- Rol/título ("Cajero", "Diseñador gráfico", "Electricista")
- Zona / radio de trabajo
- Disponibilidad (ahora / esta semana / flexible)
- Habilidades (tags)
- Experiencia laboral
- Educación
- Portfolio (links / imágenes)

### Visibilidad del CV en el mapa
- Cualquier usuario con CV activo puede aparecer como pin en el mapa
- El usuario controla si su CV está "visible" o "oculto"
- En el mapa se filtran por: disponibilidad, habilidades, zona, rol

### Acceso a CVs por rol
| Acción | Usuario | Emprendimiento | Empresa free | Empresa pago |
|--------|:-------:|:--------------:|:------------:|:------------:|
| Ver lista de CVs | ✅ nombre + rol + zona | ✅ ídem | ✅ ídem | ✅ perfil completo |
| Ver perfil completo | ❌ | ❌ | ❌ | ✅ |
| Marcar interesado | ❌ | ❌ | ✅ | ✅ |
| Contactar / chat | ❌ | ❌ | ❌ | ✅ |
| Publicar búsqueda laboral | ❌ | ✅ 1 | ✅ 3 | ✅ ∞ |

---

## Lógica de nudge (upgrade inteligente)

Cuando un usuario llega a un límite, el sistema siempre sugiere el siguiente rol.
**El mensaje cambia según el contexto:**

### Usuario → sube 3er producto usado
> "Llegaste al límite de productos de segunda mano.
> Subí a **Emprendimiento** (gratis) para cargar hasta 10."
> [Subir de nivel gratis] [Tal vez después]

### Usuario → intenta subir producto nuevo
> "Los productos nuevos son para emprendimientos y empresas.
> Registrate como **Emprendimiento** (gratis) o como **Usuario Premium**
> para subir hasta 5 productos nuevos."
> [Ser Emprendimiento — gratis] [Usuario Premium — $X/mes] [Cancelar]

### Usuario Premium → llega a 5 productos nuevos
> "Para más de 5 productos nuevos necesitás ser **Emprendimiento** (gratis)."

### Emprendimiento → llega a 5 productos
> "Llegaste al límite del plan Emprendimiento.
> Registrá tu negocio como **Empresa** y tené productos ilimitados + estadísticas."
> [Ver planes de Empresa]

### Empresa free → intenta subir 4to producto
> "Tu cuenta tiene un límite de 3 productos activos.
> Activá tu plan para tener productos ilimitados y funciones avanzadas."
> [Ver planes — desde $X/mes]

### Empresa free → intenta contactar candidato
> "Para contactar candidatos necesitás el plan activo."
> [Activar plan]

---

## Estrategia de conversión a pago

### Por qué NO cobrar en el registro
- Una tienda que llega al registro todavía no vio el valor
- El paywall en registro mata la conversión (estimado: -60 a -80%)
- Perdemos el conteo de tiendas (social proof de "X comercios registrados")
- Perdemos el dato del negocio (nombre, categoría, zona) para métricas

### Por qué el modelo de límites funciona
1. Entran fácil → arman el perfil → invierten tiempo
2. Ven que llegan demandas reales → entienden el valor
3. Llegan al límite en el momento de mayor motivación
4. El upgrade aparece exactamente cuando quieren hacer más
5. La fricción del pago es mínima porque el contexto lo justifica

### Opción: 30 días gratis ilimitados para Empresa
En lugar de límite permanente de 3 productos:
- 30 días con todo habilitado (productos ilimitados, estadísticas, etc.)
- Al vencer: baja a 3 productos, sin estadísticas
- Esto maximiza la inversión inicial del comercio
- Decisión pendiente: ¿límite permanente o trial?

---

## Flujos de upgrade de rol

### Usuario → Emprendimiento
- Gratis, instantáneo
- Se activa desde: perfil, botón crear (al intentar subir producto nuevo), nudge
- Requiere: nombre del emprendimiento + rubro
- No pierde ningún dato previo

### Emprendimiento → Empresa free
- Gratis, instantáneo  
- Se activa desde: nudge al llegar a límite de productos
- Requiere: confirmar tipo de negocio + toggle local físico
- Gana: página `/t/slug`, aparece en mapa como negocio, feed completo

### Empresa free → Empresa pago
- Pago mensual o anual (MercadoPago — ya integrado)
- Se activa desde: nudge, panel de perfil, sección de estadísticas (bloqueada)
- Gana: productos ilimitados, estadísticas, badge verificada, chat con candidatos

---

## Notas de implementación

- Los límites se validan en el **backend** (Netlify functions), no solo en el frontend
- El frontend muestra el nudge antes de que el usuario intente la acción (proactivo)
  y también al momento del bloqueo (reactivo)
- Feature flags permiten ajustar límites sin deploy
- El rol se guarda en el perfil de usuario (localStorage ahora → Firestore futuro)
- Un mismo usuario puede tener rol "emprendimiento" y también tener CV activo
