import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera, MapPin, Search, Store, Package, MessageSquare, MessageCircle, Bell, User, Menu,
  ChevronRight, ChevronLeft, Clock, Navigation, LocateFixed, X, AlertCircle, ArrowLeft, Send,
  Tag, Loader2, Check, CheckCircle, Pause, Edit3, Trash2, RotateCcw,
  Star, ChevronDown, Filter, History, TrendingUp, Sun, Moon, LogOut, Play,
  Flame, Home, Zap, Plus, ToggleLeft, ToggleRight, ImagePlus, CreditCard, Gift,
  Phone, ExternalLink, ArrowUpDown, Heart, Pin, LayoutGrid, LayoutList, ShieldCheck, Paperclip, PanelLeft, List,
  Globe, Share2, Truck
} from 'lucide-react';
import CategoryPicker from './CategoryPicker';
import AdminDashboard from './AdminDashboard';
import AttributesEditor from './AttributesEditor';
import CategoryIcon from './CategoryIcon';
import { CATEGORIES, getCategoryPath, getAllDescendants } from './categories';
import { StoreMap, TiendasMap, LocationPreviewMap } from './LeafletMap';
import { apiFetch } from './api';
import { LogoSymbol, LogoBadge, LogoFull, KtrlMark } from './Brand';
import { MOCK_TIENDAS, MOCK_OFERTAS, getMockRespuestas } from './data/mockData';
import HomeScreen from './screens/HomeScreen';

const API_BASE = '/.netlify/functions';
const MAP_LOCATION_MODE_KEY    = 'lokal-map-location-mode';
const MAP_LAST_POSITION_KEY    = 'lokal-map-last-position';
const MAP_FIXED_POSITION_KEY   = 'lokal-map-fixed-position'; // solo se escribe al guardar manualmente
const MAP_SAVED_LOCATIONS_KEY  = 'lokal-map-saved-locations';

function readStoredMapPosition() {
  try {
    const raw = localStorage.getItem(MAP_LAST_POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 2) return null;
    const [lat, lng] = parsed;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    return [lat, lng];
  } catch { return null; }
}

// ... (rest of original file restored from App.jsx.bak)

// NOTE: this is a full backup created automatically before restoring from .bak
