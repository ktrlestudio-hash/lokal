# Sistema de Notificaciones — LOKAL

## Principio
Un solo sistema centralizado, dinámico y modular. La misma data sirve para push PWA, in-app badges, centro de notificaciones y toasts. Agregar un nuevo tipo de notificación es declarar un objeto en el registro — no tocar lógica de routing ni de canales.

---

## Canales

| Canal | Cuándo activa |
|---|---|
| **Push PWA (FCM)** | App cerrada o en background |
| **Toast / snackbar** | App abierta, pantalla distinta al origen |
| **Badge + centro de notificaciones** | Siempre, acumulativo |
| **Badge bottom nav / sidebar** | Siempre que haya no leídos del tipo correspondiente |

---

## Arquitectura

```
Usuario/sistema genera evento
        ↓
Backend recibe → busca el tipo en NOTIF_REGISTRY → determina destinatario(s)
        ↓
  Escribe en /notifications/{uid}/items/{notifId}   ← fuente de verdad
  +
  Dispara FCM push al token del destinatario         ← si está offline
        ↓
App escucha /notifications/{uid} en tiempo real (un solo onSnapshot por sesión)
        ↓
  → Badge global (campana / ícono mensajes)
  → Centro de notificaciones (panel/modal)
  → Toast si app está abierta y usuario en otra pantalla
  → Deep link al tocar: navega a la pantalla correcta automáticamente
```

---

## Diseño modular — NOTIF_REGISTRY

El corazón del sistema. Cada tipo de notificación es una entrada en este registro. Para agregar soporte a una nueva sección o acción, solo se agrega un objeto acá — el motor lo resuelve solo.

