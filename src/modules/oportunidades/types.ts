/**
 * Tipos para el módulo de Oportunidades (Jobs)
 * Trabajos/oportunidades laborales publicadas por tiendas
 */

/**
 * Tipo de empleo
 */
export type JobType = 'full-time' | 'part-time' | 'temporary' | 'freelance' | 'internship';

/**
 * Nivel de experiencia requerido
 */
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'director';

/**
 * Estado de una aplicación a un trabajo
 */
export type ApplicationStatus =
  | 'pending'
  | 'reviewing'
  | 'shortlisted'
  | 'rejected'
  | 'accepted'
  | 'completed';

/**
 * Oportunidad laboral (Job)
 */
export interface JobOpportunity {
  id: string;
  storeId: string; // Tienda que publica el trabajo
  userId: string; // Usuario (store owner) que publica
  title: string; // "Vendedor", "Cajero", etc.
  description: string; // Descripción completa del trabajo
  category: string; // Categoría: "Ventas", "Logística", "Admin", etc.
  salaryMin?: number; // Sueldo mínimo en ARS
  salaryMax?: number; // Sueldo máximo en ARS
  currency?: 'ARS' | 'USD';
  jobType: JobType; // Tipo de contrato
  experienceLevel: ExperienceLevel; // Nivel requerido
  location: {
    lat: number;
    lng: number;
    city: string;
    address?: string;
    radius?: number; // Radio en km si es flexible
  };
  requirements: string[]; // Requisitos (array de strings)
  benefits: string[]; // Beneficios (array de strings)
  totalPositions: number; // Posiciones disponibles
  filledPositions: number; // Posiciones ya cubiertas
  applications: number; // Total de aplicaciones
  status: 'active' | 'paused' | 'closed';
  createdAt: string; // ISO 8601
  updatedAt: string;
  closesAt: string; // Fecha de cierre de aplicaciones
  tags: string[]; // Tags adicionales: #urgente, #conExperiencia
}

/**
 * Input para crear una oportunidad
 */
export interface CreateJobInput {
  title: string;
  description: string;
  category: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: 'ARS' | 'USD';
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  location: {
    lat: number;
    lng: number;
    city: string;
    address?: string;
    radius?: number;
  };
  requirements: string[];
  benefits: string[];
  totalPositions: number;
  closesAt: string;
  tags?: string[];
}

/**
 * Aplicación a un trabajo
 */
export interface JobApplication {
  id: string;
  jobId: string;
  userId: string; // Usuario que aplica
  status: ApplicationStatus;
  resume?: string; // URL o texto del CV
  coverLetter?: string; // Carta de presentación
  contactInfo: {
    email: string;
    phone: string;
  };
  appliedAt: string;
  respondedAt?: string; // Cuando la tienda respondió
  response?: {
    message: string;
    status: ApplicationStatus;
  };
}

/**
 * Input para aplicar a un trabajo
 */
export interface ApplyToJobInput {
  resume?: string;
  coverLetter?: string;
  contactInfo: {
    email: string;
    phone: string;
  };
}

/**
 * Respuesta de tienda a una aplicación
 */
export interface JobApplicationResponse {
  status: ApplicationStatus;
  message: string;
}

/**
 * Filtros para listar trabajos
 */
export interface JobFilters {
  city?: string;
  category?: string;
  jobType?: JobType;
  experienceLevel?: ExperienceLevel;
  minSalary?: number;
  maxSalary?: number;
  keyword?: string;
  status?: 'active' | 'paused' | 'closed';
  tags?: string[];
  storeId?: string; // Para ver mis publicadas
  limit?: number;
  offset?: number;
}
