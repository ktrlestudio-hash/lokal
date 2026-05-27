/**
 * Contacto — WhatsApp, Instagram, teléfono, email, website
 * variant: 'minimal' | 'cards' | 'bar'
 *
 * minimal → lista de links simple
 * cards   → cada contacto en una card con ícono grande
 * bar     → barra horizontal sticky en el fondo
 */
import React from 'react';
import { Phone, Instagram, MessageCircle, Globe, Mail } from 'lucide-react';
import { buildWhatsAppUrl } from '../utils.js';
import { FONT, RADIUS, SHADOW, TRANSITION } from '../tokens.js';

const F = { fontFamily: FONT.family };

const CONTACT_NAMES = {
  wa:    'WhatsApp',
  ig:    'Instagram',
  tel:   'Teléfono',
  email: 'Email',
  web:   'Sitio web',
};

function buildLinks(tienda, cart, note) {
  const links = [];
  const wa = buildWhatsAppUrl(tienda, cart, note);
  if (wa) links.push({ href: wa, Icon: MessageCircle, label: 'WhatsApp', color: '#25d366', key: 'wa' });
  if (tienda.instagram) links.push({ href: `https://instagram.com/${tienda.instagram.replace('@','')}`, Icon: Instagram, label: `@${tienda.instagram.replace('@','')}`, color: '#e1306c', key: 'ig' });
  if (tienda.telefono) links.push({ href: `tel:${tienda.telefono}`, Icon: Phone, label: tienda.telefono, color: 'var(--tp-primary)', key: 'tel' });
  if (tienda.emailContacto) links.push({ href: `mailto:${tienda.emailContacto}`, Icon: Mail, label: tienda.emailContacto, color: 'var(--tp-primary)', key: 'email' });
  if (tienda.website) links.push({ href: tienda.website, Icon: Globe, label: 'Sitio web', color: 'var(--tp-primary)', key: 'web' });
  return links;
}

export function Contacto({ tienda, variant = 'minimal', cart = [], note = '' }) {
  const links = buildLinks(tienda, cart, note);
  if (!links.length) return null;

  if (variant === 'minimal') return (
    <section style={{ padding: '2rem 1.25rem' }}>
      <h2 style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.black, color: 'var(--tp-text)', margin: '0 0 1rem', ...F }}>Contacto</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {links.map(({ href, Icon, label, color, key }) => (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--tp-surface)', border: '1px solid var(--tp-border)', borderRadius: RADIUS.lg, textDecoration: 'none', transition: TRANSITION.fast, boxShadow: SHADOW.sm }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={19} style={{ color }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, color: 'var(--tp-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', ...F }}>{CONTACT_NAMES[key]}</p>
              <p style={{ margin: '1px 0 0', fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold, color: 'var(--tp-text)', ...F, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );

  if (variant === 'cards') return (
    <section style={{ padding: '2rem 1.25rem' }}>
      <h2 style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.black, color: 'var(--tp-text)', margin: '0 0 1rem', ...F }}>Contacto</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
        {links.map(({ href, Icon, label, color, key, sublabel }) => (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--tp-surface)', border: '1px solid var(--tp-border)', borderRadius: RADIUS.lg, textDecoration: 'none', transition: TRANSITION.fast, boxShadow: SHADOW.sm, minWidth: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={19} style={{ color }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, color: 'var(--tp-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', ...F }}>{CONTACT_NAMES[key]}</p>
              <p style={{ margin: '1px 0 0', fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold, color: 'var(--tp-text)', ...F, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );

  if (variant === 'bar') return (
    <div style={{ position: 'sticky', bottom: 0, zIndex: 100, background: 'var(--tp-surface)', borderTop: '1px solid var(--tp-border)', padding: '10px 1rem', display: 'flex', gap: 8, boxShadow: '0 -4px 20px rgba(0,0,0,.08)' }}>
      {links.slice(0, 3).map(({ href, Icon, label, color, key }, i) => (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: RADIUS.md, border: 'none', textDecoration: 'none', fontWeight: FONT.weight.bold, fontSize: FONT.size.sm, transition: TRANSITION.fast, ...F,
            ...(i === 0 ? { background: 'var(--tp-primary)', color: 'var(--tp-on-primary)' } : { background: 'var(--tp-surface2)', color: 'var(--tp-text)' }),
          }}>
          <Icon size={15} />
          {label.length > 12 ? label.slice(0, 10) + '…' : label}
        </a>
      ))}
    </div>
  );

  return null;
}
