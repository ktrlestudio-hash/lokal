import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, X, Loader, Receipt, MessageCircle, Check } from 'lucide-react';
import { API_URL } from '../../config';
import { DEFAULT_PRICING_CONFIG } from '../../hooks';

// ══════════════════════════════════════════════════════════
// COMPONENTE: Modal de Configuracion
// ══════════════════════════════════════════════════════════
const ConfigModal = ({ onClose, showToast, embedded = false }) => {
  // Usar constantes centralizadas de usePricing
  const [config, setConfig] = useState({
    pricing: DEFAULT_PRICING_CONFIG,
    payment: {
      cvu: '',
      alias: '',
      phone: ''
    },
    messages: {
      customerMessage: 'Gracias por tu compra. Te enviaremos tus fotos en breve.'
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar configuracion al montar
  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const response = await fetch(`${API_URL}/config`);
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error('[ConfigModal] Error cargando config:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Error guardando configuracion');

      showToast('Configuracion guardada', 'success');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      console.error('[ConfigModal] Error:', error);
      showToast('Error al guardar configuracion', 'error');
    } finally {
      setSaving(false);
    }
  }

  const innerCard = (
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      onClick={(e) => e.stopPropagation()}
      style={{
        background: '#1a1a1a',
        borderRadius: '16px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: 'none',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        marginTop: embedded ? 0 : '40px',
      }}
    >
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings size={24} color="#a855f7" />
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', margin: 0 }}>
              Configuracion
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#999';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <Loader size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              Cargando configuracion...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Seccion: Precios */}
              <div>
                <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={18} color="#a855f7" />
                  Precios
                </h3>

                {/* Precio por defecto */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: '#999', fontSize: '14px', marginBottom: '8px' }}>
                    Precio por defecto por foto
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#666',
                      fontSize: '15px'
                    }}>$</span>
                    <input
                      type="number"
                      value={config.pricing.defaultPrice}
                      onChange={(e) => setConfig({
                        ...config,
                        pricing: { ...config.pricing, defaultPrice: parseFloat(e.target.value) || 0 }
                      })}
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 32px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                        // Auto-scroll al input cuando se enfoca (para movil)
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                    />
                  </div>
                  <p style={{ color: '#666', fontSize: '12px', marginTop: '6px' }}>
                    Este precio se usara cuando una sesion no tenga precio personalizado
                  </p>
                </div>

                {/* Descuentos por cantidad */}
                <div>
                  <label style={{ display: 'block', color: '#999', fontSize: '14px', marginBottom: '8px' }}>
                    Descuentos por cantidad
                  </label>
                  <p style={{ color: '#666', fontSize: '12px', marginBottom: '12px', marginTop: 0 }}>
                    Ejemplo: Si pones 5 fotos con 10% descuento, se aplicara a compras de 5-9 fotos
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {config.pricing.discounts.map((discount, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
                          <span style={{ color: '#999', fontSize: '14px', minWidth: '80px' }}>Desde</span>
                          <input
                            type="number"
                            value={discount.qty}
                            onChange={(e) => {
                              const newDiscounts = [...config.pricing.discounts];
                              newDiscounts[index].qty = parseInt(e.target.value) || 0;
                              setConfig({
                                ...config,
                                pricing: { ...config.pricing, discounts: newDiscounts }
                              });
                            }}
                            min="1"
                            onFocus={(e) => {
                              // Auto-scroll al input cuando se enfoca (para movil)
                              setTimeout(() => {
                                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 300);
                            }}
                            style={{
                              width: '70px',
                              padding: '8px 12px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '6px',
                              color: 'white',
                              fontSize: '15px',
                              fontWeight: '600',
                              textAlign: 'center',
                              outline: 'none'
                            }}
                          />
                          <span style={{ color: '#999', fontSize: '14px' }}>fotos</span>
                        </div>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.05)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            value={discount.discount}
                            onChange={(e) => {
                              const newDiscounts = [...config.pricing.discounts];
                              newDiscounts[index].discount = parseFloat(e.target.value) || 0;
                              setConfig({
                                ...config,
                                pricing: { ...config.pricing, discounts: newDiscounts }
                              });
                            }}
                            min="0"
                            max="100"
                            onFocus={(e) => {
                              // Auto-scroll al input cuando se enfoca (para movil)
                              setTimeout(() => {
                                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 300);
                            }}
                            style={{
                              width: '65px',
                              padding: '8px 12px',
                              background: 'rgba(34, 197, 94, 0.15)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              borderRadius: '6px',
                              color: '#22c55e',
                              fontSize: '15px',
                              fontWeight: '700',
                              textAlign: 'center',
                              outline: 'none'
                            }}
                          />
                          <span style={{ color: '#22c55e', fontSize: '15px', fontWeight: '600' }}>% off</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seccion: Datos de Pago */}
              <div>
                <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  Datos de Pago
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* CVU/CBU */}
                  <div>
                    <label style={{ display: 'block', color: '#999', fontSize: '14px', marginBottom: '8px' }}>
                      CVU / CBU
                    </label>
                    <input
                      type="text"
                      value={config.payment.cvu}
                      onChange={(e) => setConfig({
                        ...config,
                        payment: { ...config.payment, cvu: e.target.value }
                      })}
                      placeholder="0000003100010910094321"
                      onFocus={(e) => {
                        // Auto-scroll al input cuando se enfoca (para movil)
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  {/* Alias */}
                  <div>
                    <label style={{ display: 'block', color: '#999', fontSize: '14px', marginBottom: '8px' }}>
                      Alias (opcional)
                    </label>
                    <input
                      type="text"
                      value={config.payment.alias}
                      onChange={(e) => setConfig({
                        ...config,
                        payment: { ...config.payment, alias: e.target.value }
                      })}
                      placeholder="mi.alias.mp"
                      onFocus={(e) => {
                        // Auto-scroll al input cuando se enfoca (para movil)
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Telefono */}
                  <div>
                    <label style={{ display: 'block', color: '#999', fontSize: '14px', marginBottom: '8px' }}>
                      Telefono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={config.payment.phone}
                      onChange={(e) => setConfig({
                        ...config,
                        payment: { ...config.payment, phone: e.target.value }
                      })}
                      placeholder="+54 9 11 1234-5678"
                      onFocus={(e) => {
                        // Auto-scroll al input cuando se enfoca (para movil)
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Seccion: Mensajes */}
              <div>
                <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageCircle size={18} color="#a855f7" />
                  Mensajes
                </h3>

                <div>
                  <label style={{ display: 'block', color: '#999', fontSize: '14px', marginBottom: '8px' }}>
                    Mensaje para clientes
                  </label>
                  <textarea
                    value={config.messages.customerMessage}
                    onChange={(e) => setConfig({
                      ...config,
                      messages: { ...config.messages, customerMessage: e.target.value }
                    })}
                    placeholder="Mensaje que veran tus clientes despues de realizar un pedido"
                    rows={4}
                    onFocus={(e) => {
                      // Auto-scroll al textarea cuando se enfoca (para movil)
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 300);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '15px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 32px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#999',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px 32px',
              background: saving ? 'rgba(168, 85, 247, 0.5)' : 'linear-gradient(135deg, #a855f7, #9333ea)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {saving ? (
              <>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Guardando...
              </>
            ) : (
              <>
                <Check size={16} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
    </motion.div>
  );

  if (embedded) return innerCard;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
        paddingBottom: '100px',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {innerCard}
    </motion.div>
  );
};

export default ConfigModal;
