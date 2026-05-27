# LOKAL — Roadmap Consolidado
> Última actualización: 2026-05-25

---

## Estado general del producto

| Módulo | Progreso | Estado |
|--------|----------|--------|
| Core / Auth / Roles | ████████████ 95% | ✅ Prod |
| Mapa interactivo | ███████████░ 90% | ✅ Prod |
| StoreApp (panel tienda) | ██████████░░ 85% | ✅ Prod |
| Registro tienda + pago MP | ████████████ 95% | ✅ Prod |
| Admin Dashboard | ████████░░░░ 65% | 🟡 Parcial |
| Demandas | ██████████░░ 85% | ✅ Prod |
| TiendaPublica (microsite) | ██████░░░░░░ 50% | 🟡 WIP |
| Chat / Mensajería | █████░░░░░░░ 40% | 🟡 UI sola |
| Horarios de tienda | ████████████ 95% | ✅ Prod |
| Suscripciones | ████████░░░░ 70% | 🟡 Parcial |
| Sistema CV / Oportunidades | ░░░░░░░░░░░░ 0% | 🔴 Pendiente |
| Feed / Descubrí | ░░░░░░░░░░░░ 0% | 🔴 Pendiente |
| Viajes / Carpool | ░░░░░░░░░░░░ 0% | 🔴 Pendiente |
| Servicios | ░░░░░░░░░░░░ 0% | 🔴 Pendiente |
| PLP (Product Listing Page) | ░░░░░░░░░░░░ 0% | 🔴 Pendiente |
| Notificaciones push (FCM) | ██░░░░░░░░░░ 15% | 🔴 SW listo, FCM no |

---

## Módulos implementados en detalle

### ✅ Core / Auth / Roles — 95%
- Firebase Auth (Google Sign-In)
- Roles: usuario → emprendimiento → empresa básico → empresa premium
- Capacidades por rol (productos, respuestas, stats, etc.)
- Suscripción vinculada al rol
- Onboarding de 3 pasos
- ❌ Falta: feature flags persistentes en R2/Firestore

### ✅ Mapa — 90%
- Clustering de markers
- Radar "buscar en esta zona"
- Rutas a pie (OSRM)
- Lista lateral con filtros (tipo, categoría, búsqueda)
- Chip "Ver abiertas / Abiertas ahora" — filtro tiempo real por horario
- Modo satélite
- Ubicación fija + GPS tiempo real
- Ubicaciones guardadas
- Búsqueda de tiendas y zonas (Nominatim)
- ❌ Falta: filtro por rating, filtro por distancia

### ✅ StoreApp (panel tienda) — 85%
- Dashboard con stats
- Gestión de productos (CRUD)
- Ver demandas del feed
- Responder demandas (empresa)
- Editor de horarios por día (abierto/cerrado, horario)
- Badge "Abierto/Cerrado" en tiempo real
- Mensajes / Chat UI
- Insights IA (store-insights endpoint)
- Upgrade a Premium (conectado a MP)
- ❌ Falta: simulación de roles en producción (remover `_simulated` localStorage)
- ❌ Falta: badge de demandas nuevas cross-device (ahora es localStorage)

### ✅ Registro tienda + MP — 95%
- Flujo self-service completo
- Pago con MercadoPago (checkout + webhook)
- Registro manual (comprobante + admin aprueba)
- InviteFlow con links únicos
- ❌ Falta: script de migración tiendas existentes a `userProfile.businessProfile`

### 🟡 Admin Dashboard — 65%
- UI completa (soporte 3 columnas, sidebar, tabs)
- Stats reales via `admin-stats.js`
- Suspender / Activar / Eliminar tienda (persiste en R2)
- Sistema de auditoría (`admin-audit.js`, `admin-actions.js`)
- Modo demo
- ❌ Endpoint GET /users → sigue siendo MOCK_USERS (10 hardcodeados)
- ❌ Reportes → MOCK_REPORTS (4 estáticos)
- ❌ Soporte → MOCK_SUPPORT_CHATS (3 estáticos)
- ❌ Feature flags → sin persistencia, se reinician
- ❌ Panel auditoría → existe endpoint pero no integrado en UI

### 🟡 Demandas — 85%
- Crear demanda con foto, categoría, presupuesto, matchType
- Feed de demandas por zona
- Respuestas de tiendas
- Adjuntos en respuestas
- ❌ Falta: flujo de "marcar como resuelto" por el usuario
- ❌ Falta: notificación al usuario cuando le responden

### 🟡 TiendaPublica (microsite) — 50%
- Estructura base de componentes
- ❌ Sin visualización de horarios con estado abierto/cerrado
- ❌ Sin theming personalizable
- ❌ Ruta pública `/t/:slug` no verificada en prod

