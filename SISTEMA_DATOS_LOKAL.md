# 📊 SISTEMA COMPLETO DE DATOS, AUDITORÍA Y ANALYTICS — LOKAL

> Última actualización: 2026-05-22
> Estado: En producción

---

## 🗺️ MAPA DE DATOS EN R2

```
lokal-bucket/
│
├── data/                          ← Datos de negocio
│   ├── categories-custom.json     ← Categorías de productos/demandas
│   ├── comprobantes.json          ← Comprobantes de pago por transferencia
│   ├── config.json                ← Config general del sitio (feature flags, demo mode)
│   ├── config-pago.json           ← Config de pago (alias, CBU, titular, banco)
│   ├── demandas.json              ← Demandas de usuarios
│   ├── messages.json              ← Mensajes entre usuarios y tiendas
│   ├── mp-pending.json            ← Pagos pendientes de MercadoPago
│   ├── notifications.json         ← Notificaciones push/in-app
│   ├── ofertas.json               ← Productos/ofertas de tiendas
│   ├── respuestas.json            ← Respuestas a demandas
│   ├── tiendas.json               ← Perfiles de tiendas/empresas
│   └── user-profiles.json         ← Perfiles de usuarios
│
├── audit/                         ← Logs de auditoría (inmutables)
│   └── YYYY-MM/
│       ├── YYYY-MM-DD.json        ← Logs del día
│       └── YYYY-MM-DD-index.json  ← Índice por entidad
│
├── analytics/                     ← Eventos de analytics
│   └── YYYY-MM/
│       ├── events-YYYY-MM-DD.json     ← Eventos crudos
│       ├── sessions-YYYY-MM-DD.json   ← Sesiones de usuarios
│       └── metrics-YYYY-MM-DD.json    ← Métricas agregadas
│
├── invites/                       ← Tokens de invitación
│   └── {token}.json
│
├── comprobantes/                  ← Fotos de comprobantes subidos
│   └── {uid}_{timestamp}.ext
│
├── images/                        ← Imágenes subidas
│   └── {uuid}.ext
│
└── videos/                        ← Videos subidos
    └── {uuid}.ext
```

---

## 🔌 ENDPOINTS DEL SISTEMA (26 total)

### Endpoints de Negocio (existentes)

| # | Endpoint | Métodos | Qué hace | Auth |
|---|----------|---------|----------|------|
| 1 | `categories.js` | GET, POST | Categorías del sistema | GET: público, POST: JWT (⚠️ debería ser admin) |
| 2 | `comprobantes.js` | GET, POST, PATCH | Comprobantes de pago | JWT |
| 3 | `config-pago.js` | GET, POST | Config de pago (alias/CBU) | GET: JWT, POST: admin |
| 4 | `demandas.js` | GET, POST, PATCH, DELETE | Demandas de usuarios | JWT |
| 5 | `historial-pagos.js` | GET | Historial de pagos de tienda | ✅ JWT + dueño/admin (FIXED) |
| 6 | `invites.js` | GET, POST, PATCH | Sistema de invitaciones | Mix |
| 7 | `messages.js` | GET, POST | Chat entre usuarios y tiendas | JWT |
| 8 | `mp-checkout.js` | POST | Crear preferencia de pago MP | JWT |
| 9 | `mp-webhook.js` | POST | Webhook de MercadoPago | HMAC MP |
| 10 | `notifications.js` | GET, POST, PATCH | Notificaciones in-app | JWT |
| 11 | `ofertas.js` | GET, POST, PATCH, DELETE | Productos/ofertas | Mix |
| 12 | `registrar-pago-manual.js` | POST | Registrar pagos manuales | JWT + admin |
| 13 | `respuestas.js` | GET, POST, PATCH, DELETE | Respuestas a demandas | JWT |
| 14 | `site-config.js` | GET, POST | Config general del sitio | GET: público, POST: admin |
| 15 | `store-insights.js` | GET | Insights IA de tienda | JWT |
| 16 | `suggest-category.js` | POST | Sugerir categoría con IA | Público |
| 17 | `tiendas-crud.js` | GET, POST, PATCH | CRUD de tiendas | Mix |
| 18 | `upload-comprobante.js` | POST | Subir foto de comprobante | JWT |
| 19 | `upload.js` | POST | Subir imágenes/videos | JWT |
| 20 | `user-profile.js` | GET, POST | Perfiles de usuario | JWT |

### Endpoints de Admin (nuevos)

