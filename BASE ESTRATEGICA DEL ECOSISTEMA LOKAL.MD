# LOKAL — BASE ESTRATÉGICA DEL ECOSISTEMA
## Documento maestro de visión, arquitectura y dirección de producto

---

# VISIÓN GENERAL

Lokal NO debe pensarse como:
- una app de trabajo
- un marketplace
- una bolsa de empleo
- una red social
- una app de viajes
- una app de clasificados

Lokal debe pensarse como:

> Un sistema operativo local.
> Un ecosistema modular para conectar necesidades, oportunidades, personas, comercios y movimiento económico/social dentro de una ciudad.

La clave del producto NO son las funciones individuales.
La clave es:
- la identidad compartida
- la actividad local
- la relación entre usuarios y negocios
- la reutilización de datos y reputación
- el mapa como núcleo visual
- la modularidad escalable

---

# PRINCIPIO CENTRAL

## Lokal conecta:
- necesidades
- oportunidades
- habilidades
- servicios
- productos
- personas
- comercios
- movilidad
- trabajo
- demandas

Todo debe compartir una misma base.

---

# ARQUITECTURA CONCEPTUAL

## LOKAL = CORE + MÓDULOS

NO crear múltiples plataformas separadas.

SÍ crear:
- un núcleo central
- módulos especializados conectados

---

# CORE PRINCIPAL (INMUTABLE)

El core debe manejar:

- autenticación
- identidad
- perfiles
- ubicación
- reputación
- actividad
- estadísticas
- notificaciones
- mensajería futura
- permisos
- sistema de roles
- media/assets
- preferencias
- tags/habilidades/intereses

TODO módulo futuro debe apoyarse sobre esto.

---

# IDENTIDAD ÚNICA

El login rápido con Google seguirá siendo prioritario.

La cuenta Google funciona como:
- llave de acceso
- identidad persistente
- unión de actividad
- historial
- reputación
- estadísticas
- conexiones

NO deben existir múltiples cuentas separadas.

NO:
- cuenta empresa
- cuenta persona
- cuenta CV
- cuenta vendedor

SÍ:
- una identidad
- múltiples capacidades

---

# SISTEMA DE ROLES DINÁMICOS

Los roles NO son cuentas distintas.

Son capacidades habilitadas.

Ejemplo:

## Usuario Base
Puede:
- crear demandas
- explorar mapa
- guardar tiendas
- buscar trabajo
- crear CV
- aplicar a oportunidades
- ofrecer servicios

---

## Emprendimiento
Puede además:
- publicar búsquedas laborales
- publicar servicios
- vender productos
- tener mini perfil comercial

---

## Tienda Verificada
Puede:
- acceder a estadísticas
- recibir demandas
- gestionar productos
- crear miniweb
- administrar vacantes
- aparecer destacada
- acceder a herramientas premium

---

# FILOSOFÍA DE CRECIMIENTO

NO construir una super app monstruosa desde el inicio.

SÍ:
- construir una arquitectura preparada para crecer
- habilitar módulos progresivamente
- activar/desactivar funciones mediante feature flags

---

# FEATURE FLAGS

Todo módulo debe poder:
- activarse
- ocultarse
- pausarse
- limitarse por ciudad
- limitarse por usuarios
- marcarse como beta
- marcarse como próximamente

Esto evita:
- romper UX
- mostrar funciones incompletas
- crear caos visual

---

# ESTRUCTURA DE MÓDULOS

## Módulos previstos

### Demandas
Usuarios publican necesidades/productos buscados.

---

### Oportunidades
Vacantes laborales y perfiles CV.

---

### Servicios
Personas ofrecen habilidades o changas.

---

### Viajes
Compartir viajes y gastos.

---

### Productos
Catálogos locales y marketplace.

---

### Miniwebs
Presencia digital simple para comercios.

---

# IMPORTANTE:
Cada módulo debe sentirse:
- integrado
- coherente
- nativo

Pero NO necesariamente visible todo junto.

---

# UX PRINCIPAL

## Lokal debe tener:
- una entrada unificada
- una identidad visual coherente
- navegación modular

Pero permitir:
- entrar “en modo”

Ejemplo:
- modo trabajo
- modo explorar ciudad
- modo servicios
- modo viajes
- modo tiendas

La interfaz puede adaptarse según contexto.

---

# EL MAPA COMO NÚCLEO

El mapa es uno de los activos más importantes del ecosistema.

