import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingCart,
  Loader,
  Trash2,
  CheckCircle,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
  Check,
  AlertCircle,
  Key,
  Copy,
  MessageCircle
} from 'lucide-react';

// ══════════════════════════════════════════════════════════
// ADMIN ORDER DETAILS (Panel de detalles del pedido para admin)
// ══════════════════════════════════════════════════════════
const AdminOrderDetails = ({ order, onUpdateStatus, onDeleteOrder, showToast, onRejectWithReason }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isProofCollapsed, setIsProofCollapsed] = useState(true); // Colapsado por defecto
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Detectar mobile on resize
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleUpdateStatus = async (newStatus) => {
    try {
      setIsUpdating(true);
      await onUpdateStatus(order.id, newStatus);
    } catch (error) {
      // Error already handled in onUpdateStatus
    } finally {
      setIsUpdating(false);
    }
  };

  const statusConfig = {
    pending: { label: 'Pendiente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', Icon: Clock },
    approved: { label: 'Aprobado', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', Icon: CheckCircle2 },
    rejected: { label: 'Rechazado', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', Icon: XCircle }
  };
  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.Icon;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Estado del pedido */}
      <div style={{
        background: status.bg,
        border: `1px solid ${status.color}40`,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: isMobileView ? 'column' : 'row',
        alignItems: isMobileView ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: isMobileView ? '16px' : '0'
      }}>
        {/* Estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <StatusIcon size={isMobileView ? 20 : 24} style={{ color: status.color }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: isMobileView ? '13px' : '12px', color: '#999' }}>Estado:</span>
            <span style={{ fontSize: isMobileView ? '16px' : '18px', fontWeight: '600', color: status.color }}>{status.label}</span>
          </div>
        </div>

        {/* Botones de accion */}
        <div style={{ display: 'flex', gap: '8px', width: isMobileView ? '100%' : 'auto' }}>
          {order.status !== 'approved' && (
            <button
              onClick={() => handleUpdateStatus('approved')}
              disabled={isUpdating}
              style={{
                flex: isMobileView ? 1 : '0 0 auto',
                padding: isMobileView ? '12px 16px' : '8px 16px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                opacity: isUpdating ? 0.6 : 1,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Check size={16} />
              Aprobar
            </button>
          )}
          {order.status !== 'rejected' && (
            <button
              onClick={() => onRejectWithReason(order)}
              disabled={isUpdating}
              style={{
                flex: isMobileView ? 1 : '0 0 auto',
                padding: isMobileView ? '12px 16px' : '8px 16px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                opacity: isUpdating ? 0.6 : 1,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <X size={16} />
              Rechazar
            </button>
          )}
        </div>
      </div>

      {/* Informacion del cliente */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px'
      }}>
        <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          Informacion del Cliente
        </h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#999' }}>Nombre:</span>
            <span style={{ color: 'white', fontWeight: '600' }}>{order?.customer?.name || '-'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#999' }}>Telefono:</span>
            <span style={{ color: 'white', fontWeight: '600' }}>{order?.customer?.phone || '-'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#999' }}>Fecha:</span>
            <span style={{ color: 'white', fontWeight: '600' }}>
              {new Date(order.createdAt).toLocaleString('es-AR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Detalles del pedido */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px'
      }}>
        <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          Detalles del Pedido
        </h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#999' }}>Fotos:</span>
            <span style={{ color: 'white', fontWeight: '600' }}>{order?.pricing?.quantity || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#999' }}>Precio por foto:</span>
            <span style={{ color: 'white', fontWeight: '600' }}>${(order?.pricing?.pricePerPhoto || 0).toLocaleString()}</span>
          </div>
          {(order?.pricing?.discount || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#10b981' }}>Descuento ({order?.pricing?.discount || 0}%):</span>
              <span style={{ color: '#10b981', fontWeight: '600' }}>-${(order?.pricing?.totalDiscount || 0).toLocaleString()}</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '18px'
          }}>
            <span style={{ fontWeight: '600' }}>Total:</span>
            <span style={{ fontWeight: '700', color: '#10b981' }}>${(order?.pricing?.total || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Comprobante de pago */}
      {order.paymentProof ? (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: 0 }}>
              Comprobante de Pago
            </h3>
            <button
              onClick={() => setIsProofCollapsed(!isProofCollapsed)}
              style={{
                width: '32px',
                height: '32px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#3b82f6',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
              }}
            >
              {isProofCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
          {!isProofCollapsed && (
            <img
              src={order.paymentProof}
              alt="Comprobante"
              style={{
                width: '100%',
                maxWidth: '400px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease'
              }}
            />
          )}
        </div>
      ) : (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          <AlertCircle size={20} style={{ color: '#f59e0b', marginBottom: '8px' }} />
          <p style={{ color: '#f59e0b', margin: 0, fontSize: '14px' }}>
            El cliente aun no ha subido el comprobante de pago
          </p>
        </div>
      )}

      {/* Token de Acceso (solo si esta aprobado) */}
      {order.status === 'approved' && order.accessToken && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))',
          border: '2px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px'
        }}>
          <h3 style={{ color: '#3b82f6', fontSize: '16px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} />
            Token de Acceso Generado
          </h3>
          <p style={{ color: '#999', fontSize: '13px', marginBottom: '12px', lineHeight: '1.5' }}>
            Comparte este token con el cliente para que pueda acceder a sus fotos desde cualquier dispositivo
          </p>

          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px',
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#3b82f6',
            textAlign: 'center',
            userSelect: 'all',
            cursor: 'pointer'
          }}
          onClick={() => {
            navigator.clipboard.writeText(order.accessToken);
            showToast('Token copiado al portapapeles', 'success');
          }}
          >
            {order.accessToken}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(order.accessToken);
                showToast('Token copiado al portapapeles', 'success');
              }}
              style={{
                flex: 1,
                background: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Copy size={16} />
              Copiar Token
            </button>

            {order?.customer?.phone && (
              <button
                onClick={() => {
                  const phone = order?.customer?.phone;
                  const sessionName = order.sessionSlug || 'tu-sesion';
                  const token = order.accessToken;
                  const message = encodeURIComponent(
                    `¡Hola!\n\n` +
                    `Tu pedido ha sido *APROBADO*\n\n` +
                    `Ya puedes acceder a tus fotos desde cualquier dispositivo usando este token:\n\n` +
                    `*${token}*\n\n` +
                    `*Como usar el token:*\n` +
                    `1. Abre ${window.location.origin}/?session=${sessionName}\n` +
                    `2. Toca el boton 'Mis Pedidos' (arriba a la izquierda)\n` +
                    `3. Ingresa el token en el campo 'Tienes un token de acceso?'\n` +
                    `4. ¡Listo! Podras descargar y compartir tus fotos sin limite\n\n` +
                    `Gracias por tu compra!`
                  );
                  window.open('https://wa.me/' + phone + '?text=' + message, '_blank');
                }}
                style={{
                  flex: 1,
                  background: '#25D366',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <MessageCircle size={16} />
                Enviar por WhatsApp
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lista de fotos */}
      {order.photos && order.photos.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            Fotos del Pedido ({order.photos.length})
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '12px'
          }}>
            {order.photos.map((photo, index) => (
              <div
                key={photo.id || index}
                style={{
                  position: 'relative',
                  paddingBottom: '100%',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: 'rgba(0, 0, 0, 0.3)'
                }}
              >
                <img
                  src={photo.url_medium}
                  alt={photo.filename || photo.nombre_archivo}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />

                {/* Nombre del archivo */}
                {(photo.filename || photo.nombre_archivo) && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent)',
                    backdropFilter: 'blur(8px)',
                    padding: '8px 6px 4px 6px',
                    fontSize: '9px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    borderBottomLeftRadius: '8px',
                    borderBottomRightRadius: '8px'
                  }}>
                    {photo.filename || photo.nombre_archivo}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boton de eliminar pedido */}
      <div style={{
        background: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '24px'
      }}>
        <h3 style={{ color: '#ef4444', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
          Zona de Peligro
        </h3>
        <p style={{ color: '#999', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
          Eliminar este pedido es permanente y no se puede deshacer. El cliente perdera acceso a sus fotos.
        </p>
        <button
          onClick={() => onDeleteOrder(order)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '8px',
            padding: '10px 16px',
            color: '#ef4444',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          }}
        >
          <Trash2 size={16} />
          <span>Eliminar Pedido</span>
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// ORDERS MODAL (Modal de gestion de pedidos para admin)
// ══════════════════════════════════════════════════════════
const OrdersModal = ({
  showOrdersModal,
  setShowOrdersModal,
  orders,
  loadingOrders,
  selectedOrderForAdmin,
  setSelectedOrderForAdmin,
  filteredSessionName,
  setFilteredSessionName,
  updateOrderStatus,
  setOrderToDelete,
  setOrderToReject,
  setShowDeleteAllOrdersModal,
  showToast
}) => {
  if (!showOrdersModal) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={() => {
          setShowOrdersModal(false);
          setFilteredSessionName(null);
        }}
      >
        <div
          style={{
            background: 'rgba(26, 26, 26, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {selectedOrderForAdmin && (
                <button
                  onClick={() => setSelectedOrderForAdmin(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '14px',
                    fontWeight: '600',
                    borderRadius: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <ChevronLeft size={20} />
                  <span>Volver</span>
                </button>
              )}
              <ShoppingCart size={24} color="white" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', margin: 0 }}>
                  {selectedOrderForAdmin ? `Pedido #${selectedOrderForAdmin.id}` : 'Pedidos'}
                </h2>
                {filteredSessionName && !selectedOrderForAdmin && (
                  <p style={{ color: '#999', fontSize: '13px', margin: 0, fontWeight: '400' }}>
                    {filteredSessionName}
                  </p>
                )}
              </div>
              {!loadingOrders && !selectedOrderForAdmin && (
                <span style={{
                  background: 'rgba(37, 99, 235, 0.2)',
                  color: '#10b981',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Boton para limpiar TODOS los pedidos */}
              {!selectedOrderForAdmin && orders.length > 0 && (
                <button
                  onClick={() => setShowDeleteAllOrdersModal(true)}
                  title="Eliminar todos los pedidos"
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    borderRadius: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={() => {
                  setShowOrdersModal(false);
                  setSelectedOrderForAdmin(null);
                  setFilteredSessionName(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  borderRadius: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Contenido: Lista O Detalles */}
          <div className="orders-modal-scroll" style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            {selectedOrderForAdmin ? (
              /* ========== PANEL DE DETALLES DEL PEDIDO (ADMIN) ========== */
              <AdminOrderDetails
                order={selectedOrderForAdmin}
                onUpdateStatus={updateOrderStatus}
                onDeleteOrder={setOrderToDelete}
                onRejectWithReason={setOrderToReject}
                showToast={showToast}
              />
            ) : loadingOrders ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                gap: '16px'
              }}>
                <Loader size={32} className="spin" style={{ color: '#10b981' }} />
                <p style={{ color: '#999', fontSize: '14px' }}>Cargando pedidos...</p>
              </div>
            ) : orders.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                gap: '16px'
              }}>
                <ShoppingCart size={64} strokeWidth={1} style={{ color: '#666' }} />
                <p style={{ color: '#999', fontSize: '16px' }}>No hay pedidos aun</p>
                <p style={{ color: '#666', fontSize: '14px' }}>Los pedidos apareceran aqui cuando los clientes compren fotos</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orders.map((order) => {
                  const statusConfig = {
                    pending: { label: 'Pendiente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                    approved: { label: 'Aprobado', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
                    rejected: { label: 'Rechazado', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
                  };
                  const status = statusConfig[order.status] || statusConfig.pending;

                  return (
                    <div
                      key={order.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '16px',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={() => setSelectedOrderForAdmin(order)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                              Pedido #{order.id}
                            </span>
                            <span style={{
                              background: status.bg,
                              color: status.color,
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              {status.label}
                            </span>
                          </div>
                          <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>
                            {order?.customer?.name || '-'} • {order?.customer?.phone || '-'}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ color: 'white', fontSize: '18px', fontWeight: '700', margin: 0 }}>
                            ${(order?.pricing?.total || 0).toLocaleString()}
                          </p>
                          <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>
                            {order?.pricing?.quantity || 0} {(order?.pricing?.quantity || 0) === 1 ? 'foto' : 'fotos'}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {order.paymentProof && (
                          <span style={{
                            color: '#10b981',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <CheckCircle size={14} />
                            Comprobante subido
                          </span>
                        )}
                        <span style={{ color: '#666', fontSize: '12px' }}>
                          {new Date(order.createdAt).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Boton de eliminar en esquina inferior derecha */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrderToDelete(order);
                        }}
                        title="Eliminar pedido"
                        style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: 'rgba(100, 100, 100, 0.3)',
                          border: 'none',
                          color: '#999',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          opacity: 0.6
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(100, 100, 100, 0.3)';
                          e.currentTarget.style.color = '#999';
                          e.currentTarget.style.opacity = '0.6';
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export { AdminOrderDetails };
export default OrdersModal;