| # | Endpoint | Métodos | Qué hace | Auth |
|---|----------|---------|----------|------|
| 21 | `admin-stats.js` | GET | Estadísticas del sistema | Admin |
| 22 | `admin-actions.js` | POST, PATCH, DELETE | Suspender/activar/eliminar | Admin |
| 23 | `admin-audit.js` | GET | Consultar logs de auditoría | Admin |
| 24 | `admin-ai-context.js` | GET | Contexto completo para IA | Admin |
| 25 | `admin-analytics.js` | GET | Consultar analytics | Admin |
| 26 | `analytics.js` | POST | Recibir eventos del frontend | Público (opcional JWT) |

---

## 📋 SISTEMA DE AUDITORÍA

### Qué se loguea automáticamente

| Acción | Endpoint que loguea | Datos guardados |
|--------|---------------------|-----------------|
| Tienda creada | `tiendas-crud.js` | Quién, cuándo, plan, método |
| Tienda actualizada | `tiendas-crud.js` | Campos cambiados, antes/después |
| Pago registrado | `registrar-pago-manual.js` | Monto, plan, quién registró |
| Suscripción anulada | `registrar-pago-manual.js` | Plan anterior, motivo |
| Tienda suspendida | `admin-actions.js` | Quién, cuándo, motivo |
| Tienda activada | `admin-actions.js` | Quién, cuándo |
| Tienda eliminada | `admin-actions.js` | Soft delete, quién, cuándo |
| Producto suspendido | `admin-actions.js` | Quién, cuándo, motivo |
| Demanda suspendida | `admin-actions.js` | Quién, cuándo, motivo |

### Consultas disponibles (admin-audit.js)

| Parámetro | Descripción |
|-----------|-------------|
| `?tipo=hoy` | Logs de hoy (default) |
| `?tipo=entidad&entidadTipo=tienda&entidadId=xxx` | Logs de una entidad |
| `?tipo=actor&actorUid=xxx` | Logs de un usuario |
| `?tipo=accion&accion=tienda.` | Logs por tipo de acción |
| `?tipo=stats` | Estadísticas de auditoría |

---

## 📊 SISTEMA DE ANALYTICS

### Eventos que se pueden trackear

| Tipo | Descripción | Datos útiles |
|------|-------------|--------------|
| `pageview` | Vista de página | página, tiendaId, productoId |
| `click` | Click en elemento | elemento, tiendaId, productoId |
| `busqueda` | Búsqueda realizada | query, resultados |
| `scroll` | Scroll profundo | profundidad, página |
| `tiempo` | Tiempo en página | segundos, página |
| `chat_iniciado` | Chat abierto | tiendaId, demandaId |
| `mensaje_enviado` | Mensaje enviado | conversacionId |
| `rating` | Rating dado | valor, tiendaId |
| `conversion` | Conversión (venta) | tiendaId, monto, productoId |
| `demanda_creada` | Nueva demanda | categoria, usuarioUid |
| `respuesta_enviada` | Respuesta a demanda | tiendaId, demandaId |
| `producto_visto` | Ver producto | productoId, tiendaId |
| `tienda_vista` | Ver tienda | tiendaId, origen |
| `compartir` | Compartir | plataforma, contenido |
| `favorito` | Agregar favorito | tiendaId, productoId |

### Métricas agregadas automáticamente

| Métrica | Descripción |
|---------|-------------|
| Eventos totales | Cantidad total de eventos del día |
| Usuarios únicos | UIDs distintos |
| Sesiones únicas | Session IDs distintos |
| Pageviews | Vistas de página |
| Clicks | Clicks totales |
| Búsquedas | Búsquedas realizadas |
| Chats iniciados | Conversaciones nuevas |
| Mensajes enviados | Total de mensajes |
| Rating promedio | Promedio de ratings |
| Tiempo promedio | Tiempo por sesión |
| Conversiones | Ventas/conversiones |
| Por página | Distribución por pantalla |
| Por categoría | Distribución por categoría |
| Por tienda | Vistas, clicks, chats, tiempo |
| Por producto | Vistas, clicks, tiempo |
| Flujo de navegación | Transiciones más comunes |

### Consultas disponibles (admin-analytics.js)

| Parámetro | Descripción |
|-----------|-------------|
| `?tipo=resumen&dias=7` | Métricas diarias |
| `?tipo=tienda&tiendaId=xxx&dias=30` | Analytics de una tienda |
| `?tipo=producto&productoId=xxx&dias=30` | Analytics de un producto |
| `?tipo=busquedas&dias=7&limit=20` | Top búsquedas |
| `?tipo=flujo&dias=7` | Flujo de navegación |

---

## 🤖 CONTEXTO PARA IA (admin-ai-context.js)

### Modos disponibles

| Modo | Descripción | Uso |
|------|-------------|-----|
| `?modo=resumen` | Datos agregados del sistema | Overview rápido |
| `?modo=completo` | Datos crudos con detalle | Análisis profundo |
| `?modo=alertas` | Solo problemas detectados | Monitoreo automático |
| `?modo=sugerencias` | Acciones recomendadas | Asistente IA |