### 🟡 Chat / Mensajería — 40%
- UI completa (burbujas, input, adjuntos)
- Endpoint `messages.js` existe
- ❌ Sin WebSocket real → no hay tiempo real
- ❌ Sin notificación de mensajes nuevos

### 🟡 Suscripciones — 70%
- MP Checkout funcional
- Webhook sincroniza userProfile
- Historial de pagos (con auth fix aplicado)
- Paywall cuando vence (frontend)
- ❌ Precios configurables desde Admin → pendiente
- ❌ Período de gracia / renovación automática → pendiente

---

## Pendientes por etapa

### Etapa A — Admin real (alta prioridad)
> El dashboard existe pero corre en el vacío. Antes de escalar hay que conectarlo.

- [ ] Endpoint `GET /admin/users` — reemplazar MOCK_USERS con datos reales
- [ ] Endpoint `GET /admin/reports` — persistencia real
- [ ] Endpoint `GET /admin/support-chats` — persistencia real
- [ ] Persistir feature flags en `config.json` de R2
- [ ] Integrar panel auditoría en UI (endpoint ya existe)
- [ ] Endpoint comprobantes pendientes

### Etapa B — TiendaPublica completa
> Necesaria para que las tiendas puedan compartir su link.

- [ ] Tabla de horarios con estado abierto/cerrado en tiempo real
- [ ] Theming básico personalizable (color primario, banner)
- [ ] Catálogo de productos público
- [ ] SEO básico (meta tags por tienda)
- [ ] Verificar ruta `/t/:slug` en prod

### Etapa C — Sistema CV / Oportunidades
> El módulo más estratégico pendiente. Conecta personas ↔ negocios.

- [ ] Crear/editar CV en perfil (habilidades, experiencia, disponibilidad)
- [ ] Sección pública "Oportunidades" con dos tipos de cards:
  - CVs (personas que buscan trabajo)
  - Búsquedas laborales (empresas que buscan personas)
- [ ] Sistema de postulaciones (usuario → búsqueda laboral)
- [ ] Sistema de interés inverso (empresa → CV de persona)
- [ ] Integración en el mapa (marcador de oportunidad)

### Etapa D — Viajes / Carpool
> Módulo social de movilidad local.

- [ ] Publicar oferta de viaje (origen, destino, fecha, asientos, precio)
- [ ] Buscar viaje disponible
- [ ] Reservar asiento
- [ ] Integración en mapa (punto de salida)

### Etapa E — Feed / Descubrí
> Pilar de contenido. Depende de tener suficiente contenido real primero.

- [ ] Feed tipo explore con posts de tiendas (foto + caption)
- [ ] Filtro por categoría / zona
- [ ] Compartir oferta como post
- [ ] Guardar en favoritos

### Etapa F — Notificaciones push
> Service Worker listo, falta conectar FCM.

- [ ] Integrar Firebase Cloud Messaging (FCM)
- [ ] Notificar cuando responden una demanda
- [ ] Notificar mensajes nuevos
- [ ] Notificar cuando vence suscripción

### Etapa G — Seguridad (pendiente de auditoría)
- [ ] `categories.js` POST — agregar `ensureAdmin`
- [ ] `notifications.js` POST — validar que solo sistema/admin envíe
- [ ] Backups periódicos de R2

---

## Archivos que se pueden borrar (consolidados aquí)

- `FASE_1_COMPLETADA.md` — arquitectura modular ✅
- `FASE_2_COMPLETADA.md` — módulos + UI atoms ✅
- `FASE_3_COMPLETADA.md` — onboarding + roles ✅
- `FASE_4_COMPLETADA.md` — admin dashboard ✅
- `NEXT_STEPS.md` — guía fases 2 y 3 ✅
- `HOME_MEJORAS.md` — rondas 1-4 ✅, Ronda 5 → pendiente en etapas futuras
- `AUDITORIA_SISTEMA_LOKAL.md` — fase 1 resuelta; pendientes en Etapa A y G
- `ESTRATEGIA_ROLES_Y_PLANES_FINAL.md` — implementada; referencia en sección Core
- `COMPONENTES_EXTRAIDOS.md` — referencia técnica desactualizada
- `FILE_MAP.md` — se puede regenerar con el código actual

## Archivos a mantener
- `BASE ESTRATEGICA DEL ECOSISTEMA LOKAL.MD` — visión estratégica
- `ARQUITECTURA.md` — referencia técnica (actualizar si cambia stack)
- `LOKAL_AI_PROMPT.md` — contexto para IA (mantener actualizado)
- `QUICK_START.md` — onboarding de devs
- `SISTEMA_DATOS_LOKAL.md` — esquema de datos