Porque unifica:
- tiendas
- oportunidades
- personas
- servicios
- viajes
- demandas
- actividad local

Debe poder filtrar visualmente:
- vacantes
- personas con habilidades
- tiendas
- productos
- changas
- viajes
- servicios

El mapa NO es decorativo.
Es infraestructura principal.

---

# LOKAL OPORTUNIDADES

Actualmente puede mantenerse separado visualmente.

PERO:
- debe alinearse con la arquitectura central
- debe compartir lógica
- debe compartir identidad
- debe prepararse para futura integración

NO debe construirse como producto aislado.

---

# DECISIÓN ESTRATÉGICA

## NO fusionar todo visualmente todavía.

Pero SÍ:
- preparar Lokal original como núcleo modular
- diseñar estructuras reutilizables
- compartir componentes
- compartir sistema de usuarios
- compartir diseño
- compartir lógica

---

# PRIORIDAD TÉCNICA

Evitar:
- duplicar código
- duplicar perfiles
- duplicar autenticación
- duplicar estadísticas
- duplicar sistemas de estado
- duplicar bugs

---

# DIRECCIÓN DE DESARROLLO

Toda decisión debe priorizar:

1. modularidad
2. reutilización
3. escalabilidad
4. simplicidad visual
5. flexibilidad futura
6. bajo mantenimiento
7. consistencia UX/UI

---

# REGLAS IMPORTANTES PARA FUTURAS MODIFICACIONES

## NO romper funciones existentes.

Las funciones actuales estables tienen prioridad.

Se puede:
- reorganizar
- mover
- reestructurar visualmente
- mejorar flujo
- mejorar navegación
- abstraer componentes

Pero evitando romper:
- lógica estable
- integraciones funcionales
- experiencias ya sólidas

---

# COMPONENTIZACIÓN

Toda pantalla importante debe separarse en:
- componentes reutilizables
- bloques independientes
- estados desacoplados

Ejemplo:
- cards
- filtros
- mapa
- navegación
- paneles
- perfiles
- stats
- modales
- formularios

TODO debe poder reutilizarse entre módulos.

---

# SISTEMA DE DATOS

Diseñar pensando desde ahora en:

## Usuario
- actividad
- historial
- reputación
- skills
- CV
- demandas
- aplicaciones
- favoritos

---

## Tienda
- visitas
- interacciones
- productos
- postulaciones
- métricas
- engagement
- rendimiento

---

# ESTADÍSTICAS

Lokal debe crecer hacia dashboards simples.

## Para usuarios:
- vistas de perfil
- aplicaciones enviadas
- interacciones
- alcance

---

## Para tiendas:
- métricas de productos
- métricas de búsquedas laborales
- interacción con demandas
- clics
- visualizaciones
- conversión

---

# FILOSOFÍA DE UI/UX

Lokal debe sentirse:
- rápido
- humano
- local
- moderno
- simple
- modular
- vivo

NO corporativo frío.
NO complejo.
NO saturado.

---

# EXPERIENCIA VISUAL

Priorizar:
- claridad
- jerarquía visual
- foco contextual
- mapas útiles
- filtros intuitivos
- acciones rápidas
- onboarding simple

---

# EL CV EN LOKAL

El CV NO debe ser:
- un PDF muerto

Debe ser:
- un perfil vivo
- habilidades
- experiencia
- portfolio
- disponibilidad
- reputación
- intereses
- actividad

Y debe conectar:
- empleo formal
- changas
- colaboraciones
- servicios
- oportunidades temporales

---

# VISIÓN A FUTURO

Lokal puede evolucionar hacia:

- infraestructura digital local
- red económica/social local
- hub de oportunidades
- ecosistema de actividad urbana
- plataforma de interacción ciudadana/comercial

---

# FILOSOFÍA FINAL

El centro de Lokal NO son:
- las tiendas
- los productos
- los CVs
- las vacantes

El centro son:
> las interacciones locales.

Todo debe diseñarse alrededor de eso.

---

# DIRECTIVA PARA FUTURAS ITERACIONES

Al modificar Lokal:
- pensar modular
- evitar duplicación
- reutilizar componentes
- priorizar escalabilidad
- mantener coherencia visual
- conservar simplicidad
- proteger funciones existentes
- preparar infraestructura para futuros módulos

Toda nueva función debe preguntarse:

## “Esto fortalece el ecosistema local compartido?”

Si la respuesta es sí:
probablemente pertenece a Lokal.
