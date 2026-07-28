import React, { useEffect } from 'react';
import { ArrowLeft, Store, Shield, FileText, ShoppingBag } from 'lucide-react';
import { LogoFull, KtrlMark } from './Brand';

// ─── LegalLayout — wrapper reutilizable para todas las páginas legales ────────
// actualizado: la fecha estaba escrita a mano en el layout, así que las
// tres páginas decían lo mismo aunque se editara sólo una. Ahora la declara
// cada documento; si no la pasa, no se muestra la línea.
function LegalLayout({ title, subtitle, icon: Icon, children, onBack, actualizado }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // lok-app-surface: mismo tratamiento táctil que landing y login (sin
  // selección de texto ni menú contextual en los controles); el texto legal
  // sí se puede seleccionar, ver .lok-selectable más abajo.
  //
  // El fondo va por token y no con la clase sa-page-bg: esa vive dentro de
  // un <style> de StoreApp.jsx, que no se monta en estas páginas — el fondo
  // quedaba oscuro en modo claro y el título salía negro sobre negro.
  return (
    <div className="lok-app-surface min-h-screen text-ink"
      style={{ background: 'rgb(var(--surface-dim, 245 245 245))' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-surface-card/85 backdrop-blur border-b border-slate-100 dark:border-white/8">
        <button
          onClick={onBack}
          className="lok-tap flex items-center gap-2 text-ink-dim hover:text-brand transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <LogoFull size={20} />
        <div className="w-16" /> {/* spacer */}
      </nav>

      {/* Hero del documento */}
      <div className="border-b border-slate-100 dark:border-white/8 px-6 py-14 text-center"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgb(var(--brand, 0 184 217) / 0.09), transparent)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgb(var(--brand, 0 184 217) / 0.14)' }}>
          {Icon && <Icon className="w-7 h-7" style={{ color: 'var(--brand-hex, #00B8D9)' }} />}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-3">{title}</h1>
        {subtitle && <p className="text-ink-dim text-base max-w-xl mx-auto">{subtitle}</p>}
        {actualizado && <p className="text-ink-dim text-xs mt-4">Última actualización: {actualizado}</p>}
      </div>

      {/* Contenido — lok-selectable: es texto para leer y citar, así que
          acá sí conviene poder seleccionarlo y copiarlo. */}
      <div className="lok-selectable max-w-3xl mx-auto px-6 py-14 space-y-10">
        {children}
      </div>

      {/* Footer — mismo que el de la landing (logo · links · firma en una
          fila), con el copyright sumado. Antes era una pila centrada con el
          copyright arriba, la firma en el medio y los links al final, sin
          jerarquía clara y sin parecerse al resto del sitio. */}
      <footer style={{ borderTop: '1px solid rgb(var(--brand, 0 184 217) / 0.12)' }}>
        <div className="max-w-5xl mx-auto px-5 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col items-center sm:items-start gap-1.5">
            <LogoFull size={22} />
            <p className="text-[10px]" style={{ color: 'var(--text-secondary, #999)' }}>
              © {new Date().getFullYear()} LOKAL. Todos los derechos reservados.
            </p>
          </div>
          <nav className="flex items-center gap-5 text-xs font-semibold" style={{ color: 'var(--text-secondary, #999)' }}>
            <button onClick={() => navigateLegal('terminos')} className="lok-tap hover:text-brand transition-colors">Términos</button>
            <button onClick={() => navigateLegal('privacidad')} className="lok-tap hover:text-brand transition-colors">Privacidad</button>
            <button onClick={() => navigateLegal('comercios')} className="lok-tap hover:text-brand transition-colors">Comercios</button>
          </nav>
          <a href="https://instagram.com/katriel.martinez" target="_blank" rel="noopener noreferrer"
            className="lok-tap inline-flex items-center gap-1.5 text-ink-dim/50 hover:text-ink-dim/80 transition-colors">
            <span className="text-[10px] font-semibold">Creado por</span>
            <KtrlMark style={{ height: 11, color: 'currentColor' }} />
          </a>
        </div>
      </footer>
    </div>
  );
}

// Función global para navegar entre páginas legales (se pisa desde el componente padre)
let navigateLegal = () => {};

// ─── Sección de contenido ─────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-xl font-black mb-4 text-ink border-b border-slate-100 dark:border-white/8 pb-3">{title}</h2>
      <div className="space-y-3 text-ink-dim text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Highlight({ children }) {
  return (
    <div className="bg-primary/8 border border-primary/20 rounded-2xl px-5 py-4 text-primary-light dark:text-primary text-sm leading-relaxed">
      {children}
    </div>
  );
}

