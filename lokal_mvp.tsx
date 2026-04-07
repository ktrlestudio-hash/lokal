import React, { useState } from 'react';
import { Camera, MapPin, Search, Store, Package, MessageSquare, Bell, User, ChevronRight, Clock, Navigation, X, AlertCircle, Zap, ShoppingBag, ArrowLeft, Send, Tag } from 'lucide-react';

const LokalApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedDemanda, setSelectedDemanda] = useState(null);
  const [selectedTienda, setSelectedTienda] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChat, setShowChat] = useState(null);
  const [filterWarning, setFilterWarning] = useState(false);
  const [selectedRubros, setSelectedRubros] = useState([]);
  const [activeTab, setActiveTab] = useState('demandas');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  const allDemandas = [
    { 
      id: 1, 
      titulo: 'Cable USB-C a HDMI 2 metros', 
      descripcion: 'Necesito un cable para conectar mi notebook al monitor',
      respuestas: 3, 
      estado: 'activa',
      foto: '📱',
      tiempoCreado: 'Hace 2 horas'
    },
    { 
      id: 2, 
      titulo: 'Tornillos para madera 6x40mm', 
      descripcion: 'Aproximadamente 50 unidades para proyecto de carpintería',
      respuestas: 5, 
      estado: 'activa',
      foto: '🔩',
      tiempoCreado: 'Hace 5 horas'
    },
    { 
      id: 3, 
      titulo: 'Adaptador corriente 12V 2A', 
      descripcion: 'Para router TP-Link, el original se rompió',
      respuestas: 0, 
      estado: 'pendiente',
      foto: '🔌',
      tiempoCreado: 'Hace 30 min'
    }
  ];

  const ofertas = [
    {
      id: 1,
      tienda: 'TecnoStore',
      titulo: 'Mouse Logitech G203',
      descripcion: 'Gaming RGB, 8000 DPI, cable USB',
      precio: 15900,
      foto: '🖱️',
      distancia: '0.8 km',
      tiempoPublicado: 'Hace 1 día'
    },
    {
      id: 2,
      tienda: 'Ferretería Central',
      titulo: 'Taladro percutor 13mm',
      descripcion: 'Incluye 10 mechas y maletín',
      precio: null,
      foto: '🔨',
      distancia: '0.5 km',
      tiempoPublicado: 'Hace 3 días'
    },
    {
      id: 3,
      tienda: 'CompuMundo',
      titulo: 'Teclado mecánico',
      descripcion: 'Switches blue, retroiluminado RGB',
      precio: 28500,
      foto: '⌨️',
      distancia: '2.5 km',
      tiempoPublicado: 'Hace 2 horas'
    }
  ];

  const notifications = [
    { id: 1, tipo: 'respuesta', mensaje: 'TecnoStore respondió tu demanda', tiempo: 'Hace 5 min', leido: false },
    { id: 2, tipo: 'oferta', mensaje: 'Nueva oferta cerca: Mouse Gaming', tiempo: 'Hace 1 hora', leido: false },
    { id: 3, tipo: 'sistema', mensaje: 'Tu demanda fue vista por 8 tiendas', tiempo: 'Hace 2 horas', leido: true }
  ];

  const tiendas = [
    { id: 1, nombre: 'TecnoStore', rubro: 'Electrónica y Computación', distancia: '0.8 km', rating: 4.7, foto: '📱', horario: 'Abierto hasta 20:00' },
    { id: 2, nombre: 'Electro Total', rubro: 'Electrónica', distancia: '1.2 km', rating: 4.5, foto: '⚡', horario: 'Cierra a las 19:00' },
    { id: 3, nombre: 'Ferretería Central', rubro: 'Ferretería y Construcción', distancia: '0.5 km', rating: 4.8, foto: '🔧', horario: 'Abierto ahora' },
    { id: 4, nombre: 'CompuMundo', rubro: 'Computación', distancia: '2.5 km', rating: 4.6, foto: '💻', horario: 'Abierto hasta 21:00' }
  ];

  const filteredDemandas = allDemandas.filter(d => 
    d.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOfertas = ofertas.filter(o => 
    o.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sidebar Desktop
  const DesktopSidebar = () => (
    <div className="hidden lg:flex lg:flex-col w-72 bg-white border-r-2 border-slate-200 h-screen sticky top-0">
      <div className="p-6 border-b-2 border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-md">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lokal</h1>
            <p className="text-xs text-slate-500">Encontrá lo que buscás</p>
          </div>
        </div>

        <button
          onClick={() => setCurrentScreen('crear')}
          className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-center gap-3">
            <Camera className="w-5 h-5" />
            <span className="font-bold">Nueva Demanda</span>
          </div>
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => {
            setCurrentScreen('home');
            setActiveTab('demandas');
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            currentScreen === 'home' && activeTab === 'demandas'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="font-semibold">Mis Demandas</span>
        </button>

        <button
          onClick={() => {
            setCurrentScreen('home');
            setActiveTab('ofertas');
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            currentScreen === 'home' && activeTab === 'ofertas'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-5 h-5" />
          <span className="font-semibold">Ofertas</span>
        </button>

        <button
          onClick={() => setCurrentScreen('tiendas')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            currentScreen === 'tiendas'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Store className="w-5 h-5" />
          <span className="font-semibold">Tiendas</span>
        </button>
      </nav>

      <div className="p-4 border-t-2 border-slate-200 space-y-2">
        <button
          onClick={() => setShowNotifications(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 transition-all relative"
        >
          <Bell className="w-5 h-5" />
          <span className="font-semibold">Notificaciones</span>
          {notifications.filter(n => !n.leido).length > 0 && (
            <span className="absolute right-4 w-2 h-2 bg-rose-500 rounded-full"></span>
          )}
        </button>

        <button
          onClick={() => setShowProfile(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 transition-all"
        >
          <User className="w-5 h-5" />
          <span className="font-semibold">Mi Perfil</span>
        </button>
      </div>
    </div>
  );

  // Modales y pantallas (simplificadas para evitar errores)
  const NotificationsModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-auto">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="font-bold text-lg">Notificaciones</h2>
          <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>
          {notifications.map(n => (
            <div key={n.id} className={`p-4 border-b ${!n.leido ? 'bg-emerald-50' : ''}`}>
              <p className="font-semibold text-sm">{n.mensaje}</p>
              <p className="text-xs text-slate-500 mt-1">{n.tiempo}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ProfileModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md">
        <div className="p-5 border-b border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">Mi Perfil</h2>
            <button onClick={() => setShowProfile(false)} className="p-2 hover:bg-slate-100 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl">👤</div>
            <div>
              <h3 className="font-bold">Usuario Demo</h3>
              <p className="text-sm text-slate-600">demo@lokal.app</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-2">
          <button className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl font-semibold">Mis datos</button>
          <button className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl font-semibold">Historial</button>
          <button className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl font-semibold text-rose-600">Cerrar sesión</button>
        </div>
      </div>
    </div>
  );

  const ChatModal = ({ tienda }) => (
    <div className="fixed inset-0 lg:inset-auto lg:right-8 lg:bottom-8 lg:w-96 lg:h-[600px] bg-white z-50 flex flex-col lg:rounded-3xl lg:shadow-2xl lg:border-2 border-slate-200">
      <div className="bg-white border-b-2 border-slate-200 p-4 lg:rounded-t-3xl">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowChat(null)} className="p-2 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-xl">{tienda.foto}</div>
            <div>
              <h3 className="font-bold">{tienda.tienda}</h3>
              <p className="text-xs text-emerald-600 font-semibold">En línea</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
        <div className="bg-white rounded-2xl p-3 max-w-[75%] shadow-sm">
          <p className="text-sm">{tienda.mensaje}</p>
          <p className="text-xs text-slate-500 mt-1">{tienda.tiempoRespuesta}</p>
        </div>
        <div className="flex justify-end">
          <div className="bg-slate-900 rounded-2xl p-3 max-w-[75%]">
            <p className="text-sm text-white">Hola! Me interesa. ¿Tenés stock?</p>
            <p className="text-xs text-slate-400 mt-1">Ahora</p>
          </div>
        </div>
      </div>
      <div className="bg-white border-t-2 border-slate-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Escribí tu mensaje..."
            className="flex-1 px-4 py-3 bg-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
          <button className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );

  const HomeScreen = () => {
    const displayItems = activeTab === 'demandas' ? filteredDemandas : filteredOfertas;

    return (
      <div className="min-h-screen bg-slate-50 pb-28 lg:pb-8">
        {/* Header Mobile */}
        <div className="lg:hidden bg-white sticky top-0 z-10 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 bg-emerald-500 rounded-2xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold">Lokal</h1>
                <p className="text-xs text-slate-500">Encontrá lo que buscás</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNotifications(true)} className="p-2 hover:bg-slate-100 rounded-xl relative">
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.leido).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
                )}
              </button>
              <button onClick={() => setShowProfile(true)} className="p-2 hover:bg-slate-100 rounded-xl">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-12 pr-4 py-3 bg-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm">
            <button 
              onClick={() => setActiveTab('demandas')}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm ${
                activeTab === 'demandas' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Mis Demandas
            </button>
            <button 
              onClick={() => setActiveTab('ofertas')}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm ${
                activeTab === 'ofertas' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Ofertas
            </button>
          </div>
        </div>

        {/* Header Desktop */}
        <div className="hidden lg:block bg-white border-b-2 border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{activeTab === 'demandas' ? 'Mis Demandas' : 'Ofertas'}</h2>
              <p className="text-sm text-slate-600">
                {activeTab === 'demandas' ? 'Tus búsquedas activas' : 'Productos de tiendas locales'}
              </p>
            </div>
            <div className="relative w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-12 pr-4 py-3 bg-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* CTA Mobile */}
        <div className="lg:hidden px-5 pt-6 pb-5">
          <button
            onClick={() => setCurrentScreen('crear')}
            className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl p-5 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Camera className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg">¿Qué estás buscando?</p>
                  <p className="text-emerald-50 text-sm">Publicá tu demanda</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6" />
            </div>
          </button>
        </div>

        {/* Grid de items */}
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg">{activeTab === 'demandas' ? 'Activas' : 'Destacadas'}</h3>
            <span className="text-sm text-slate-500">{displayItems.length} items</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeTab === 'demandas' ? (
              filteredDemandas.map(d => (
                <div
                  key={d.id}
                  onClick={() => {
                    setSelectedDemanda(d);
                    setCurrentScreen('detalle');
                  }}
                  className="bg-white rounded-3xl border p-5 hover:shadow-lg cursor-pointer transition-all"
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center text-3xl">
                      {d.foto}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{d.titulo}</h3>
                      <p className="text-sm text-slate-600 mb-2">{d.descripcion}</p>
                      <div className="flex gap-3 text-xs text-slate-500">
                        <span>{d.tiempoCreado}</span>
                        {d.respuestas > 0 && (
                          <span className="text-emerald-600 font-semibold">{d.respuestas} respuestas</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              filteredOfertas.map(o => (
                <div key={o.id} className="bg-white rounded-3xl border p-5 hover:shadow-lg transition-all">
                  <div className="flex gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center text-3xl">
                      {o.foto}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-bold">{o.titulo}</h3>
                        {o.precio && <p className="font-bold text-emerald-600">${o.precio.toLocaleString()}</p>}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{o.descripcion}</p>
                      <div className="flex gap-2 text-xs">
                        <span className="font-semibold">{o.tienda}</span>
                        <span>•</span>
                        <span>{o.distancia}</span>
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-semibold">
                    Consultar
                  </button>
                </div>
              ))
            )}
          </div>

          {displayItems.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <p className="font-semibold">No se encontraron resultados</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const CrearDemandaScreen = () => {
    const rubrosDisponibles = ['Electrónica', 'Computación', 'Fotografía', 'Ferretería', 'Construcción', 'Hogar'];

    const toggleRubro = (rubro) => {
      if (selectedRubros.includes(rubro)) {
        setSelectedRubros(selectedRubros.filter(r => r !== rubro));
        setFilterWarning(false);
      } else {
        const newRubros = [...selectedRubros, rubro];
        setSelectedRubros(newRubros);
        if (newRubros.length >= 2) setFilterWarning(true);
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="bg-white border-b px-5 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentScreen('home')} className="p-2 hover:bg-slate-100 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">Nueva Demanda</h1>
              <p className="text-xs text-slate-500">Completá los datos</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
          <div>
            <label className="block font-bold mb-3 text-sm">Foto del producto *</label>
            <div className="border-2 border-dashed rounded-3xl p-10 text-center bg-white hover:bg-slate-50 cursor-pointer">
              <Camera className="w-16 h-16 text-emerald-600 mx-auto mb-3" />
              <p className="font-bold mb-2">Subí una foto</p>
              <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold">
                Seleccionar
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-3 text-sm">¿Qué estás buscando? *</label>
            <input
              type="text"
              placeholder="Ej: Cable USB-C a HDMI 2 metros"
              className="w-full px-4 py-4 border-2 rounded-2xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-bold mb-3 text-sm">Descripción</label>
            <textarea
              rows={4}
              placeholder="Contanos más detalles..."
              className="w-full px-4 py-4 border-2 rounded-2xl focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block font-bold mb-3 text-sm">Categorías</label>
            <div className="flex flex-wrap gap-2">
              {rubrosDisponibles.map(r => (
                <button
                  key={r}
                  onClick={() => toggleRubro(r)}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-sm border-2 ${
                    selectedRubros.includes(r)
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {filterWarning && (
              <div className="mt-4 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-amber-900 text-sm">Cuidado con filtrar demasiado</p>
                  <p className="text-amber-700 text-xs">
                    Muchas categorías pueden ocultar tiendas que tienen lo que buscás.
                  </p>
                </div>
              </div>
            )}
          </div>

          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold">
            Publicar Demanda
          </button>
        </div>
      </div>
    );
  };

  const DetalleDemandaScreen = () => {
    const respuestas = [
      {
        id: 1,
        tienda: 'TecnoStore',
        distancia: '0.8 km',
        mensaje: 'Tengo el cable que buscás! Es marca Ugreen, certificado y soporta 4K a 60Hz.',
        precio: 8500,
        foto: '📱',
        tiempoRespuesta: 'Hace 1 hora',
        horario: 'Abierto hasta 20:00',
        rating: 4.7
      },
      {
        id: 2,
        tienda: 'Electro Total',
        distancia: '1.2 km',
        mensaje: 'Tengo cables USB-C a HDMI. Varios modelos desde 1.8m hasta 3m.',
        precio: 7200,
        foto: '⚡',
        tiempoRespuesta: 'Hace 2 horas',
        horario: 'Cierra a las 19:00',
        rating: 4.5
      }
    ];

    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="bg-white border-b px-5 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentScreen('home')} className="p-2 hover:bg-slate-100 rounded-xl lg:hidden">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">Detalle de Demanda</h1>
              <p className="text-xs text-slate-500">Respuestas recibidas</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white border-b px-5 py-6">
            <div className="flex gap-4 mb-5">
              <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl">
                {selectedDemanda?.foto}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg mb-2">{selectedDemanda?.titulo}</h2>
                <p className="text-sm text-slate-600 mb-3">{selectedDemanda?.descripcion}</p>
                <div className="flex gap-2">
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200">
                    ACTIVA
                  </span>
                  <span className="text-xs text-slate-600">{selectedDemanda?.tiempoCreado}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button className="py-2.5 bg-slate-100 rounded-xl text-sm font-semibold">Editar</button>
              <button className="py-2.5 bg-slate-100 rounded-xl text-sm font-semibold">Pausar</button>
              <button className="py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold">Finalizar</button>
            </div>
          </div>

          <div className="px-5 py-6 space-y-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Respuestas</h3>
              <span className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold">
                {respuestas.length} tiendas
              </span>
            </div>

            <div className="grid gap-4">
              {respuestas.map(r => (
                <div key={r.id} className="bg-white rounded-3xl border-2 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl">
                        {r.foto}
                      </div>
                      <div>
                        <h4 className="font-bold">{r.tienda}</h4>
                        <div className="flex gap-2 text-xs mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {r.distancia}
                          </span>
                          <span>★ {r.rating}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{r.tiempoRespuesta}</span>
                  </div>

                  <p className="text-sm bg-slate-50 rounded-2xl p-4 mb-4">{r.mensaje}</p>

                  <div className="flex justify-between mb-4 pb-4 border-b-2">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Precio</p>
                      <p className="text-2xl font-bold">${r.precio.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">Horario</p>
                      <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {r.horario}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setShowChat(r)}
                      className="py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chatear
                    </button>
                    <button 
                      onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(r.tienda)}`, '_blank')}
                      className="py-3 bg-slate-100 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      Navegar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TiendasScreen = () => (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setCurrentScreen('home')} className="p-2 hover:bg-slate-100 rounded-xl lg:hidden">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Tiendas</h1>
            <p className="text-xs text-slate-500">Locales cercanos</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar tiendas..."
            className="w-full pl-12 pr-4 py-3 bg-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tiendas.map(t => (
          <div 
            key={t.id} 
            onClick={() => {
              setSelectedTienda(t);
              setCurrentScreen('tienda-detail');
            }}
            className="bg-white rounded-3xl border-2 p-5 hover:shadow-lg cursor-pointer"
          >
            <div className="flex gap-3 mb-4">
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl">
                {t.foto}
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1">{t.nombre}</h3>
                <p className="text-sm text-slate-600 mb-2">{t.rubro}</p>
                <div className="flex gap-2 text-xs">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {t.distancia}
                  </span>
                  <span>★ {t.rating}</span>
                </div>
              </div>
            </div>
            <div className="mb-4 pb-4 border-b-2">
              <span className="text-sm text-emerald-600 font-bold">{t.horario}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="py-3 bg-slate-900 text-white rounded-xl font-bold">Ver</button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://www.google.com/maps/search/${encodeURIComponent(t.nombre)}`, '_blank');
                }}
                className="py-3 bg-slate-100 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TiendaDetailScreen = ({ tienda }) => (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setSelectedTienda(null);
              setCurrentScreen('tiendas');
            }}
            className="p-2 hover:bg-slate-100 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">{tienda.nombre}</h1>
            <p className="text-xs text-slate-500">{tienda.rubro}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-5 space-y-5">
        <div className="bg-white rounded-3xl border-2 p-6">
          <div className="flex gap-4 mb-5">
            <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center text-3xl">
              {tienda.foto}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-xl mb-1">{tienda.nombre}</h2>
              <p className="text-sm text-slate-600 mb-2">{tienda.rubro}</p>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {tienda.distancia}
                </span>
                <span>★ {tienda.rating}</span>
              </div>
            </div>
          </div>
          <div className="mb-5 pb-5 border-b-2">
            <span className="text-sm text-emerald-600 font-bold">{tienda.horario}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(tienda.nombre)}`, '_blank')}
              className="py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Navegar
            </button>
            <button className="py-3 bg-slate-100 rounded-xl font-bold">Llamar</button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border-2 p-5">
          <h3 className="font-bold mb-3">Información</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-slate-500 font-semibold mb-1">Dirección</p>
              <p>Av. Principal 1234, Centro</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold mb-1">Horario</p>
              <p>Lun - Vie: 9:00 - 20:00</p>
              <p>Sáb: 9:00 - 13:00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <DesktopSidebar />
      
      <div className="flex-1 lg:max-w-none max-w-md mx-auto bg-white lg:bg-slate-50 shadow-2xl lg:shadow-none min-h-screen relative">
        {currentScreen === 'home' && <HomeScreen />}
        {currentScreen === 'crear' && <CrearDemandaScreen />}
        {currentScreen === 'detalle' && <DetalleDemandaScreen />}
        {currentScreen === 'tiendas' && <TiendasScreen />}
        {currentScreen === 'tienda-detail' && selectedTienda && <TiendaDetailScreen tienda={selectedTienda} />}

        {showNotifications && <NotificationsModal />}
        {showProfile && <ProfileModal />}
        {showChat && <ChatModal tienda={showChat} />}

        {/* Bottom Nav Mobile */}
        {currentScreen === 'home' && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t-2 px-6 py-4 shadow-lg">
            <div className="flex items-center justify-around">
              <button className="flex flex-col items-center gap-1.5">
                <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold">Demandas</span>
              </button>
              <button 
                onClick={() => setCurrentScreen('crear')}
                className="flex flex-col items-center -mt-10"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl border-4 border-white">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-bold text-slate-700 mt-1">Crear</span>
              </button>
              <button 
                onClick={() => setCurrentScreen('tiendas')}
                className="flex flex-col items-center gap-1.5 text-slate-500"
              >
                <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <Store className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold">Tiendas</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LokalApp;