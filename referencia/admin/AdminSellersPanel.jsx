import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Users, UserPlus, Settings, BarChart2, Link, DollarSign,
  Check, Pause, Play, Edit2, Share2, Trash2, Plus, ChevronRight,
  Copy, Phone, Mail, CreditCard, User, Image, Camera, ExternalLink
} from 'lucide-react';
import { useSellers, SELLER_STATUS } from '../../hooks/useSellers';
import SellerShareModal from './SellerShareModal';

/**
 * Panel de administración de vendedores
 * Rediseñado con pestañas y mejor UX
 */
export function AdminSellersPanel({ onClose, sessions = [], embedded = false }) {
  const {
    sellers,
    loading,
    error,
    loadSellers,
    createSeller,
    updateSeller,
    deleteSeller,
    toggleSellerStatus,
    assignSession,
    removeSession,
    getSellerStats,
    createPayout,
  } = useSellers();

  // Estados principales
  const [activeTab, setActiveTab] = useState('list'); // list | create | edit | stats
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerStats, setSellerStats] = useState(null);
  const [shareSellerModal, setShareSellerModal] = useState(null);
  const [showSessionsModal, setShowSessionsModal] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    commissionRate: 10,
    alias: '',
    dni: '',
  });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Estado para modal de pago
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAliasCopied, setPayoutAliasCopied] = useState(false);
  const [newSellerCode, setNewSellerCode] = useState(null);

  // Estados de pago
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [payoutProof, setPayoutProof] = useState(null); // { file, preview, base64 }
  const payoutProofInputRef = useRef(null);
  const [viewingProof, setViewingProof] = useState(null); // URL para ver comprobante

  // Helpers
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
    });
  };

  // Handlers
  const handleCreateSeller = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      const result = await createSeller(formData);
      if (result.success) {
        const code = result.seller?.trackingCode || result.trackingCode;
        setNewSellerCode(code);
        setFormData({ name: '', phone: '', email: '', commissionRate: 10, alias: '', dni: '' });
      } else {
        setFormError(result.error);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateSeller = async (e) => {
    e.preventDefault();
    if (!selectedSeller) return;
    setFormError(null);
    setFormLoading(true);
    try {
      const result = await updateSeller(selectedSeller.id, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        commissionRate: Number(formData.commissionRate),
        alias: formData.alias,
        dni: formData.dni,
      });
      if (result.success) {
        setActiveTab('list');
        setSelectedSeller(null);
      } else {
        setFormError(result.error);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const openEditSeller = (seller) => {
    setSelectedSeller(seller);
    setFormData({
      name: seller.name || '',
      phone: seller.phone || '',
      email: seller.email || '',
      commissionRate: seller.commissionRate || 10,
      alias: seller.paymentInfo?.alias || seller.alias || '',
      dni: seller.dni || '',
    });
    setFormError(null);
    setActiveTab('edit');
  };

  const viewSellerStats = async (seller) => {
    setSelectedSeller(seller);
    setActiveTab('stats');
    setSellerStats(null);
    const result = await getSellerStats(seller.id, 6);
    if (result.success) {
      setSellerStats(result);
    }
  };

  const handleToggleSession = async (sellerId, sessionSlug, isAssigned) => {
    if (isAssigned) {
      await removeSession(sellerId, sessionSlug);
    } else {
      await assignSession(sellerId, sessionSlug);
    }
    // Refrescar para actualizar UI
    loadSellers();
  };

  const handleDeleteSeller = async () => {
    if (!deleteConfirmModal) return;
    setDeleteLoading(true);
    try {
      const result = await deleteSeller(deleteConfirmModal.id);
      if (result.success) {
        setDeleteConfirmModal(null);
        // Si estamos en edición o stats del vendedor eliminado, volver a lista
        if (selectedSeller?.id === deleteConfirmModal.id) {
          setActiveTab('list');
          setSelectedSeller(null);
        }
      } else {
        alert(result.error || 'Error al eliminar vendedor');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Iniciar proceso de pago (mostrar modal)
  const handlePayoutStart = () => {
    if (!selectedSeller || !payoutAmount) return;
    // Reset proof state
    setPayoutProof(null);
    // Copiar alias automáticamente
    const alias = sellerStats?.seller?.paymentInfo?.alias || selectedSeller.paymentInfo?.alias;
    if (alias) {
      navigator.clipboard.writeText(alias).then(() => {
        setPayoutAliasCopied(true);
        setTimeout(() => setPayoutAliasCopied(false), 3000);
      }).catch(() => {});
    }
    setShowPayoutModal(true);
  };

  // Handler para seleccionar comprobante
  const handleProofSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imágenes');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar 5MB');
      return;
    }

    // Create preview and convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result.split(',')[1]; // Remove data:image/...;base64, prefix
      setPayoutProof({
        file,
        preview: event.target.result,
        base64,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  // Remover comprobante
  const handleProofRemove = () => {
    setPayoutProof(null);
    if (payoutProofInputRef.current) {
      payoutProofInputRef.current.value = '';
    }
  };

  // Confirmar y procesar pago
  const handlePayoutConfirm = async () => {
    if (!selectedSeller || !payoutAmount) return;
    setFormLoading(true);
    try {
      const payoutData = {
        amount: Number(payoutAmount),
        notes: payoutNote,
        method: 'transfer',
      };

      // Add proof if uploaded
      if (payoutProof?.base64) {
        payoutData.proofData = payoutProof.base64;
        payoutData.proofFileName = payoutProof.fileName;
      }

      const result = await createPayout(selectedSeller.id, payoutData);
      if (result.success) {
        setPayoutAmount('');
        setPayoutNote('');
        setPayoutProof(null);
        setShowPayoutModal(false);
        const statsResult = await getSellerStats(selectedSeller.id, 6);
        if (statsResult.success) {
          setSellerStats(statsResult);
        }
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Abrir MercadoPago
  const openMercadoPago = () => {
    // Intentar abrir app de MP, fallback a web
    const mpAppUrl = 'mercadopago://home';
    const mpWebUrl = 'https://www.mercadopago.com.ar/home';

    // Crear un iframe oculto para detectar si la app está instalada
    const timeout = setTimeout(() => {
      window.open(mpWebUrl, '_blank');
    }, 1500);

    window.location.href = mpAppUrl;

    // Si la app se abre, cancelar el timeout
    window.addEventListener('blur', () => {
      clearTimeout(timeout);
    }, { once: true });
  };

  // Estilos
  const s = {
    overlay: embedded ? {
      position: 'relative',
      background: 'transparent',
    } : {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(8px)',
      zIndex: 10000,
      overflowY: 'auto',
    },
    container: {
      minHeight: embedded ? 'auto' : '100vh',
      padding: '20px',
    },
    content: {
      maxWidth: '900px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px',
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    headerIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '14px',
      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      color: '#fff',
      fontSize: '22px',
      fontWeight: '700',
      margin: 0,
    },
    subtitle: {
      color: '#666',
      fontSize: '13px',
      margin: '2px 0 0 0',
    },
    closeBtn: {
      width: '44px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255,255,255,0.05)',
      border: 'none',
      borderRadius: '12px',
      color: '#888',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      marginBottom: '24px',
      borderBottom: '1px solid #333',
      overflowX: 'auto',
      paddingBottom: '0',
    },
    tab: (active) => ({
      padding: '14px 20px',
      background: 'transparent',
      border: 'none',
      borderBottom: active ? '2px solid #8b5cf6' : '2px solid transparent',
      color: active ? '#fff' : '#666',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginBottom: '-1px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      whiteSpace: 'nowrap',
    }),
    card: {
      background: '#1a1a1a',
      borderRadius: '16px',
      border: '1px solid #2a2a2a',
      overflow: 'hidden',
      marginBottom: '12px',
    },
    cardContent: {
      padding: '16px 20px',
    },
    cardRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexWrap: 'wrap',
    },
    sellerInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      flex: 1,
      minWidth: '200px',
    },
    avatar: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #10b981, #059669)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      overflow: 'hidden',
    },
    avatarImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    sellerName: {
      color: '#fff',
      fontSize: '16px',
      fontWeight: '600',
      margin: 0,
    },
    sellerCode: {
      color: '#666',
      fontSize: '12px',
      fontFamily: 'monospace',
      marginTop: '2px',
    },
    badge: (active) => ({
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '600',
      background: active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
      color: active ? '#22c55e' : '#eab308',
      marginLeft: '8px',
    }),
    quickStats: {
      display: 'flex',
      gap: '20px',
      alignItems: 'center',
    },
    quickStat: {
      textAlign: 'center',
    },
    quickStatValue: (color) => ({
      color: color || '#fff',
      fontSize: '16px',
      fontWeight: '700',
    }),
    quickStatLabel: {
      color: '#555',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    btnGroup: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap',
    },
    iconBtn: (color) => ({
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: color ? `rgba(${color}, 0.15)` : 'rgba(255,255,255,0.05)',
      border: 'none',
      borderRadius: '10px',
      color: color ? `rgb(${color})` : '#888',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }),
    sessionsRow: {
      padding: '12px 20px',
      borderTop: '1px solid #252525',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap',
    },
    sessionTag: {
      padding: '6px 12px',
      background: 'rgba(139, 92, 246, 0.15)',
      borderRadius: '8px',
      color: '#a78bfa',
      fontSize: '12px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    addSessionBtn: {
      padding: '6px 12px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px dashed #444',
      borderRadius: '8px',
      color: '#666',
      fontSize: '12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    // Form styles
    formCard: {
      background: '#1a1a1a',
      borderRadius: '16px',
      border: '1px solid #2a2a2a',
      padding: '24px',
      maxWidth: '500px',
    },
    formGroup: {
      marginBottom: '20px',
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '20px',
    },
    label: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: '#888',
      fontSize: '13px',
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      background: '#0d0d0d',
      border: '1px solid #333',
      borderRadius: '10px',
      color: '#fff',
      fontSize: '15px',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
    },
    errorBox: {
      padding: '14px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.25)',
      borderRadius: '10px',
      color: '#ef4444',
      fontSize: '14px',
      marginBottom: '18px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    formBtns: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
    },
    primaryBtn: {
      flex: 1,
      padding: '14px 20px',
      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
      border: 'none',
      borderRadius: '12px',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    secondaryBtn: {
      padding: '14px 20px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
    },
    // Stats styles
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px',
      marginBottom: '24px',
    },
    statCard: {
      background: '#1a1a1a',
      borderRadius: '14px',
      border: '1px solid #2a2a2a',
      padding: '16px',
    },
    statLabel: {
      color: '#666',
      fontSize: '12px',
      marginBottom: '6px',
    },
    statValue: (color) => ({
      fontSize: '24px',
      fontWeight: '700',
      color: color || '#fff',
    }),
    payoutBox: {
      background: 'rgba(234, 179, 8, 0.08)',
      border: '1px solid rgba(234, 179, 8, 0.2)',
      borderRadius: '14px',
      padding: '20px',
      marginBottom: '24px',
    },
    payoutTitle: {
      color: '#eab308',
      fontSize: '15px',
      fontWeight: '600',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    payoutForm: {
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-end',
      flexWrap: 'wrap',
    },
    payoutField: {
      flex: 1,
      minWidth: '140px',
    },
    payoutBtn: {
      padding: '14px 24px',
      background: '#eab308',
      border: 'none',
      borderRadius: '10px',
      color: '#000',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    historyCard: {
      background: '#1a1a1a',
      borderRadius: '14px',
      border: '1px solid #2a2a2a',
      overflow: 'hidden',
    },
    historyHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid #2a2a2a',
    },
    historyTitle: {
      color: '#fff',
      fontSize: '15px',
      fontWeight: '600',
      margin: 0,
    },
    historyList: {
      maxHeight: '300px',
      overflowY: 'auto',
    },
    historyItem: {
      padding: '14px 20px',
      borderBottom: '1px solid #222',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
    },
    empty: {
      padding: '40px 20px',
      textAlign: 'center',
      color: '#555',
    },
    loader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px',
    },
    spinner: {
      width: '32px',
      height: '32px',
      border: '3px solid #333',
      borderTopColor: '#8b5cf6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    // Sessions Modal
    modalOverlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10001,
      padding: '20px',
    },
    modal: {
      background: '#1a1a1a',
      borderRadius: '16px',
      border: '1px solid #333',
      width: '100%',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    modalHeader: {
      padding: '20px',
      borderBottom: '1px solid #2a2a2a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: {
      color: '#fff',
      fontSize: '17px',
      fontWeight: '600',
      margin: 0,
    },
    modalBody: {
      padding: '12px',
      overflowY: 'auto',
      flex: 1,
    },
    sessionOption: (assigned) => ({
      padding: '14px 16px',
      background: assigned ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${assigned ? 'rgba(139, 92, 246, 0.3)' : '#333'}`,
      borderRadius: '12px',
      marginBottom: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'all 0.2s',
    }),
    sessionOptionName: {
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500',
    },
    checkCircle: (assigned) => ({
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      background: assigned ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    // Success Modal
    successModal: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10002,
      padding: '20px',
    },
    successBox: {
      background: '#1a1a1a',
      borderRadius: '20px',
      border: '1px solid #22c55e',
      padding: '32px',
      maxWidth: '400px',
      width: '100%',
      textAlign: 'center',
    },
    successIcon: {
      width: '64px',
      height: '64px',
      background: 'rgba(34, 197, 94, 0.15)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
    },
    successTitle: {
      color: '#22c55e',
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '8px',
    },
    successText: {
      color: '#888',
      fontSize: '14px',
      marginBottom: '20px',
    },
    codeBox: {
      background: '#0d0d0d',
      border: '2px dashed #333',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '20px',
    },
    codeLabel: {
      color: '#666',
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '6px',
    },
    codeValue: {
      color: '#fff',
      fontSize: '22px',
      fontWeight: '700',
      fontFamily: 'monospace',
      letterSpacing: '2px',
    },
  };

  const tabs = [
    { id: 'list', label: 'Vendedores', icon: Users },
    { id: 'create', label: 'Nuevo', icon: UserPlus },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={s.overlay}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={s.container}>
        <div style={s.content}>
          {/* Header */}
          <div style={s.header}>
            <div style={s.headerLeft}>
              {(activeTab === 'edit' || activeTab === 'stats') && (
                <button
                  onClick={() => { setActiveTab('list'); setSelectedSeller(null); }}
                  style={s.closeBtn}
                >
                  <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                </button>
              )}
              <div style={s.headerIcon}>
                <Users size={24} color="#fff" />
              </div>
              <div>
                <h1 style={s.title}>
                  {activeTab === 'list' && 'Vendedores'}
                  {activeTab === 'create' && 'Nuevo Vendedor'}
                  {activeTab === 'edit' && 'Editar Vendedor'}
                  {activeTab === 'stats' && selectedSeller?.name}
                </h1>
                <p style={s.subtitle}>
                  {activeTab === 'list' && `${sellers.length} vendedores registrados`}
                  {activeTab === 'create' && 'Completa los datos del vendedor'}
                  {activeTab === 'edit' && selectedSeller?.trackingCode}
                  {activeTab === 'stats' && 'Estadísticas y pagos'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={s.closeBtn}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#888'; }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs (solo en list y create) */}
          {(activeTab === 'list' || activeTab === 'create') && (
            <div style={s.tabs}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === 'create') {
                        setFormData({ name: '', phone: '', email: '', commissionRate: 10, alias: '', dni: '' });
                        setFormError(null);
                      }
                    }}
                    style={s.tab(activeTab === tab.id)}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Content */}
          <AnimatePresence mode="wait">
            {/* LIST VIEW */}
            {activeTab === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {loading ? (
                  <div style={s.loader}><div style={s.spinner} /></div>
                ) : error ? (
                  <div style={s.errorBox}>{error}</div>
                ) : sellers.length === 0 ? (
                  <div style={s.card}>
                    <div style={s.empty}>
                      <Users size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                      <p>No hay vendedores registrados</p>
                      <button
                        onClick={() => setActiveTab('create')}
                        style={{ ...s.primaryBtn, marginTop: '16px', display: 'inline-flex' }}
                      >
                        <UserPlus size={18} />
                        Crear vendedor
                      </button>
                    </div>
                  </div>
                ) : (
                  sellers.map((seller) => {
                    const isActive = seller.status === SELLER_STATUS.ACTIVE;
                    const sessionCount = seller.assignedSessions?.length || 0;

                    return (
                      <div key={seller.id} style={s.card}>
                        <div style={s.cardContent}>
                          <div style={s.cardRow}>
                            {/* Info del vendedor */}
                            <div style={s.sellerInfo}>
                              <div style={s.avatar}>
                                {seller.photoUrl ? (
                                  <img src={seller.photoUrl} alt={seller.name} style={s.avatarImg} />
                                ) : (
                                  <User size={24} color="#fff" />
                                )}
                              </div>
                              <div>
                                <h3 style={s.sellerName}>
                                  {seller.name}
                                  <span style={s.badge(isActive)}>
                                    {isActive ? 'Activo' : 'Pausado'}
                                  </span>
                                </h3>
                                <p style={s.sellerCode}>{seller.trackingCode}</p>
                              </div>
                            </div>

                            {/* Stats rápidas */}
                            <div style={s.quickStats}>
                              <div style={s.quickStat}>
                                <p style={s.quickStatValue()}>{seller.commissionRate}%</p>
                                <p style={s.quickStatLabel}>Comisión</p>
                              </div>
                              <div style={s.quickStat}>
                                <p style={s.quickStatValue('#eab308')}>
                                  {formatCurrency(seller.stats?.pendingCommission || 0).replace('ARS', '$')}
                                </p>
                                <p style={s.quickStatLabel}>Pendiente</p>
                              </div>
                            </div>

                            {/* Botones de acción */}
                            <div style={s.btnGroup}>
                              <button
                                onClick={() => toggleSellerStatus(seller.id)}
                                style={s.iconBtn(isActive ? '234, 179, 8' : '34, 197, 94')}
                                title={isActive ? 'Pausar' : 'Activar'}
                              >
                                {isActive ? <Pause size={16} /> : <Play size={16} />}
                              </button>
                              <button
                                onClick={() => openEditSeller(seller)}
                                style={s.iconBtn()}
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => viewSellerStats(seller)}
                                style={s.iconBtn('139, 92, 246')}
                                title="Ver estadísticas"
                              >
                                <BarChart2 size={16} />
                              </button>
                              <button
                                onClick={() => setShareSellerModal(seller)}
                                style={s.iconBtn('59, 130, 246')}
                                title="Compartir invitación"
                              >
                                <Share2 size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmModal(seller)}
                                style={s.iconBtn('239, 68, 68')}
                                title="Eliminar vendedor"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Sesiones asignadas */}
                        <div style={s.sessionsRow}>
                          <Link size={14} color="#666" />
                          {seller.assignedSessions?.slice(0, 3).map((sessionItem) => {
                            const slug = typeof sessionItem === 'string' ? sessionItem : sessionItem?.slug || sessionItem?.id;
                            return (
                              <span key={slug} style={s.sessionTag}>
                                {slug}
                              </span>
                            );
                          })}
                          {sessionCount > 3 && (
                            <span style={{ ...s.sessionTag, background: 'rgba(255,255,255,0.05)', color: '#666' }}>
                              +{sessionCount - 3} más
                            </span>
                          )}
                          <button
                            onClick={() => setShowSessionsModal(seller)}
                            style={s.addSessionBtn}
                          >
                            <Settings size={12} />
                            Gestionar
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}

            {/* CREATE VIEW */}
            {activeTab === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <form onSubmit={handleCreateSeller} style={s.formCard}>
                  {formError && (
                    <div style={s.errorBox}>
                      <X size={16} />
                      {formError}
                    </div>
                  )}

                  <div style={s.formGroup}>
                    <label style={s.label}><User size={14} /> Nombre completo *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Juan Pérez"
                      style={s.input}
                      required
                    />
                  </div>

                  <div style={s.formRow}>
                    <div>
                      <label style={s.label}><Phone size={14} /> Teléfono</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+54 11 1234-5678"
                        style={s.input}
                      />
                    </div>
                    <div>
                      <label style={s.label}><Mail size={14} /> Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@ejemplo.com"
                        style={s.input}
                      />
                    </div>
                  </div>

                  <div style={s.formRow}>
                    <div>
                      <label style={s.label}><DollarSign size={14} /> Comisión (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.commissionRate}
                        onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                        style={s.input}
                      />
                    </div>
                    <div>
                      <label style={s.label}><CreditCard size={14} /> Alias/CBU (pagos)</label>
                      <input
                        type="text"
                        value={formData.alias}
                        onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                        placeholder="alias.mp"
                        style={s.input}
                      />
                    </div>
                  </div>

                  <div style={s.formBtns}>
                    <button type="submit" disabled={formLoading} style={s.primaryBtn}>
                      {formLoading ? (
                        <>
                          <div style={{ ...s.spinner, width: '18px', height: '18px', borderWidth: '2px' }} />
                          Creando...
                        </>
                      ) : (
                        <>
                          <UserPlus size={18} />
                          Crear Vendedor
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* EDIT VIEW */}
            {activeTab === 'edit' && selectedSeller && (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <form onSubmit={handleUpdateSeller} style={s.formCard}>
                  {/* Info box */}
                  <div style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={s.avatar}>
                      {selectedSeller.photoUrl ? (
                        <img src={selectedSeller.photoUrl} alt={selectedSeller.name} style={s.avatarImg} />
                      ) : (
                        <User size={24} color="#fff" />
                      )}
                    </div>
                    <div>
                      <p style={{ color: '#a78bfa', fontSize: '12px', margin: 0 }}>Código</p>
                      <p style={{ color: '#fff', fontFamily: 'monospace', fontSize: '16px', fontWeight: '600', margin: '2px 0 0 0' }}>
                        {selectedSeller.trackingCode}
                      </p>
                    </div>
                  </div>

                  {formError && (
                    <div style={s.errorBox}>
                      <X size={16} />
                      {formError}
                    </div>
                  )}

                  <div style={s.formGroup}>
                    <label style={s.label}><User size={14} /> Nombre completo *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={s.input}
                      required
                    />
                  </div>

                  <div style={s.formRow}>
                    <div>
                      <label style={s.label}><Phone size={14} /> Teléfono</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={s.input}
                      />
                    </div>
                    <div>
                      <label style={s.label}><Mail size={14} /> Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={s.input}
                      />
                    </div>
                  </div>

                  <div style={s.formRow}>
                    <div>
                      <label style={s.label}><DollarSign size={14} /> Comisión (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.commissionRate}
                        onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                        style={s.input}
                      />
                    </div>
                    <div>
                      <label style={s.label}><User size={14} /> DNI</label>
                      <input
                        type="text"
                        value={formData.dni}
                        onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                        placeholder="12345678"
                        style={s.input}
                      />
                    </div>
                  </div>

                  <div style={s.formGroup}>
                    <label style={s.label}><CreditCard size={14} /> Alias/CBU (pagos)</label>
                    <input
                      type="text"
                      value={formData.alias}
                      onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                      placeholder="alias.mp o CBU"
                      style={s.input}
                    />
                  </div>

                  <div style={s.formBtns}>
                    <button type="submit" disabled={formLoading} style={s.primaryBtn}>
                      {formLoading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    <button type="button" onClick={() => setActiveTab('list')} style={s.secondaryBtn}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STATS VIEW */}
            {activeTab === 'stats' && selectedSeller && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {!sellerStats ? (
                  <div style={s.loader}><div style={s.spinner} /></div>
                ) : (
                  <>
                    {/* Stats Grid */}
                    <div style={s.statsGrid}>
                      <div style={s.statCard}>
                        <p style={s.statLabel}>Ventas totales</p>
                        <p style={s.statValue()}>{sellerStats.seller?.stats?.totalSales || 0}</p>
                      </div>
                      <div style={s.statCard}>
                        <p style={s.statLabel}>Ingresos</p>
                        <p style={s.statValue('#22c55e')}>{formatCurrency(sellerStats.seller?.stats?.totalRevenue)}</p>
                      </div>
                      <div style={s.statCard}>
                        <p style={s.statLabel}>Pendiente</p>
                        <p style={s.statValue('#eab308')}>{formatCurrency(sellerStats.seller?.stats?.pendingCommission)}</p>
                      </div>
                      <div style={s.statCard}>
                        <p style={s.statLabel}>Pagado</p>
                        <p style={s.statValue('#a78bfa')}>{formatCurrency(sellerStats.seller?.stats?.paidCommission)}</p>
                      </div>
                    </div>

                    {/* Payout Box */}
                    {(sellerStats.seller?.stats?.pendingCommission || 0) > 0 && (
                      <div style={s.payoutBox}>
                        <h3 style={s.payoutTitle}>
                          <DollarSign size={18} />
                          Registrar pago
                        </h3>
                        <div style={s.payoutForm}>
                          <div style={s.payoutField}>
                            <label style={s.label}>Monto</label>
                            <input
                              type="number"
                              min="0"
                              max={sellerStats.seller?.stats?.pendingCommission || 0}
                              value={payoutAmount}
                              onChange={(e) => setPayoutAmount(e.target.value)}
                              placeholder={formatCurrency(sellerStats.seller?.stats?.pendingCommission)}
                              style={s.input}
                            />
                          </div>
                          <div style={s.payoutField}>
                            <label style={s.label}>Nota</label>
                            <input
                              type="text"
                              value={payoutNote}
                              onChange={(e) => setPayoutNote(e.target.value)}
                              placeholder="Ej: Transferencia"
                              style={s.input}
                            />
                          </div>
                          <button
                            onClick={handlePayoutStart}
                            disabled={formLoading || !payoutAmount}
                            style={s.payoutBtn}
                          >
                            {formLoading ? '...' : 'Pagar'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Historial de comisiones */}
                    <div style={s.historyCard}>
                      <div style={s.historyHeader}>
                        <h3 style={s.historyTitle}>Historial de comisiones</h3>
                      </div>
                      {sellerStats.commissions?.length > 0 ? (
                        <div style={s.historyList}>
                          {sellerStats.commissions.map((c, i) => (
                            <div key={c.id || i} style={s.historyItem}>
                              <div>
                                <p style={{ color: '#fff', fontSize: '14px', fontWeight: '500', margin: 0 }}>
                                  Pedido #{c.orderId?.slice(-8) || 'N/A'}
                                </p>
                                <p style={{ color: '#555', fontSize: '12px', margin: '2px 0 0 0' }}>
                                  {c.createdAt ? formatDate(c.createdAt) : ''}
                                </p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {/* Thumbnail del comprobante si existe */}
                                {c.proofUrl && c.status === 'paid' && (
                                  <button
                                    onClick={() => setViewingProof(c.proofUrl)}
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '6px',
                                      border: '2px solid rgba(34, 197, 94, 0.4)',
                                      background: '#0a0a0a',
                                      padding: 0,
                                      cursor: 'pointer',
                                      overflow: 'hidden',
                                      flexShrink: 0,
                                    }}
                                    title="Ver comprobante"
                                  >
                                    <img
                                      src={c.proofUrl}
                                      alt="Comprobante"
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  </button>
                                )}
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                    <p style={{ color: '#22c55e', fontWeight: '700', fontSize: '15px', margin: 0 }}>
                                      +{formatCurrency(c.commissionAmount || c.amount || 0)}
                                    </p>
                                    <span style={{
                                      display: 'inline-block',
                                      padding: '1px 5px',
                                      borderRadius: '6px',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                      fontFamily: 'monospace',
                                      background: c.referralType === 'secondary'
                                        ? 'rgba(249, 115, 22, 0.15)'
                                        : 'rgba(34, 197, 94, 0.1)',
                                      color: c.referralType === 'secondary'
                                        ? '#f97316'
                                        : 'rgba(34, 197, 94, 0.6)',
                                    }}
                                    title={c.referralType === 'secondary' ? 'Venta secundaria (compartida)' : 'Venta directa'}
                                    >
                                      -{c.commissionRate || c.rate || '?'}%
                                    </span>
                                  </div>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontSize: '10px',
                                    fontWeight: '500',
                                    background: c.status === 'paid' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                    color: c.status === 'paid' ? '#22c55e' : '#eab308',
                                  }}>
                                    {c.status === 'paid' ? 'Pagado' : 'Pendiente'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={s.empty}>Sin comisiones</div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal para gestionar sesiones */}
      {showSessionsModal && (
        <div style={s.modalOverlay} onClick={() => setShowSessionsModal(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Sesiones de {showSessionsModal.name}</h3>
              <button onClick={() => setShowSessionsModal(null)} style={s.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <div style={s.modalBody}>
              {sessions.length === 0 ? (
                <div style={s.empty}>No hay sesiones disponibles</div>
              ) : (
                sessions.map((sessionItem) => {
                  const slug = typeof sessionItem === 'string' ? sessionItem : sessionItem?.slug || sessionItem?.id || '';
                  const name = typeof sessionItem === 'string' ? sessionItem : sessionItem?.name || sessionItem?.slug || 'Sin nombre';
                  const isAssigned = showSessionsModal.assignedSessions?.some(as => {
                    const asSlug = typeof as === 'string' ? as : as?.slug || as?.id;
                    return asSlug === slug;
                  });

                  return (
                    <div
                      key={slug}
                      style={s.sessionOption(isAssigned)}
                      onClick={() => handleToggleSession(showSessionsModal.id, slug, isAssigned)}
                      onMouseEnter={(e) => {
                        if (!isAssigned) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isAssigned) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }}
                    >
                      <span style={s.sessionOptionName}>{name}</span>
                      <div style={s.checkCircle(isAssigned)}>
                        {isAssigned && <Check size={14} color="#fff" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para compartir link de invitación */}
      {shareSellerModal && (
        <SellerShareModal
          seller={shareSellerModal}
          onClose={() => setShareSellerModal(null)}
        />
      )}

      {/* Modal de éxito con código del vendedor */}
      {newSellerCode && (
        <div style={s.successModal} onClick={() => { setNewSellerCode(null); setActiveTab('list'); }}>
          <div style={s.successBox} onClick={(e) => e.stopPropagation()}>
            <div style={s.successIcon}>
              <Check size={32} color="#22c55e" />
            </div>
            <h3 style={s.successTitle}>Vendedor Creado</h3>
            <p style={s.successText}>
              Comparte el link de invitación para que configure su cuenta
            </p>
            <div style={s.codeBox}>
              <p style={s.codeLabel}>Código de vendedor</p>
              <p style={s.codeValue}>{newSellerCode}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(newSellerCode);
                }}
                style={s.secondaryBtn}
              >
                <Copy size={16} style={{ marginRight: '6px' }} />
                Copiar
              </button>
              <button
                onClick={() => {
                  // Buscar el vendedor recién creado
                  const newSeller = sellers.find(s => s.trackingCode === newSellerCode);
                  if (newSeller) {
                    setShareSellerModal(newSeller);
                  }
                  setNewSellerCode(null);
                }}
                style={s.primaryBtn}
              >
                <Share2 size={16} />
                Compartir Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteConfirmModal && (
        <div style={s.modalOverlay} onClick={() => !deleteLoading && setDeleteConfirmModal(null)}>
          <div style={{
            ...s.modal,
            maxWidth: '380px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '24px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'rgba(239, 68, 68, 0.15)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Trash2 size={28} color="#ef4444" />
              </div>
              <h3 style={{
                color: '#fff',
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 8px 0',
              }}>¿Eliminar vendedor?</h3>
              <p style={{
                color: '#888',
                fontSize: '14px',
                margin: '0 0 8px 0',
              }}>
                Esta acción no se puede deshacer. Se eliminará:
              </p>
              <div style={{
                background: '#0d0d0d',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '20px',
              }}>
                <p style={{
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: '600',
                  margin: 0,
                }}>{deleteConfirmModal.name}</p>
                <p style={{
                  color: '#666',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  margin: '4px 0 0 0',
                }}>{deleteConfirmModal.trackingCode}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setDeleteConfirmModal(null)}
                  disabled={deleteLoading}
                  style={{
                    ...s.secondaryBtn,
                    flex: 1,
                    opacity: deleteLoading ? 0.5 : 1,
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteSeller}
                  disabled={deleteLoading}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    background: deleteLoading ? '#666' : '#ef4444',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: deleteLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {deleteLoading ? (
                    <>
                      <div style={{ ...s.spinner, width: '16px', height: '16px', borderWidth: '2px' }} />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de pago (copia alias + redirige a MercadoPago) */}
      {showPayoutModal && selectedSeller && (
        <div style={s.modalOverlay} onClick={() => !formLoading && setShowPayoutModal(false)}>
          <div style={{
            ...s.modal,
            maxWidth: '420px',
            border: '1px solid rgba(234, 179, 8, 0.3)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '24px',
              textAlign: 'center',
            }}>
              {/* Icono */}
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(234, 179, 8, 0.1))',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <DollarSign size={32} color="#eab308" />
              </div>

              <h3 style={{
                color: '#fff',
                fontSize: '20px',
                fontWeight: '700',
                margin: '0 0 8px 0',
              }}>Pagar comisión</h3>

              <p style={{
                color: '#888',
                fontSize: '14px',
                margin: '0 0 20px 0',
              }}>
                Realiza la transferencia a {selectedSeller.name}
              </p>

              {/* Monto a pagar */}
              <div style={{
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.2)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
              }}>
                <p style={{ color: '#888', fontSize: '12px', margin: '0 0 4px 0' }}>Monto a transferir</p>
                <p style={{ color: '#eab308', fontSize: '28px', fontWeight: '700', margin: 0 }}>
                  {formatCurrency(Number(payoutAmount))}
                </p>
              </div>

              {/* Alias copiado */}
              <div style={{
                background: payoutAliasCopied ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                border: `1px solid ${payoutAliasCopied ? 'rgba(34, 197, 94, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#888', fontSize: '11px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Alias de pago
                  </p>
                  <p style={{
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: '600',
                    margin: 0,
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {sellerStats?.seller?.paymentInfo?.alias || selectedSeller.paymentInfo?.alias || 'Sin alias'}
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: payoutAliasCopied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: payoutAliasCopied ? '#22c55e' : '#fff',
                  fontSize: '12px',
                  fontWeight: '500',
                }}>
                  {payoutAliasCopied ? (
                    <>
                      <Check size={14} />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      En portapapeles
                    </>
                  )}
                </div>
              </div>

              {/* Upload comprobante */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#888', fontSize: '12px', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
                  Comprobante de pago (opcional)
                </p>
                <input
                  ref={payoutProofInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProofSelect}
                  style={{ display: 'none' }}
                />
                {payoutProof?.preview ? (
                  // Preview del comprobante
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '12px',
                    padding: '10px',
                  }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        cursor: 'pointer',
                        border: '2px solid rgba(34, 197, 94, 0.5)',
                      }}
                      onClick={() => window.open(payoutProof.preview, '_blank')}
                    >
                      <img
                        src={payoutProof.preview}
                        alt="Comprobante"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#22c55e', fontSize: '13px', fontWeight: '500', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={14} />
                        Comprobante adjunto
                      </p>
                      <p style={{
                        color: '#666',
                        fontSize: '11px',
                        margin: '2px 0 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {payoutProof.fileName}
                      </p>
                    </div>
                    <button
                      onClick={handleProofRemove}
                      style={{
                        width: '32px',
                        height: '32px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  // Botón para subir
                  <button
                    onClick={() => payoutProofInputRef.current?.click()}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '2px dashed #444',
                      borderRadius: '12px',
                      color: '#888',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#666';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#444';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                  >
                    <Camera size={20} />
                    Adjuntar captura de transferencia
                  </button>
                )}
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Botón MercadoPago */}
                <button
                  onClick={openMercadoPago}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    background: 'linear-gradient(135deg, #00a8e8, #009ee3)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                  }}
                >
                  <ExternalLink size={18} />
                  Abrir MercadoPago
                </button>

                {/* Botón Confirmar Pago */}
                <button
                  onClick={handlePayoutConfirm}
                  disabled={formLoading}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    background: formLoading ? '#666' : '#eab308',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#000',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: formLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {formLoading ? (
                    <>
                      <div style={{ ...s.spinner, width: '18px', height: '18px', borderWidth: '2px', borderTopColor: '#000' }} />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Ya transferí, confirmar pago
                    </>
                  )}
                </button>

                {/* Cancelar */}
                <button
                  onClick={() => setShowPayoutModal(false)}
                  disabled={formLoading}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    color: '#888',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: formLoading ? 'not-allowed' : 'pointer',
                    opacity: formLoading ? 0.5 : 1,
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver comprobante de pago */}
      {viewingProof && (
        <div
          onClick={() => setViewingProof(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 10003,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: 'zoom-out',
          }}
        >
          <button
            onClick={() => setViewingProof(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '44px',
              height: '44px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={24} />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              cursor: 'default',
            }}
          >
            <img
              src={viewingProof}
              alt="Comprobante de pago"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
              }}
            />
          </div>
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '20px',
            padding: '8px 16px',
            color: '#22c55e',
            fontSize: '13px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Check size={14} />
            Comprobante de pago
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default AdminSellersPanel;
