import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Link, Check, UserPlus } from 'lucide-react';

/**
 * Modal bottom-sheet para compartir link de invitación de vendedor
 *
 * Props:
 * - seller: objeto del vendedor { trackingCode, name }
 * - onClose: función para cerrar el modal
 * - colors: objeto con colores del tema (opcional)
 */
const SellerShareModal = ({ seller, onClose, colors }) => {
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const setupUrl = `${baseUrl}/?sellerSetup=${seller.trackingCode}`;

  const whatsappMessage = `¡Hola ${seller.name}! 👋\n\nTe invito a unirte como vendedor. Usa este link para configurar tu cuenta:\n\n${setupUrl}\n\nCon tu cuenta podrás ver tus ventas y comisiones.`;

  const handleShareWhatsApp = () => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(setupUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = setupUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: colors?.bgOverlay || 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={{
            background: colors?.bgModal || 'rgba(26, 26, 26, 0.98)',
            border: `1px solid ${colors?.border || 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '24px 24px 0 0',
            padding: '24px',
            width: '100%',
            maxWidth: '500px',
            paddingBottom: 'max(24px, env(safe-area-inset-bottom))'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <div style={{
            width: '40px',
            height: '4px',
            background: colors?.borderHover || 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
            margin: '0 auto 24px'
          }} />

          {/* Header with seller info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserPlus size={20} color="white" />
            </div>
            <div>
              <h3 style={{
                color: colors?.textPrimary || 'white',
                fontSize: '18px',
                fontWeight: '600',
                margin: 0
              }}>
                Invitar a {seller.name}
              </h3>
            </div>
          </div>

          <p style={{
            color: colors?.textSecondary || '#999',
            fontSize: '14px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            Comparte este link para que {seller.name} configure su cuenta
          </p>

          {/* URL Preview */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <p style={{
              color: colors?.textSecondary || '#888',
              fontSize: '11px',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Link de invitación
            </p>
            <p style={{
              color: colors?.textPrimary || '#fff',
              fontSize: '13px',
              margin: 0,
              wordBreak: 'break-all',
              fontFamily: 'monospace'
            }}>
              {setupUrl}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* WhatsApp button */}
            <button
              onClick={handleShareWhatsApp}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '18px 20px',
                background: 'rgba(37, 211, 102, 0.1)',
                border: '1px solid rgba(37, 211, 102, 0.3)',
                borderRadius: '16px',
                color: '#25D366',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(37, 211, 102, 0.15)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(37, 211, 102, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <MessageCircle size={24} />
              <span style={{ flex: 1, textAlign: 'left' }}>Enviar por WhatsApp</span>
            </button>

            {/* Copy link button */}
            <button
              onClick={handleCopyLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '18px 20px',
                background: copied ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                borderRadius: '16px',
                color: copied ? '#10b981' : '#3b82f6',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              {copied ? <Check size={24} /> : <Link size={24} />}
              <span style={{ flex: 1, textAlign: 'left' }}>
                {copied ? '¡Link copiado!' : 'Copiar enlace'}
              </span>
            </button>

            {/* Cancel button */}
            <button
              onClick={onClose}
              style={{
                padding: '16px',
                background: colors?.bgButton || 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${colors?.border || 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '12px',
                color: colors?.textTertiary || '#999',
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                marginTop: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors?.bgButtonHover || 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors?.bgButton || 'rgba(255, 255, 255, 0.05)';
              }}
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SellerShareModal;