### Datos que recibe la IA

#### Modo Resumen
- Tiendas: total, activas, suspendidas, por plan, vencidas, por vencer, nuevas
- Productos: total, activos, con/sin foto, precio promedio, por tienda
- Demandas: total, tasa de respuesta, por categoría, nuevas
- Usuarios: total, con/sin tienda, por rol
- Finanzas: ingresos total, ingresos mes, pagos manuales vs MP

#### Modo Completo
- Todo lo de resumen +
- Detalle de cada tienda (plan, días para vencer, rating, productos, etc.)
- Detalle de cada producto (precio, foto, activo, etc.)
- Detalle de cada demanda (respuestas, categoría, estado)

#### Modo Alertas
- Suscripciones vencidas (con lista de tiendas)
- Suscripciones por vencer en 7 días
- Tasa de respuesta baja (< 30%)
- Productos sin foto (> 50%)
- Tiendas sin horarios
- Tiendas sin productos

#### Modo Sugerencias
- Campaña de recuperación de vencidas
- Campaña "Producto con foto"
- Mejorar tasa de respuesta
- Onboarding tiendas nuevas
- Expandir rubros desatendidos

---

## 🎛️ CONTROL ADMIN REAL (admin-actions.js)

### Acciones disponibles

| Acción | Tipo | Qué hace | Persistencia |
|--------|------|----------|--------------|
| `suspender` | tienda/producto/demanda | Marca como suspendida | ✅ R2 + audit |
| `activar` | tienda/producto/demanda | Quita suspensión | ✅ R2 + audit |
| `eliminar` | tienda/producto/demanda | Soft delete | ✅ R2 + audit |

### Campos agregados a entidades

```json
{
  "suspendida": true,
  "suspendidaEn": "2026-05-22T10:00:00Z",
  "suspendidaPor": "admin@email.com",
  "suspendidaMotivo": "Spam",
  "eliminada": true,
  "eliminadaEn": "2026-05-22T10:00:00Z",
  "eliminadaPor": "admin@email.com"
}
```

---

## 📈 STATS DEL SISTEMA (admin-stats.js)

### Datos devueltos

```json
{
  "tiendas": {
    "total": 45,
    "activas": 40,
    "suspendidas": 3,
    "nuevasEsteMes": 5
  },
  "suscripciones": {
    "total": 38,
    "activas": 35,
    "vencidas": 2,
    "porVencer": 4
  },
  "usuarios": {
    "total": 120,
    "conTienda": 45,
    "sinTienda": 75
  },
  "ingresos": {
    "mesActual": 150000,
    "total": 1200000
  }
}
```

---

## 🔧 LIBRERÍAS COMPARTIDAS (_lib/)

| Archivo | Qué hace | Quién lo usa |
|---------|----------|--------------|
| `auth.js` | Firebase JWT, admin check | Todos los endpoints |
| `http.js` | Helpers HTTP (jsonResponse, HttpError, etc.) | Todos los endpoints |
| `validation.js` | Sanitización de inputs | Endpoints con datos de usuario |
| `tiendas-store.js` | Leer/escribir tiendas.json | tiendas-crud, mp-webhook, registrar-pago-manual, etc. |
| `user-profiles-store.js` | Leer/escribir user-profiles.json | user-profile, mp-webhook, registrar-pago-manual |
| `config-store.js` | Leer/escribir config.json | site-config |
| `ofertas-store.js` | Leer/escribir ofertas.json | admin-actions |
| `demandas-store.js` | Leer/escribir demandas.json | admin-actions |
| `audit-store.js` | Logs de auditoría | tiendas-crud, registrar-pago-manual, admin-actions |
| `analytics-store.js` | Eventos y métricas | analytics, admin-analytics |

---

## 🎯 PRÓXIMOS PASOS SUGERIDOS

### Frontend (AdminDashboard)

1. **Tab "Auditoría"** — Visualizar logs con filtros (entidad, actor, acción, fecha)
2. **Tab "Analytics"** — Gráficos de métricas, flujo de navegación, heatmaps
3. **Tab "IA"** — Chat con IA que consulta `admin-ai-context.js` y responde preguntas
4. **Stats en Overview** — Ya está conectado ✅

### Frontend (App general)

5. **Tracker de eventos** — Enviar eventos a `analytics.js` desde:
   - Cambios de pantalla
   - Clicks en productos/tiendas
   - Búsquedas
   - Tiempo en página
   - Inicio de chats
   - Ratings

### Backend

6. **Agregar `ensureAdmin` a `categories.js` POST**
7. **Unificar auth en `comprobantes.js`, `registrar-pago-manual.js`, `upload-comprobante.js`**
8. **Backups automáticos de R2**

---

*Documento maestro del sistema de datos LOKAL*
