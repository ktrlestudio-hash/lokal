/**********************************************************************
 * 📁 types.ts
 * Tipos base del sistema LOKAL (NO TOCAR MUCHO)
 **********************************************************************/

export type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  place_id: string;
  source: "google" | "manual";
  type: "external";
};

export type LokalStore = {
  id: string;
  place_id: string;
  custom_name?: string;
  logo?: string;
  colors?: string;
  description?: string;
  type: "lokal";
};

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  type: "lokal" | "external";
  data: {
    name: string;
    place_id: string;
    logo?: string;
  };
};



/**********************************************************************
 * 📁 utils.ts
 * Mergea lugares + tiendas → formato final para TU MAPA
 **********************************************************************/

export function mergePlacesWithStores(
  places: Place[],
  stores: LokalStore[]
): MapPin[] {
  return places.map((place) => {
    const store = stores.find((s) => s.place_id === place.place_id);

    return {
      id: place.id,
      lat: place.lat,
      lng: place.lng,
      type: store ? "lokal" : "external",
      data: {
        name: store?.custom_name || place.name,
        place_id: place.place_id,
        logo: store?.logo,
      },
    };
  });
}



/**********************************************************************
 * 📁 ingest.ts
 * 🔥 IMPORTAR LUGAR DESDE LINK DE GOOGLE MAPS
 *
 * NOTA:
 * - Esto es versión MVP (funciona pero no perfecta)
 * - PRO: usar Google Places API para place_id real
 **********************************************************************/

export async function createPlaceFromGoogleLink(url: string): Promise<Place | null> {
  try {
    // 🔁 resolver redirección del link corto
    const response = await fetch(url, {
      redirect: "follow",
    });

    const finalUrl = response.url;

    // 📍 extraer coordenadas
    const latLngMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

    const lat = latLngMatch ? parseFloat(latLngMatch[1]) : 0;
    const lng = latLngMatch ? parseFloat(latLngMatch[2]) : 0;

    // 🏷️ nombre del lugar
    const nameMatch = finalUrl.match(/\/place\/([^/]+)/);
    const name = nameMatch
      ? decodeURIComponent(nameMatch[1].replace(/\+/g, " "))
      : "Lugar";

    // ⚠️ ID temporal (REEMPLAZAR en futuro con Google Places)
    const place_id = `temp_${Date.now()}`;

    return {
      id: `place_${Date.now()}`,
      name,
      lat,
      lng,
      place_id,
      source: "google",
      type: "external",
    };
  } catch (error) {
    console.error("❌ Error creando place:", error);
    return null;
  }
}



/**********************************************************************
 * 📁 store.ts
 * Convertir un lugar en tienda LOKAL (CLAIM)
 **********************************************************************/

export function claimStore(place: Place): LokalStore {
  return {
    id: `store_${Date.now()}`,
    place_id: place.place_id,
    custom_name: place.name,
    type: "lokal",
  };
}



/**********************************************************************
 * 📁 example-usage.ts (🔥 USO REAL EN TU SISTEMA)
 *
 * ESTE ES EL BLOQUE IMPORTANTE PARA VOS
 **********************************************************************/

async function exampleFlow() {
  // 🧠 1. ADMIN PEGA LINK
  const googleMapsLink = "https://maps.app.goo.gl/g5Uuh1Q63Vkd7Yf8A";

  const newPlace = await createPlaceFromGoogleLink(googleMapsLink);

  if (!newPlace) return;

  console.log("📍 Lugar creado:", newPlace);

  // 💾 2. GUARDAR EN TU BACKEND (ejemplo)
  // await fetch("/api/places", { method: "POST", body: JSON.stringify(newPlace) });

  // 🧠 3. SIMULAMOS DATA EXISTENTE
  const places: Place[] = [newPlace];
  const stores: LokalStore[] = [];

  // 🎯 4. GENERAR PINES PARA TU MAPA
  const pins = mergePlacesWithStores(places, stores);

  console.log("🗺️ Pines:", pins);

  /**
   * 👉 ACA ES DONDE VOS CONECTÁS TU MAPA REAL
   *
   * renderPins(pins)
   */

  // 🏪 5. SIMULAR CLAIM
  const newStore = claimStore(newPlace);

  const updatedStores = [...stores, newStore];

  const updatedPins = mergePlacesWithStores(places, updatedStores);

  console.log("🟣 Pines luego de claim:", updatedPins);
}

exampleFlow();



/**********************************************************************
 * 🧠 NOTAS IMPORTANTES (LEER ESTO)
 **********************************************************************/

/**
 * 🔥 ESTADO ACTUAL:
 * ✔ ya podés pegar links
 * ✔ generar lugares
 * ✔ transformarlos en tiendas
 * ✔ renderizar pines híbridos
 *
 * 🚀 SIGUIENTE NIVEL:
 *
 * 1. Reemplazar place_id temporal con Google Places API
 * 2. Guardar datos en base real (DB)
 * 3. Evitar duplicados por place_id
 * 4. UI:
 *    - botón "Importar desde Google Maps"
 *    - botón "Reclamar negocio"
 *
 * 💡 IDEA CLAVE:
 *
 * Esto NO es un mapa.
 * Es un sistema de adquisición de negocios.
 *
 * → descubrimiento
 * → conversión (claim)
 * → fidelización (vidriera)
 *
 */
