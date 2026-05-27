import { requireAuth, ensureSameUserOrAdmin } from './_lib/auth.js';
import { handleError, handleOptions, jsonResponse, parseJsonBody } from './_lib/http.js';
import {
  readUserProfiles,
  writeUserProfiles,
  findUserProfileByUid,
} from './_lib/user-profiles-store.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, OPTIONS',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    // GET — obtener perfil por googleUid (requiere ser el mismo usuario o admin)
    if (event.httpMethod === 'GET') {
      const user = await requireAuth(event);
      const { googleUid } = event.queryStringParameters || {};

      if (!googleUid) {
        return jsonResponse(event, 400, { error: 'Falta googleUid' }, HTTP_OPTIONS);
      }

      ensureSameUserOrAdmin(user, googleUid);

      const profiles = await readUserProfiles();
      const profile = findUserProfileByUid(profiles, googleUid);

      if (!profile) {
        return jsonResponse(event, 404, { error: 'Perfil no encontrado' }, HTTP_OPTIONS);
      }

      return jsonResponse(event, 200, profile, HTTP_OPTIONS);
    }

    // POST — crear o actualizar perfil
    if (event.httpMethod === 'POST') {
      const user = await requireAuth(event);
      const body = await parseJsonBody(event);

      const profiles = await readUserProfiles();
      const existingIndex = profiles.findIndex((p) => p.uid === user.uid);

      const existing = existingIndex >= 0 ? profiles[existingIndex] : {};

      const profile = {
        // Campos base (siempre presentes)
        uid: user.uid,
        email: user.email,
        displayName: body.displayName || user.name || existing.displayName || '',
        photoURL: body.photoURL || user.picture || existing.photoURL || '',
        role: body.role || existing.role || 'usuario',
        zone: body.zone || existing.zone || '',
        bio: body.bio || existing.bio || '',
        skills: Array.isArray(body.skills) ? body.skills : (existing.skills || []),
        onboarded: body.onboarded !== undefined ? body.onboarded : (existing.onboarded || false),
        updatedAt: new Date().toISOString(),
        createdAt: existing.createdAt || new Date().toISOString(),

        // Campos de negocio (emprendimiento/empresa)
        plan: body.plan || existing.plan || null, // 'basico' | 'premium' | null
        businessProfile: body.businessProfile !== undefined
          ? body.businessProfile
          : (existing.businessProfile || null),
        // businessProfile: {
        //   nombre, rubros[], descripcion, direccion, ciudad, telefono,
        //   lat, lng, tieneLocal, slug, tagline, instagram, whatsapp,
        //   horarios{}, galeria[], foto, portada
        // }

        // Suscripción (empresa con plan pago)
        suscripcion: body.suscripcion !== undefined
          ? body.suscripcion
          : (existing.suscripcion || null),
        // suscripcion: {
        //   estado, plan, inicio, vence, esPromo, mpPaymentId, historial[]
        // }

        // CV / perfil laboral (cualquier rol)
        cv: body.cv !== undefined ? body.cv : (existing.cv || null),

        // Stats (empresa)
        stats: body.stats !== undefined ? body.stats : (existing.stats || null),

        // Campos legacy (mantener compatibilidad)
        businessName: body.businessName || existing.businessName || '',
        businessCategory: body.businessCategory || existing.businessCategory || '',
        cvExperience: body.cvExperience || existing.cvExperience || '',
      };

      if (existingIndex >= 0) {
        profiles[existingIndex] = profile;
      } else {
        profiles.push(profile);
      }

      await writeUserProfiles(profiles);
      return jsonResponse(event, 200, profile, HTTP_OPTIONS);
    }

    return jsonResponse(event, 405, { error: 'Metodo no permitido' }, HTTP_OPTIONS);
  } catch (err) {
    return handleError(err, event, HTTP_OPTIONS);
  }
};