```js
// src/notifications/registry.js
export const NOTIF_REGISTRY = {

  // ── Mensajes ──────────────────────────────────────────────────────────────
  mensaje_cliente: {
    rol: 'cliente',
    icon: 'MessageSquare',
    color: 'blue',
    title: (data) => `Nuevo mensaje de ${data.tiendaNombre}`,
    body:  (data) => data.preview,
    deepLink: (data) => ({ screen: 'mensajes', params: { tiendaId: data.tiendaId } }),
    badge: 'mensajes',          // ← qué badge incrementa
    push: true,                 // ← dispara FCM
    toast: true,                // ← muestra toast si app abierta
  },

  mensaje_tienda: {
    rol: 'tienda',
    icon: 'MessageSquare',
    color: 'blue',
    title: (data) => `Mensaje de ${data.clienteLabel}`,
    body:  (data) => data.preview,
    deepLink: (data) => ({ screen: 'mensajes', params: { threadKey: data.threadKey } }),
    badge: 'mensajes',
    push: true,
    toast: true,
  },

  // ── Demandas ──────────────────────────────────────────────────────────────
  respuesta_demanda: {
    rol: 'cliente',
    icon: 'Package',
    color: 'amber',
    title: (data) => `${data.tiendaNombre} respondió tu demanda`,
    body:  (data) => data.demandaTitulo,
    deepLink: (data) => ({ screen: 'feed', params: { demandaId: data.demandaId } }),
    badge: 'notificaciones',
    push: true,
    toast: true,
  },

  demanda_match: {
    rol: 'tienda',
    icon: 'Zap',
    color: 'amber',
    title: (data) => `Nueva demanda en ${data.rubro}`,
    body:  (data) => data.titulo,
    deepLink: (data) => ({ screen: 'feed', params: { demandaId: data.demandaId } }),
    badge: 'demandas',
    push: true,
    toast: false,
  },

  demanda_urgente: {
    rol: 'tienda',
    icon: 'AlertTriangle',
    color: 'red',
    title: (data) => `⚡ Demanda urgente en ${data.rubro}`,
    body:  (data) => data.titulo,
    deepLink: (data) => ({ screen: 'feed', params: { demandaId: data.demandaId } }),
    badge: 'demandas',
    push: true,
    toast: true,
    priority: 'high',           // ← FCM high priority
  },

  respuesta_aceptada: {
    rol: 'tienda',
    icon: 'CheckCircle',
    color: 'green',
    title: (data) => 'Tu respuesta fue aceptada',
    body:  (data) => data.demandaTitulo,
    deepLink: (data) => ({ screen: 'mensajes', params: { threadKey: data.threadKey } }),
    badge: 'notificaciones',
    push: true,
    toast: true,
  },

  demanda_reactivada: {
    rol: 'tienda',             // a tiendas que ya habían respondido
    icon: 'RotateCcw',
    color: 'blue',
    title: (data) => 'Una demanda que respondiste volvió a estar activa',
    body:  (data) => data.demandaTitulo,
    deepLink: (data) => ({ screen: 'feed', params: { demandaId: data.demandaId } }),
    badge: 'demandas',
    push: false,
    toast: true,
  },

  // ── Suscripción y pagos ───────────────────────────────────────────────────
  suscripcion_vence: {
    rol: 'tienda',
    icon: 'CreditCard',
    color: 'orange',
    title: (data) => `Tu suscripción vence en ${data.dias} día${data.dias !== 1 ? 's' : ''}`,
    body:  () => 'Renová para no perder acceso',
    deepLink: () => ({ screen: 'perfil', params: { tab: 'suscripcion' } }),
    badge: 'notificaciones',
    push: true,
    toast: true,
    trigger: 'scheduled',       // ← Cloud Function con trigger de tiempo
    triggerDays: [7, 3, 1],     // ← disparar X días antes
  },

  suscripcion_vencida: {
    rol: 'tienda',
    icon: 'Lock',
    color: 'red',
    title: () => 'Tu suscripción venció',
    body:  () => 'Renová ahora para recuperar el acceso completo',
    deepLink: () => ({ screen: 'perfil', params: { tab: 'suscripcion' } }),
    badge: 'notificaciones',
    push: true,
    toast: true,
    trigger: 'scheduled',
  },

  pago_confirmado: {
    rol: 'tienda',
    icon: 'CheckCircle',
    color: 'green',
    title: () => 'Pago confirmado',
    body:  (data) => `Suscripción activa hasta ${data.vence}`,
    deepLink: () => ({ screen: 'perfil', params: { tab: 'pagos' } }),
    badge: 'notificaciones',
    push: true,
    toast: true,
  },

  // ── Stock y productos ─────────────────────────────────────────────────────
  stock_disponible: {
    rol: 'cliente',
    icon: 'ShoppingBag',
    color: 'green',
    title: (data) => `${data.productoNombre} volvió a tener stock`,
    body:  (data) => data.tiendaNombre,
    deepLink: (data) => ({ screen: 'producto', params: { productoId: data.productoId } }),
    badge: 'notificaciones',
    push: true,
    toast: true,
  },

  limite_productos: {
    rol: 'tienda',
    icon: 'AlertCircle',
    color: 'orange',
    title: (data) => `Usaste ${data.actual} de ${data.limite} productos`,
    body:  () => 'Considerá actualizar tu plan',
    deepLink: () => ({ screen: 'perfil', params: { tab: 'suscripcion' } }),
    badge: 'notificaciones',
    push: false,
    toast: true,
    trigger: 'threshold',       // ← se dispara al superar un umbral
    threshold: 0.9,             // ← 90% del límite
  },

  // ── Tienda / perfil ───────────────────────────────────────────────────────
  tienda_verificada: {
    rol: 'tienda',
    icon: 'ShieldCheck',
    color: 'green',
    title: () => 'Tu tienda fue verificada ✓',
    body:  () => 'Ahora aparecés con el badge de verificada',
    deepLink: () => ({ screen: 'perfil' }),
    badge: 'notificaciones',
    push: true,
    toast: true,
    trigger: 'admin',           // ← disparado por admin del sistema
  },

  perfil_incompleto: {
    rol: 'tienda',
    icon: 'Info',
    color: 'blue',
    title: () => 'Tu perfil está incompleto',
    body:  (data) => `Falta: ${data.faltantes.join(', ')}`,
    deepLink: () => ({ screen: 'perfil' }),
    badge: 'notificaciones',
    push: false,
    toast: true,
    trigger: 'scheduled',
    triggerDelay: '24h',        // ← 24h después del registro si perfil incompleto
  },

  // ── Sistema / admin ───────────────────────────────────────────────────────
  sistema_aviso: {
    rol: 'todos',               // ← broadcast a todos los usuarios
    icon: 'Info',
    color: 'slate',
    title: (data) => data.titulo,
    body:  (data) => data.cuerpo,
    deepLink: (data) => data.url ? { external: data.url } : null,
    badge: 'notificaciones',
    push: true,
    toast: true,
    trigger: 'admin',
  },

};
```

---

## Motor de notificaciones (cómo funciona)

```js
// src/notifications/engine.js
// Backend llama esto, no el frontend directamente

async function dispatch(type, recipientUid, data) {
  const def = NOTIF_REGISTRY[type];
  if (!def) throw new Error(`Tipo desconocido: ${type}`);

  const notif = {
    type,
    title: def.title(data),
    body:  def.body(data),
    data,                         // payload completo para deep link
    read: false,
    ts: Date.now(),
    icon: def.icon,
    color: def.color,
  };

  // 1. Escribir en Firestore (fuente de verdad, alimenta in-app)
  await firestore
    .collection('notifications').doc(recipientUid)
    .collection('items').add(notif);

  // 2. Push FCM si corresponde y usuario tiene token
  if (def.push) {
    const tokens = await getUserTokens(recipientUid);
    if (tokens.length) await fcm.sendMulticast({ tokens, notification: notif });
  }
}
```

