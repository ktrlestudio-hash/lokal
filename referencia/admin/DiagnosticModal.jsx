import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, Circle, Loader, Play, RotateCcw, AlertTriangle, Server, Database, Users, ShoppingCart, Image, Settings, Link, Zap } from 'lucide-react';
import { API_URL } from '../../config';

// ========================================
// CONSTANTES
// ========================================

const TEST_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  WARNING: 'warning',
};

// ========================================
// TESTS DISPONIBLES
// ========================================

const DIAGNOSTIC_TESTS = [
  {
    id: 'api_health',
    name: 'Conexión con API',
    description: 'Verifica que el servidor responde',
    icon: Server,
    category: 'connectivity',
    run: async () => {
      const start = Date.now();
      const response = await fetch(`${API_URL}/config`);
      const latency = Date.now() - start;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return {
        success: true,
        message: `API respondiendo (${latency}ms)`,
        latency,
      };
    },
  },
  {
    id: 'r2_read',
    name: 'Lectura de R2',
    description: 'Verifica lectura de configuración desde Cloudflare R2',
    icon: Database,
    category: 'storage',
    run: async () => {
      const start = Date.now();
      const response = await fetch(`${API_URL}/config`);
      const latency = Date.now() - start;

      if (!response.ok) {
        throw new Error(`No se pudo leer config: HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.config) {
        throw new Error('Configuración vacía o inválida');
      }

      return {
        success: true,
        message: `Config cargada (${latency}ms)`,
        details: {
          hasPrice: !!data.config.pricing?.defaultPrice,
          hasPayment: !!data.config.payment,
        },
      };
    },
  },
  {
    id: 'sessions_list',
    name: 'Listado de Sesiones',
    description: 'Verifica que se pueden cargar las sesiones',
    icon: Image,
    category: 'data',
    run: async () => {
      const start = Date.now();
      const response = await fetch(`${API_URL}/list-sessions`);
      const latency = Date.now() - start;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const count = data.sessions?.length || 0;

      return {
        success: true,
        message: `${count} sesiones encontradas (${latency}ms)`,
        details: { count },
      };
    },
  },
  {
    id: 'orders_list',
    name: 'Listado de Pedidos',
    description: 'Verifica que se pueden cargar los pedidos',
    icon: ShoppingCart,
    category: 'data',
    run: async () => {
      const start = Date.now();
      const response = await fetch(`${API_URL}/list-orders`);
      const latency = Date.now() - start;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const orders = data.orders || [];
      const pending = orders.filter(o => o.status === 'pending').length;
      const approved = orders.filter(o => o.status === 'approved').length;

      return {
        success: true,
        message: `${orders.length} pedidos (${pending} pendientes, ${approved} aprobados)`,
        details: { total: orders.length, pending, approved },
        latency,
      };
    },
  },
  {
    id: 'sellers_list',
    name: 'Listado de Vendedores',
    description: 'Verifica el sistema de afiliados',
    icon: Users,
    category: 'sellers',
    run: async () => {
      const start = Date.now();
      const response = await fetch(`${API_URL}/list-sellers`);
      const latency = Date.now() - start;

      if (!response.ok) {
        // Si es 401/403, el sistema funciona pero requiere auth
        if (response.status === 401 || response.status === 403) {
          return {
            success: true,
            message: 'Endpoint protegido correctamente',
            warning: 'Requiere autenticación admin',
          };
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const count = data.sellers?.length || 0;
      const active = data.sellers?.filter(s => s.status === 'active').length || 0;

      return {
        success: true,
        message: `${count} vendedores (${active} activos)`,
        details: { total: count, active },
        latency,
      };
    },
  },
  {
    id: 'seller_validation',
    name: 'Validación de Vendedor',
    description: 'Verifica el endpoint de validación de tracking codes',
    icon: Link,
    category: 'sellers',
    run: async () => {
      const start = Date.now();
      // Usar un código de prueba que sabemos que no existe
      const testCode = 'vd_TEST';
      const response = await fetch(`${API_URL}/validate-seller-session?trackingCode=${testCode}&sessionSlug=test`);
      const latency = Date.now() - start;

      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // El endpoint debe responder aunque el código no exista
      return {
        success: true,
        message: `Endpoint funcionando (${latency}ms)`,
        details: {
          responded: true,
          validation: data.valid === false ? 'Código de prueba rechazado correctamente' : 'Validación activa',
        },
      };
    },
  },
  {
    id: 'local_storage',
    name: 'LocalStorage',
    description: 'Verifica almacenamiento local del navegador',
    icon: Database,
    category: 'browser',
    run: async () => {
      try {
        const testKey = '__diagnostic_test__';
        const testValue = Date.now().toString();

        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);

        if (retrieved !== testValue) {
          throw new Error('Valor recuperado no coincide');
        }

        // Verificar datos de tracking
        const hasTracking = !!localStorage.getItem('seller_tracking');
        const hasFavorites = !!localStorage.getItem('favorites');
        const hasDeviceId = !!localStorage.getItem('deviceId');

        return {
          success: true,
          message: 'LocalStorage funcionando correctamente',
          details: {
            hasTracking,
            hasFavorites,
            hasDeviceId,
          },
        };
      } catch (error) {
        throw new Error(`LocalStorage no disponible: ${error.message}`);
      }
    },
  },
  {
    id: 'pricing_config',
    name: 'Configuración de Precios',
    description: 'Verifica que los precios están configurados',
    icon: Settings,
    category: 'config',
    run: async () => {
      const response = await fetch(`${API_URL}/config`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const pricing = data.config?.pricing;

      if (!pricing) {
        return {
          success: true,
          warning: 'No hay configuración de precios, usando valores por defecto',
          message: 'Usando precios por defecto',
        };
      }

      const price = pricing.defaultPrice;
      const discounts = pricing.discounts?.length || 0;

      return {
        success: true,
        message: `Precio base: $${price}, ${discounts} niveles de descuento`,
        details: {
          defaultPrice: price,
          discountLevels: discounts,
        },
      };
    },
  },
  {
    id: 'payment_config',
    name: 'Datos de Pago',
    description: 'Verifica que los datos de pago están configurados',
    icon: Zap,
    category: 'config',
    run: async () => {
      const response = await fetch(`${API_URL}/config`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const payment = data.config?.payment;

      if (!payment || (!payment.cvu && !payment.alias)) {
        return {
          success: true,
          warning: 'Datos de pago no configurados',
          message: 'Faltan datos de pago (CVU/Alias)',
        };
      }

      return {
        success: true,
        message: 'Datos de pago configurados',
        details: {
          hasCVU: !!payment.cvu,
          hasAlias: !!payment.alias,
          hasPhone: !!payment.phone,
        },
      };
    },
  },
];

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

const DiagnosticModal = ({ onClose, showToast }) => {
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef(null);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Ejecutar un test individual
  const runSingleTest = useCallback(async (test) => {
    setTestResults(prev => ({
      ...prev,
      [test.id]: { status: TEST_STATUS.RUNNING },
    }));
    setCurrentTest(test.id);

    try {
      const result = await Promise.race([
        test.run(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout (10s)')), 10000)
        ),
      ]);

      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          status: result.warning ? TEST_STATUS.WARNING : TEST_STATUS.SUCCESS,
          ...result,
        },
      }));

      return true;
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          status: TEST_STATUS.FAILED,
          message: error.message,
          error: true,
        },
      }));

      return false;
    }
  }, []);

  // Ejecutar todos los tests
  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setTestResults({});
    setProgress(0);

    abortControllerRef.current = new AbortController();

    let successCount = 0;
    let failCount = 0;
    let warnCount = 0;

    for (let i = 0; i < DIAGNOSTIC_TESTS.length; i++) {
      if (abortControllerRef.current.signal.aborted) break;

      const test = DIAGNOSTIC_TESTS[i];
      const success = await runSingleTest(test);

      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      setProgress(((i + 1) / DIAGNOSTIC_TESTS.length) * 100);

      // Pequeña pausa entre tests para visualización
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setCurrentTest(null);
    setIsRunning(false);

    // Contar warnings
    warnCount = Object.values(testResults).filter(
      r => r.status === TEST_STATUS.WARNING
    ).length;

    // Mostrar toast con resultado
    if (showToast) {
      if (failCount === 0) {
        showToast(`Diagnóstico completado: ${successCount} tests exitosos`, 'success');
      } else {
        showToast(`Diagnóstico: ${failCount} fallos, ${successCount} exitosos`, 'error');
      }
    }
  }, [runSingleTest, showToast, testResults]);

  // Resetear tests
  const resetTests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setTestResults({});
    setIsRunning(false);
    setCurrentTest(null);
    setProgress(0);
  }, []);

  // Renderizar icono de estado
  const renderStatusIcon = (status) => {
    switch (status) {
      case TEST_STATUS.SUCCESS:
        return <CheckCircle2 size={20} style={{ color: '#22c55e' }} />;
      case TEST_STATUS.FAILED:
        return <XCircle size={20} style={{ color: '#ef4444' }} />;
      case TEST_STATUS.WARNING:
        return <AlertTriangle size={20} style={{ color: '#f59e0b' }} />;
      case TEST_STATUS.RUNNING:
        return <Loader size={20} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />;
      default:
        return <Circle size={20} style={{ color: '#6b7280' }} />;
    }
  };

  // Calcular resumen
  const summary = {
    total: DIAGNOSTIC_TESTS.length,
    success: Object.values(testResults).filter(r => r.status === TEST_STATUS.SUCCESS).length,
    failed: Object.values(testResults).filter(r => r.status === TEST_STATUS.FAILED).length,
    warning: Object.values(testResults).filter(r => r.status === TEST_STATUS.WARNING).length,
    pending: DIAGNOSTIC_TESTS.length - Object.keys(testResults).length,
  };

  const allPassed = summary.failed === 0 && summary.success === summary.total;
  const hasFailures = summary.failed > 0;

  // Estilos
  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100000,
      padding: '20px',
    },
    modal: {
      backgroundColor: '#1a1a1a',
      borderRadius: '16px',
      width: '100%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #333',
    },
    header: {
      padding: '20px 24px',
      borderBottom: '1px solid #333',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    closeBtn: {
      background: 'transparent',
      border: 'none',
      color: '#999',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
      display: 'flex',
      transition: 'all 0.2s',
    },
    content: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px 24px',
    },
    progressBar: {
      height: '4px',
      backgroundColor: '#333',
      borderRadius: '2px',
      overflow: 'hidden',
      marginBottom: '20px',
    },
    progressFill: {
      height: '100%',
      backgroundColor: hasFailures ? '#ef4444' : '#22c55e',
      transition: 'width 0.3s ease',
    },
    testList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    testItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px 16px',
      backgroundColor: '#242424',
      borderRadius: '12px',
      border: '1px solid #333',
    },
    testIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#333',
      flexShrink: 0,
    },
    testInfo: {
      flex: 1,
      minWidth: 0,
    },
    testName: {
      fontWeight: '600',
      color: '#fff',
      marginBottom: '4px',
    },
    testDesc: {
      fontSize: '13px',
      color: '#888',
    },
    testResult: {
      fontSize: '12px',
      marginTop: '6px',
      padding: '4px 8px',
      borderRadius: '4px',
      backgroundColor: '#333',
    },
    testStatus: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      flexShrink: 0,
    },
    summary: {
      display: 'flex',
      justifyContent: 'center',
      gap: '24px',
      padding: '16px',
      backgroundColor: allPassed ? 'rgba(34, 197, 94, 0.1)' : hasFailures ? 'rgba(239, 68, 68, 0.1)' : '#242424',
      borderRadius: '12px',
      marginTop: '20px',
      border: `1px solid ${allPassed ? '#22c55e33' : hasFailures ? '#ef444433' : '#333'}`,
    },
    summaryItem: {
      textAlign: 'center',
    },
    summaryNumber: {
      fontSize: '24px',
      fontWeight: '700',
    },
    summaryLabel: {
      fontSize: '12px',
      color: '#888',
      marginTop: '4px',
    },
    footer: {
      padding: '16px 24px',
      borderTop: '1px solid #333',
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
    },
    button: {
      padding: '12px 24px',
      borderRadius: '10px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      border: 'none',
    },
    primaryBtn: {
      backgroundColor: '#3b82f6',
      color: 'white',
    },
    secondaryBtn: {
      backgroundColor: '#333',
      color: '#fff',
    },
  };

  return (
    <motion.div
      style={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        style={styles.modal}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Zap size={22} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>
                Diagnóstico del Sistema
              </h2>
              <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>
                Verifica el estado de todos los servicios
              </p>
            </div>
          </div>
          <button
            style={styles.closeBtn}
            onClick={onClose}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Progress Bar */}
          {(isRunning || progress > 0) && (
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
          )}

          {/* Test List */}
          <div style={styles.testList}>
            {DIAGNOSTIC_TESTS.map((test) => {
              const result = testResults[test.id];
              const Icon = test.icon;
              const isActive = currentTest === test.id;

              return (
                <motion.div
                  key={test.id}
                  style={{
                    ...styles.testItem,
                    borderColor: isActive ? '#3b82f6' : '#333',
                    backgroundColor: isActive ? '#1e3a5f' : '#242424',
                  }}
                  animate={{
                    scale: isActive ? 1.02 : 1,
                  }}
                >
                  <div style={{
                    ...styles.testIcon,
                    backgroundColor: result?.status === TEST_STATUS.SUCCESS ? '#22c55e22' :
                                    result?.status === TEST_STATUS.FAILED ? '#ef444422' :
                                    result?.status === TEST_STATUS.WARNING ? '#f59e0b22' :
                                    '#333',
                  }}>
                    <Icon size={20} style={{
                      color: result?.status === TEST_STATUS.SUCCESS ? '#22c55e' :
                             result?.status === TEST_STATUS.FAILED ? '#ef4444' :
                             result?.status === TEST_STATUS.WARNING ? '#f59e0b' :
                             '#888',
                    }} />
                  </div>

                  <div style={styles.testInfo}>
                    <div style={styles.testName}>{test.name}</div>
                    <div style={styles.testDesc}>{test.description}</div>
                    {result?.message && (
                      <div style={{
                        ...styles.testResult,
                        color: result.status === TEST_STATUS.SUCCESS ? '#22c55e' :
                               result.status === TEST_STATUS.FAILED ? '#ef4444' :
                               result.status === TEST_STATUS.WARNING ? '#f59e0b' :
                               '#888',
                      }}>
                        {result.message}
                      </div>
                    )}
                  </div>

                  <div style={styles.testStatus}>
                    {renderStatusIcon(result?.status || TEST_STATUS.PENDING)}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Summary */}
          {Object.keys(testResults).length > 0 && !isRunning && (
            <motion.div
              style={styles.summary}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={styles.summaryItem}>
                <div style={{ ...styles.summaryNumber, color: '#22c55e' }}>
                  {summary.success}
                </div>
                <div style={styles.summaryLabel}>Exitosos</div>
              </div>
              <div style={styles.summaryItem}>
                <div style={{ ...styles.summaryNumber, color: '#f59e0b' }}>
                  {summary.warning}
                </div>
                <div style={styles.summaryLabel}>Advertencias</div>
              </div>
              <div style={styles.summaryItem}>
                <div style={{ ...styles.summaryNumber, color: '#ef4444' }}>
                  {summary.failed}
                </div>
                <div style={styles.summaryLabel}>Fallidos</div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          {Object.keys(testResults).length > 0 && (
            <button
              style={{ ...styles.button, ...styles.secondaryBtn }}
              onClick={resetTests}
              disabled={isRunning}
            >
              <RotateCcw size={18} />
              Reiniciar
            </button>
          )}
          <button
            style={{
              ...styles.button,
              ...styles.primaryBtn,
              opacity: isRunning ? 0.7 : 1,
              cursor: isRunning ? 'not-allowed' : 'pointer',
            }}
            onClick={runAllTests}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Ejecutando...
              </>
            ) : (
              <>
                <Play size={18} />
                {Object.keys(testResults).length > 0 ? 'Ejecutar de nuevo' : 'Iniciar Diagnóstico'}
              </>
            )}
          </button>
        </div>

        {/* CSS for spin animation */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
};

export default DiagnosticModal;