function Warning({ children }) {
  return (
    <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl px-5 py-4 text-amber-200 text-sm leading-relaxed">
      {children}
    </div>
  );
}

function List({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="text-emerald-500 font-bold mt-0.5 shrink-0">—</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TÉRMINOS Y CONDICIONES
// ═══════════════════════════════════════════════════════════════════════════════
function TerminosPage({ onBack }) {
  return (
    <LegalLayout
      title="Términos y Condiciones"
      subtitle="Lo que necesitás saber antes de usar Lokal. Sin letra chica."
      icon={FileText}
      actualizado="abril 2026"
      onBack={onBack}
    >
      <Highlight>
        <strong>Lo más importante primero:</strong> Lokal es una plataforma de intermediación digital. No somos vendedores, no intervenimos en las transacciones y no garantizamos resultados comerciales. Conectamos personas que buscan con comercios que venden — el resto lo resuelven entre ellos.
      </Highlight>

      <Section title="1. Qué es Lokal">
        <p>
          Lokal es un servicio digital que te permite explorar el catálogo de comercios de comida locales y hacer tu pedido, ya sea a través de la plataforma o por WhatsApp con el comercio. Actuamos exclusivamente como intermediador: facilitamos el contacto pero no somos parte de ningún acuerdo comercial entre usuarios y comercios.
        </p>
        <p>
          No somos un marketplace, no procesamos pagos entre compradores y vendedores, no almacenamos inventario y no tenemos relación con los productos que los comercios ofrecen.
        </p>
      </Section>

      <Section title="2. Quiénes pueden usar la plataforma">
        <List items={[
          'Cualquier persona mayor de 18 años con cuenta de Google puede registrarse como usuario.',
          'Los comercios deben completar el proceso de registro y abonar la suscripción correspondiente.',
          'Al usar Lokal, aceptás estos términos en su totalidad.',
          'Si usás la plataforma en nombre de un negocio, también aceptás los términos en nombre de ese negocio.',
        ]} />
      </Section>

      <Section title="3. Qué podés hacer en Lokal">
        <p><strong className="text-ink">Como usuario:</strong> explorar el catálogo de comercios, armar tu pedido, consultar el historial de tus pedidos anteriores y comunicarte con comercios a través de la plataforma.</p>
        <p><strong className="text-ink">Como comercio:</strong> recibir pedidos de clientes, gestionar tu catálogo y perfil público, y medir tu alcance mediante estadísticas básicas.</p>
      </Section>

      <Section title="4. Lo que está prohibido">
        <List items={[
          'Publicar información falsa, engañosa o que induzca a error.',
          'Utilizar la plataforma para fines ilegales o contrarios a la moral.',
          'Hacer spam, automatizar interacciones o manipular el sistema.',
          'Publicar contenido discriminatorio, violento o que vulnere derechos de terceros.',
          'Intentar acceder a datos de otros usuarios sin autorización.',
          'Revender acceso a la plataforma o compartir credenciales de cuenta.',
        ]} />
      </Section>

      <Section title="5. Limitación de responsabilidad">
        <Warning>
          Lokal no garantiza la veracidad de la información publicada por usuarios o comercios, ni la satisfacción en ninguna transacción. La decisión de comprar, contratar o acordar con un comercio es exclusivamente tuya.
        </Warning>
        <p>
          En ningún caso Lokal será responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso de la plataforma, incluyendo pero no limitado a: pérdidas económicas, incumplimiento de acuerdos comerciales privados, o productos y servicios que no cumplan expectativas.
        </p>
        <p>
          El servicio se ofrece "tal como está" y puede presentar interrupciones ocasionales por mantenimiento o causas fuera de nuestro control.
        </p>
      </Section>

      <Section title="6. Contenido publicado por los usuarios">
        <p>
          El contenido que publicás en Lokal (texto, imágenes, videos) sigue siendo tuyo. Sin embargo, al publicarlo nos otorgás una licencia no exclusiva para mostrarlo dentro de la plataforma a otros usuarios y comercios.
        </p>
        <p>
          Nos reservamos el derecho de moderar, editar o eliminar cualquier contenido que viole estos términos, sin necesidad de previo aviso.
        </p>
      </Section>

      <Section title="7. Cuentas y acceso">
        <List items={[
          'Sos responsable de mantener la seguridad de tu cuenta.',
          'Si detectamos uso no autorizado, podemos suspender el acceso temporalmente.',
          'Podemos cerrar cuentas que violen estos términos de manera reiterada o grave.',
          'Podés solicitar la eliminación de tu cuenta en cualquier momento escribiendo a hola@lokal.com.ar.',
        ]} />
      </Section>

      <Section title="8. Modificaciones">
        <p>
          Podemos actualizar estos términos cuando sea necesario. Si los cambios son significativos, te lo vamos a comunicar. El uso continuado de la plataforma después de cualquier modificación implica aceptación de los nuevos términos.
        </p>
      </Section>

      <Section title="9. Ley aplicable">
        <p>
          Estos términos se rigen por las leyes de la República Argentina. Para cualquier disputa, las partes se someten a la jurisdicción de los tribunales ordinarios competentes.
        </p>
        <p>
          Si tenés dudas o consultas, escribinos a <strong className="text-ink">hola@lokal.com.ar</strong>.
        </p>
      </Section>
    </LegalLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// POLÍTICA DE PRIVACIDAD
// ═══════════════════════════════════════════════════════════════════════════════
function PrivacidadPage({ onBack }) {
  return (
    <LegalLayout
      title="Política de Privacidad"
      subtitle="Tus datos son tuyos. Te explicamos qué usamos y para qué."
      icon={Shield}
      actualizado="abril 2026"
      onBack={onBack}
    >
      <Highlight>
        Lokal cumple con la Ley 25.326 de Protección de Datos Personales de la República Argentina. Nunca vendemos tus datos. Solo los usamos para que la plataforma funcione mejor para vos.
      </Highlight>

      <Section title="1. Qué datos recolectamos">
        <p><strong className="text-ink">Datos de cuenta (vía Google):</strong> nombre, dirección de email y foto de perfil. No almacenamos contraseñas.</p>
        <p><strong className="text-ink">Datos de uso:</strong> pedidos que realizás, historial de interacciones dentro de la plataforma.</p>
        <p><strong className="text-ink">Datos técnicos:</strong> dirección IP, tipo de dispositivo y navegador, para seguridad y funcionamiento del servicio.</p>
        <p><strong className="text-ink">Preferencias locales:</strong> guardamos en tu dispositivo datos como tema visual, vista elegida del mapa y ubicaciones guardadas para mejorar tu experiencia. Esa información no se comparte automáticamente con terceros.</p>
        <p><strong className="text-ink">Ubicación:</strong> si usás funciones de mapa o geolocalización, pedimos permiso al navegador y usamos esa información para mostrarte comercios o resultados cercanos.</p>
        <p><strong className="text-ink">Imágenes y archivos:</strong> fotos o videos que subís voluntariamente a tu perfil o pedidos.</p>
      </Section>

      <Section title="2. Para qué usamos tus datos">
        <List items={[
          'Identificarte como usuario y mantener tu sesión activa.',
          'Mostrarte comercios y productos relevantes según tu actividad.',
          'Mejorar el funcionamiento y la experiencia de la plataforma.',
          'Comunicarnos con vos si hay algo importante sobre tu cuenta.',
          'Detectar y prevenir usos fraudulentos o abusivos.',
        ]} />
        <p className="mt-3">
          <strong className="text-ink">No usamos tus datos para:</strong> publicidad de terceros, venta a otras empresas, ni perfilado comercial.
        </p>
      </Section>

      <Section title="3. Con quién compartimos tus datos">
        <p>
          No compartimos datos personales identificables con terceros, salvo en los siguientes casos:
        </p>
        <List items={[
           'Proveedores de infraestructura técnica necesarios para el funcionamiento (Firebase de Google para autenticación, Cloudflare para almacenamiento de archivos y Mercado Pago para procesar pagos de suscripciones de comercios). Estos servicios tienen sus propias políticas de privacidad.',
          'Cuando la ley lo requiera expresamente, por orden judicial u obligación legal.',
          'En caso de fusión o adquisición de Lokal, con aviso previo a los usuarios.',
        ]} />
      </Section>

      <Section title="4. Tus derechos (Ley 25.326)">
        <p>Como titular de tus datos tenés derecho a:</p>
        <List items={[
          'Acceder a los datos que tenemos sobre vos.',
          'Solicitar la rectificación de datos incorrectos.',
          'Solicitar la eliminación de tus datos ("derecho al olvido").',
          'Oponerte al tratamiento de tus datos en ciertos casos.',
        ]} />
        <p className="mt-3">
          Para ejercer cualquiera de estos derechos, escribinos a <strong className="text-ink">hola@lokal.com.ar</strong> con el asunto "Datos personales". Respondemos en un plazo máximo de 10 días hábiles.
        </p>
        <p>
          El organismo de control en Argentina es la <strong className="text-ink">Agencia de Acceso a la Información Pública (AAIP)</strong>, ante quien podés presentar una denuncia si considerás que tus derechos no fueron respetados.
        </p>
      </Section>

      <Section title="5. Cookies y tecnologías similares">
        <p>
          Usamos cookies estrictamente necesarias para el funcionamiento de la sesión. También usamos almacenamiento local del navegador para preferencias de usuario, como el modo oscuro/claro y configuraciones del mapa. No usamos cookies de seguimiento ni publicidad.
        </p>
        <p>
          Firebase Authentication (Google) puede usar cookies propias para mantener tu sesión. Podés consultar la política de privacidad de Google para más detalle.
        </p>
      </Section>

      <Section title="6. Retención de datos">
        <p>
          Tus datos se conservan mientras tu cuenta esté activa. Si solicitás la eliminación de tu cuenta, borramos tus datos personales en un plazo máximo de 30 días, salvo obligación legal de conservarlos por más tiempo.
        </p>
        <p>
          Los pedidos e interacciones eliminadas pueden conservarse de manera anonimizada para fines estadísticos.
        </p>
      </Section>

      <Section title="7. Seguridad">
        <p>
          Implementamos medidas técnicas razonables para proteger tus datos: conexiones HTTPS, almacenamiento seguro en proveedores certificados y acceso restringido. Sin embargo, ningún sistema es 100% seguro — si detectás algo sospechoso, avisanos.
        </p>
      </Section>

      <Section title="8. Contacto">
        <p>
          Responsable del tratamiento de datos: <strong className="text-ink">Lokal</strong><br />
          Correo de contacto: <strong className="text-ink">hola@lokal.com.ar</strong>
        </p>
        <p>
          Si operás pagos con una integración activa, Mercado Pago actúa como proveedor independiente de servicios de pago y procesa los datos estrictamente necesarios para cobrar la suscripción correspondiente.
        </p>
      </Section>
    </LegalLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONDICIONES PARA COMERCIOS
// ═══════════════════════════════════════════════════════════════════════════════
function ComerciosPage({ onBack }) {
  return (
    <LegalLayout
      title="Condiciones para Comercios"
      subtitle="Todo lo que necesitás saber como tienda registrada en Lokal."
      icon={ShoppingBag}
      actualizado="abril 2026"
      onBack={onBack}
    >
      <Highlight>
        Al registrar tu comercio en Lokal aceptás estas condiciones específicas, que complementan los Términos y Condiciones generales. El punto clave: vos sos responsable de lo que publicás y ofrecés.
      </Highlight>

      <Section title="1. Tu rol en la plataforma">
        <p>
          Como comercio registrado en Lokal, sos un participante independiente. Lokal te da visibilidad y te permite recibir pedidos de clientes, pero <strong className="text-ink">no somos tu empleador, franquiciante ni socio comercial</strong>. Las condiciones de cada venta o acuerdo son responsabilidad tuya.
        </p>
        <Warning>
          Lokal no garantiza ventas, clientes o conversiones. La plataforma es una herramienta de contacto — los resultados dependen de la propuesta de valor de tu negocio.
        </Warning>
      </Section>

      <Section title="2. Responsabilidad sobre el contenido">
        <p>
          Todo lo que publicás en Lokal — mensajes, precios, fotos, videos, descripciones — es tu responsabilidad exclusiva. Eso incluye:
        </p>
        <List items={[
          'Que la información sea veraz y actualizada.',
          'Que los precios sean reales y no engañosos.',
          'Que las imágenes correspondan al producto o servicio que ofrecés.',
          'Que estés en condiciones legales de vender lo que ofrecés.',
          'Cumplir con las normas de defensa del consumidor vigentes (Ley 24.240).',
        ]} />
      </Section>

      <Section title="3. Conductas prohibidas">
        <p>Como comercio, no podés:</p>
        <List items={[
          'Publicar precios falsos o "gancho" que no representen la oferta real.',
          'Ofrecer productos o servicios que no tenés disponibles.',
          'Usar imágenes que no corresponden a tu stock real.',
          'Publicar contenido engañoso que induzca al usuario a un error.',
          'Ofrecer bienes o servicios de procedencia ilegal o ilícita.',
          'Contactar usuarios fuera de la plataforma para evadir el sistema.',
          'Crear múltiples cuentas para manipular el sistema o el feed.',
          'Publicar spam, mensajes masivos o respuestas automatizadas.',
        ]} />
      </Section>

      <Section title="4. Derecho de Lokal a moderar contenido">
        <Warning>
          Lokal puede eliminar, editar o suspender cualquier publicación, respuesta o perfil de comercio que viole estas condiciones, sin necesidad de previo aviso y sin derecho a compensación por parte del comercio afectado.
        </Warning>
        <p>
          Las causas de moderación incluyen —pero no se limitan a—: contenido engañoso, reportes de usuarios, inconsistencias detectadas por el equipo de Lokal, o incumplimiento de la normativa vigente.
        </p>
        <p>
          Si tu cuenta es suspendida por incumplimiento grave, no tenés derecho a devolución del período de suscripción restante.
        </p>
      </Section>

      <Section title="5. Calidad del servicio">
        <p>
          Te pedimos que confirmes pedidos solo cuando realmente podés cubrirlos. Confirmaciones incumplidas o de mala calidad afectan la experiencia de los usuarios y pueden derivar en la suspensión de tu cuenta.
        </p>
        <List items={[
          'Confirmá solo los pedidos que podés preparar y entregar.',
          'Incluí información útil: precio, tiempos de espera, condiciones de entrega.',
          'No uses el chat para publicitar otros productos no relacionados.',
        ]} />
      </Section>

      <Section title="6. Suscripción y acceso">
        <p>
          El acceso al panel de pedidos está condicionado a tener una suscripción activa. Si tu suscripción vence:
        </p>
        <List items={[
          'Tu perfil puede seguir visible para los usuarios.',
          'No podrás recibir ni gestionar nuevos pedidos.',
          'Podés renovar cuando quieras para recuperar el acceso completo.',
        ]} />
        <p>
          Lokal se reserva el derecho de modificar los planes de suscripción con un aviso razonable a los comercios activos.
        </p>
      </Section>

      <Section title="7. Relación con los usuarios">
        <p>
          Los acuerdos que llegás a establecer con usuarios a través de Lokal son contratos privados entre vos y el comprador. Lokal no es parte de esos acuerdos y no tiene responsabilidad sobre su cumplimiento.
        </p>
        <p>
          Si un usuario reporta un problema con tu comercio, podemos ponernos en contacto para escuchar tu versión. En casos de incumplimiento reiterado o grave, podemos suspender tu acceso a la plataforma.
        </p>
      </Section>

      <Section title="8. Aviso legal">
        <p>
          Esta sección complementa los Términos y Condiciones generales. En caso de contradicción, prevalece la interpretación más protectora para los usuarios finales y la plataforma.
        </p>
        <p>
          Consultas o reclamos de comercios: <strong className="text-ink">tiendas@lokal.com.ar</strong>
        </p>
      </Section>
    </LegalLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL — renderiza la página legal correcta
// ═══════════════════════════════════════════════════════════════════════════════
export default function LegalPageView({ page, onNavigate, onBack }) {
  // Expone la función de navegación entre páginas legales al LegalLayout
  navigateLegal = onNavigate;

  if (page === 'terminos')   return <TerminosPage   onBack={onBack} />;
  if (page === 'privacidad') return <PrivacidadPage onBack={onBack} />;
  if (page === 'comercios')  return <ComerciosPage  onBack={onBack} />;
  return null;
}
