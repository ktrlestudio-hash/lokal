import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, MapPin, Search, Store, Package, MessageSquare, Bell, User,
  ChevronRight, Clock, Navigation, X, AlertCircle, ArrowLeft, Send,
  Tag, Loader2, CheckCircle, Pause, Edit3, Trash2, RotateCcw,
  Star, ChevronDown, Filter, History, TrendingUp, Sun, Moon, LogOut
} from 'lucide-react';
import CategoryPicker from '../CategoryPicker';
import AttributesEditor from '../AttributesEditor';
import CategoryIcon from '../CategoryIcon';
import { CATEGORIES, getCategoryPath, getAllDescendants } from '../categories';

const API_BASE = '/.netlify/functions';

const KtrlLogo = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 1629.2 404.35" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M838.15,41.28v74.06c0,20.45-16.58,37.03-37.03,37.03h-55.55c-10.23,0-18.52,8.29-18.52,18.52v191.9c0,20.6-16.7,37.3-37.3,37.3h-73.53c-20.6,0-37.3-16.7-37.3-37.3v-191.86c0-10.24-8.31-18.54-18.56-18.52l-55.43.15c-20.48.04-37.11-16.55-37.11-37.03V41.28c0-20.45,16.58-37.03,37.03-37.03h296.26c20.45,0,37.03,16.58,37.03,37.03Z"/>
    <path d="M1629.2,289.56v74.06c0,20.45-16.58,37.03-37.03,37.03h-222.19c-20.45,0-37.03-16.58-37.03-37.03V41.84c0-20.45,16.58-37.03,37.03-37.03h74.06c20.45,0,37.03,16.58,37.03,37.03v192.17c0,10.23,8.29,18.52,18.52,18.52h92.58c20.45,0,37.03,16.58,37.03,37.03Z"/>
    <path d="M1098.1,152.38h-56.26c-10.23,0-18.52,8.29-18.52,18.52v191.97c0,20.45-16.58,37.03-37.03,37.03h-74.08c-20.45,0-37.03-16.58-37.03-37.03V78.31c0-40.9,33.16-74.06,74.06-74.06h247.71c40.9,0,74.06,33.16,74.06,74.06v100.72c0,9.82-3.9,19.24-10.85,26.19l-52.61,52.6c-6.78,6.72-8.03,18.46-.12,26.36l52.77,52.75c23.34,23.34,6.8,63.25-26.21,63.22l-95.66-.07c-9.82,0-19.24-3.9-26.19-10.85l-40.95-40.95c-6.94-6.94-10.85-16.36-10.85-26.19v-71.94c0-9.82,3.9-19.24,10.85-26.19l39.99-39.99c11.66-11.66,3.4-31.61-13.09-31.61Z"/>
    <path d="M83.04,14.06L10.79,86.32C3.88,93.22,0,102.59,0,112.36v179.62c0,9.77,3.88,19.14,10.79,26.05l72.26,72.26c23.21,23.21,62.88,6.77,62.88-26.05V40.11c0-32.82-39.68-49.25-62.88-26.05Z"/>
    <path d="M416.11,340.58l-52.97,52.97c-14.39,14.39-37.71,14.39-52.09,0l-117.4-117.4c-6.97-6.97-10.88-16.41-10.88-26.27v-95.43c0-9.85,3.91-19.3,10.88-26.27L311.04,10.79c14.39-14.39,37.71-14.39,52.09,0l52.97,52.97c14.39,14.39,14.39,37.71,0,52.09l-73.29,73.29c-7.19,7.19-7.19,18.85,0,26.05l73.29,73.29c14.39,14.39,14.39,37.71,0,52.09Z"/>
  </svg>
);

const TIENDA_REPLIES = [
  'Si, tenemos stock. Pasa cuando quieras.',
  'Te lo separamos hasta manana si nos avisas.',
  'El precio incluye garantia de 6 meses.',
  'Tambien hacemos envio a domicilio.',
  'Que horario te queda mejor para venir?',
  'Tenemos varios modelos, cual preferis?',
];


// ─── Helpers ─────────────────────────────────────────────────────────────────
function tiempoRelativo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Hace un momento';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

// (file copied from src/App.jsx.bak on 2026-05-20)

export default null;
