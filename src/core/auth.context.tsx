/**
 * LOKAL Auth & Identity Context
 * Maneja la identidad única del usuario con roles dinámicos
 * Filosofía: UNA identidad con múltiples capacidades (no múltiples cuentas)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile, StoreProfile, UserCapabilities } from '../types/index';

// ─────────────────────────────────────────────────────────────────────────────
// Context Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthContextType {
  // Estado actual
  currentUser: UserProfile | null;
  currentStore: StoreProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Modo actual (contexto en que está navegando)
  currentMode: 'user' | 'store';
  capabilities: UserCapabilities;

  // Acciones
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  switchMode: (mode: 'user' | 'store', storeId?: string) => void;
  switchStore: (storeId: string) => void;
  enableCapability: (capability: keyof UserCapabilities, enabled: boolean) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Creation
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentStore, setCurrentStore] = useState<StoreProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [currentMode, setCurrentMode] = useState<'user' | 'store'>('user');
  const [capabilities, setCapabilities] = useState<UserCapabilities>({
    canCreateDemandas: true,
    canExploreMap: true,
    canApplyForJobs: false,
    canPublishServices: false,
    canPublishJobs: false,
    canPublishProducts: false,
    canAccessStats: false,
    canCreateMiniWeb: false,
    canManageStore: false,
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Initialize Auth (Firebase check en Root.jsx)
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Aquí van las llamadas a Firebase/API para verificar usuario
        // Por ahora mock, será implementado en Root.jsx
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auth failed');
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // Update capabilities based on roles
  // ──────────────────────────────────────────────────────────────────────────

  const updateCapabilities = useCallback((user: UserProfile | null) => {
    if (!user) {
      setCapabilities({
        canCreateDemandas: false,
        canExploreMap: false,
        canApplyForJobs: false,
        canPublishServices: false,
        canPublishJobs: false,
        canPublishProducts: false,
        canAccessStats: false,
        canCreateMiniWeb: false,
        canManageStore: false,
      });
      return;
    }

    const newCapabilities: UserCapabilities = {
      canCreateDemandas: true,
      canExploreMap: true,
      canApplyForJobs: user.roles.includes('user'),
      canPublishServices: user.roles.includes('entrepreneur') || user.roles.includes('verified_store'),
      canPublishJobs: user.roles.includes('verified_store'),
      canPublishProducts: user.roles.includes('entrepreneur') || user.roles.includes('verified_store'),
      canAccessStats: user.roles.includes('verified_store'),
      canCreateMiniWeb: user.roles.includes('verified_store'),
      canManageStore: user.roles.includes('verified_store'),
    };

    setCapabilities(newCapabilities);
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // Login
  // ──────────────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // API call será en Root.jsx con Firebase
        // Aquí es solo el contexto que actualiza state

        // Mock para desarrollo
        const mockUser: UserProfile = {
          id: 'user-123',
          email,
          displayName: 'Usuario',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          roles: ['user'],
          capabilities: {},
          reputation: { rating: 5, reviewCount: 0, completionRate: 100 },
          stats: { profileViews: 0, interactions: 0, savedItems: 0, applications: 0 },
          lastActiveAt: new Date().toISOString(),
          isVerified: false,
          isSuspended: false,
        };

        setCurrentUser(mockUser);
        updateCapabilities(mockUser);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Login failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [updateCapabilities]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Logout
  // ──────────────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      // Firebase signOut en Root.jsx
      setCurrentUser(null);
      setCurrentStore(null);
      setCurrentMode('user');
      updateCapabilities(null);
    } finally {
      setIsLoading(false);
    }
  }, [updateCapabilities]);

  // ──────────────────────────────────────────────────────────────────────────
  // Update Profile
  // ──────────────────────────────────────────────────────────────────────────

  const updateProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!currentUser) throw new Error('No user logged in');

      try {
        setIsLoading(true);
        // API call aquí

        const updated = { ...currentUser, ...data, updatedAt: new Date().toISOString() };
        setCurrentUser(updated);
        updateCapabilities(updated);
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser, updateCapabilities]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Switch Mode (usuario ↔ tienda)
  // ──────────────────────────────────────────────────────────────────────────

  const switchMode = useCallback(
    (mode: 'user' | 'store', storeId?: string) => {
      if (mode === 'store' && storeId) {
        // En el futuro: cargar datos de la tienda
        setCurrentMode('store');
      } else if (mode === 'user') {
        setCurrentMode('user');
        setCurrentStore(null);
      }
    },
    []
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Switch Store
  // ──────────────────────────────────────────────────────────────────────────

  const switchStore = useCallback((storeId: string) => {
    // En el futuro: cargar store
    console.log(`Switching to store: ${storeId}`);
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // Enable/Disable Capability
  // ──────────────────────────────────────────────────────────────────────────

  const enableCapability = useCallback(
    (capability: keyof UserCapabilities, enabled: boolean) => {
      setCapabilities(prev => ({
        ...prev,
        [capability]: enabled,
      }));
    },
    []
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Provide context
  // ──────────────────────────────────────────────────────────────────────────

  const value: AuthContextType = {
    currentUser,
    currentStore,
    isAuthenticated: !!currentUser,
    isLoading,
    error,
    currentMode,
    capabilities,
    login,
    logout,
    updateProfile,
    switchMode,
    switchStore,
    enableCapability,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Hook: useAuth
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }

  return context;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook para verificar si usuario tiene una capability específica
 */
export function useCapability(capability: keyof UserCapabilities): boolean {
  const { capabilities } = useAuth();
  return capabilities[capability];
}

/**
 * Hook para verificar si usuario tiene cierto rol
 */
export function useRole(role: string): boolean {
  const { currentUser } = useAuth();
  return currentUser?.roles.includes(role) ?? false;
}

/**
 * Hook para verificar si está en modo específico
 */
export function useMode(mode: 'user' | 'store'): boolean {
  const { currentMode } = useAuth();
  return currentMode === mode;
}
