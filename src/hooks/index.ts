/**
 * LOKAL Custom Hooks
 * Hooks personalizados reutilizables para lógica común
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// useLocalStorage: Sincronizar state con localStorage
// ─────────────────────────────────────────────────────────────────────────────

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// ─────────────────────────────────────────────────────────────────────────────
// useAsync: Manejar estados de async operations
// ─────────────────────────────────────────────────────────────────────────────

export interface AsyncState<T> {
  status: 'idle' | 'pending' | 'success' | 'error';
  data?: T;
  error?: Error;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
): AsyncState<T> & { execute: () => Promise<T> } {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
  });

  const execute = useCallback(async () => {
    setState({ status: 'pending' });
    try {
      const response = await asyncFunction();
      setState({ status: 'success', data: response });
      return response;
    } catch (error) {
      setState({
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
}

// ─────────────────────────────────────────────────────────────────────────────
// useFetch: Fetch con cacheo opcional
// ─────────────────────────────────────────────────────────────────────────────

const fetchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 min

export function useFetch<T>(
  url: string,
  options: {
    method?: string;
    cache?: boolean;
    cacheDuration?: number;
  } = {}
): AsyncState<T> & { refetch: () => Promise<T> } {
  const { method = 'GET', cache = false, cacheDuration = CACHE_DURATION } =
    options;

  const refetch = useCallback(async () => {
    // Verificar cache
    if (cache && method === 'GET') {
      const cached = fetchCache.get(url);
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        return cached.data;
      }
    }

    const response = await fetch(url, { method });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (cache && method === 'GET') {
      fetchCache.set(url, { data, timestamp: Date.now() });
    }

    return data;
  }, [url, method, cache, cacheDuration]);

  const asyncState = useAsync(() => refetch(), true);

  return { ...asyncState, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// useDebounce: Debounce para valores que cambian frecuentemente
// ─────────────────────────────────────────────────────────────────────────────

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ─────────────────────────────────────────────────────────────────────────────
// useThrottle: Throttle para eventos frecuentes
// ─────────────────────────────────────────────────────────────────────────────

export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();

    if (now >= lastUpdated.current + delay) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, delay - (now - lastUpdated.current));

      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return throttledValue;
}

// ─────────────────────────────────────────────────────────────────────────────
// usePrevious: Acceso al valor previo
// ─────────────────────────────────────────────────────────────────────────────

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ─────────────────────────────────────────────────────────────────────────────
// useGeolocation: Ubicación del navegador
// ─────────────────────────────────────────────────────────────────────────────

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy: number;
}

export function useGeolocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation no soportado');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      position => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setError(null);
        setLoading(false);
      },
      err => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, []);

  return { location, error, loading, requestLocation };
}

// ─────────────────────────────────────────────────────────────────────────────
// useIntersectionObserver: Lazy loading / infinite scroll
// ─────────────────────────────────────────────────────────────────────────────

export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return [ref, isVisible];
}

// ─────────────────────────────────────────────────────────────────────────────
// useToggle: Simple boolean toggle
// ─────────────────────────────────────────────────────────────────────────────

export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(v => !v);
  }, []);

  const setSpecific = useCallback((val: boolean) => {
    setValue(val);
  }, []);

  return [value, toggle, setSpecific];
}

// ─────────────────────────────────────────────────────────────────────────────
// useForm: Manejo de formularios simple
// ─────────────────────────────────────────────────────────────────────────────

export interface UseFormOptions<T> {
  initialValues: T;
  onSubmit?: (values: T) => void | Promise<void>;
}

export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
) {
  const [values, setValues] = useState(options.initialValues);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as any);
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as any);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      setValues(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    },
    []
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<any>) => {
      const { name } = e.target;
      setTouched(prev => ({ ...prev, [name]: true }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        await options.onSubmit?.(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, options]
  );

  const reset = useCallback(() => {
    setValues(options.initialValues);
    setTouched({} as any);
    setErrors({} as any);
  }, [options.initialValues]);

  return {
    values,
    touched,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    reset,
    setFieldValue: (field: keyof T, value: any) => {
      setValues(prev => ({ ...prev, [field]: value }));
    },
    setFieldError: (field: keyof T, error: string) => {
      setErrors(prev => ({ ...prev, [field]: error }));
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useMounted: Verifica si componente está montado
// ─────────────────────────────────────────────────────────────────────────────

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

// ─────────────────────────────────────────────────────────────────────────────
// useClickOutside: Detecta clicks fuera de elemento
// ─────────────────────────────────────────────────────────────────────────────

export function useClickOutside<T extends HTMLElement>(
  callback: () => void
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callback]);

  return ref;
}

// ─────────────────────────────────────────────────────────────────────────────
// useWindowSize: Track window size para responsive design
// ─────────────────────────────────────────────────────────────────────────────

export interface WindowSize {
  width: number | undefined;
  height: number | undefined;
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}