## Cómo agregar un nuevo tipo

1. Agregar entrada en `NOTIF_REGISTRY` con su `rol`, `title`, `body`, `deepLink`, `badge`, `push`, `toast`
2. En el backend, llamar `dispatch('nuevo_tipo', uid, data)` cuando ocurre el evento
3. Listo — el motor lo enruta a todos los canales automáticamente

No hay que tocar el centro de notificaciones, ni los badges, ni el Service Worker.

---

## FCM Token Flow

1. Usuario abre app / instala PWA
2. En contexto relevante (primer mensaje, primera demanda) → `Notification.requestPermission()`
3. Si acepta → obtener token FCM → guardar en `Firestore: /users/{uid}/fcmTokens/{tokenId}`
4. Token se refresca automáticamente → `onTokenRefresh` lo actualiza
5. Al hacer logout → token se elimina del documento

---

## Estructura Firestore

```
/notifications/{uid}/
  items/
    {notifId}:
      type: string
      title: string
      body: string
      data: object          // payload para deep link (threadKey, demandaId, etc.)
      read: boolean
      ts: timestamp
      icon: string
      color: string

/users/{uid}/
  fcmTokens/
    {tokenId}:
      token: string
      platform: 'web' | 'android' | 'ios'
      updatedAt: timestamp
```

---

## Tipos de notificación completos (auditoría)

### Cliente (App.jsx)
| Tipo | Evento | Deep link |
|---|---|---|
| `mensaje_cliente` | Mensaje nuevo de tienda | → chat con tienda |
| `respuesta_demanda` | Tienda respondió demanda | → demanda en feed |
| `demanda_aceptada` | Demanda marcada resuelta | → historial |
| `stock_disponible` | Producto vuelve a tener stock | → producto |
| `promo_tienda` | Promoción de tienda seguida | → tienda pública |
| `sistema_aviso` | Aviso del sistema/admin | → según contexto |

### Tienda (StoreApp.jsx)
| Tipo | Evento | Deep link |
|---|---|---|
| `mensaje_tienda` | Mensaje nuevo de cliente | → inbox, convo |
| `demanda_match` | Nueva demanda en sus rubros | → feed |
| `demanda_urgente` | Demanda urgente en sus rubros | → feed, prioritaria |
| `respuesta_aceptada` | Cliente aceptó su respuesta | → chat |
| `demanda_reactivada` | Demanda que respondió volvió activa | → feed |
| `suscripcion_vence` | 7d / 3d / 1d para vencer | → suscripción |
| `suscripcion_vencida` | Día del vencimiento | → suscripción |
| `pago_confirmado` | Pago procesado exitosamente | → historial pagos |
| `limite_productos` | Alcanzó 90% del límite de productos | → suscripción |
| `tienda_verificada` | Admin verificó la tienda | → perfil |
| `perfil_incompleto` | 24h después del registro con perfil vacío | → perfil |
| `sistema_aviso` | Aviso del sistema/admin | → según contexto |

---

## Indicadores en UI (zonas ya identificadas)

### App.jsx (cliente)
- Badge campana en header — `notifList.filter(n => !n.leido).length`
- Badge "Mensajes" en menú lateral — `chatConversations unread sum`
- Centro de notificaciones: modal `showNotifications` (ya existe)
- Toast global pendiente de implementar

### StoreApp.jsx (tienda)
- Badge "Mensajes" bottom nav mobile — ya implementado (`unreadTotal`)
- Badge "Demandas" bottom nav — `newDemandasCount` ya implementado
- Badge sidebar desktop en Mensajes — pendiente
- Toast global — pendiente
- Banner suscripción por vencer — parcialmente implementado

---

## Implementación — Orden sugerido

1. **Firebase proyecto** — habilitar FCM, obtener credenciales servidor
2. **`src/notifications/registry.js`** — definir todos los tipos
3. **`src/notifications/engine.js`** — motor backend (Node/Cloud Functions)
4. **Service Worker** — `public/firebase-messaging-sw.js`
5. **Permission flow** — pedir permiso en contexto, no al cargar
6. **Token management** — guardar/refrescar/eliminar en Firestore
7. **Listener global** — un `onSnapshot` por sesión alimenta todo
8. **UI: badges + toasts + centro notif** — conectar al listener
9. **Deep links** — tocar notif push navega a pantalla correcta

---

## Notas
- Permiso de notificaciones: pedir en contexto, nunca al entrar a la app
- Tokens FCM: múltiples por usuario (distintos dispositivos)
- `suscripcion_vence` y `perfil_incompleto`: Cloud Functions con scheduled trigger
- `sistema_aviso`: broadcast, el backend itera todos los UIDs activos o usa FCM topics
- Para agregar soporte a una nueva sección: solo agregar entrada al registry + llamar `dispatch()` desde el backend
