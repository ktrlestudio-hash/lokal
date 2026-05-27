import { useEffect, useMemo } from "react";
import type { Business, StylePreset, TypographyPreset } from "@/lib/types";

const radiusMap: Record<StylePreset, string> = {
  rounded: "1.25rem",
  sharp: "0.25rem",
  minimal: "0.75rem",
  bold: "1rem",
};

const fontMap: Record<TypographyPreset, { display: string; body: string }> = {
  modern: { display: "'Space Grotesk', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif" },
  friendly: { display: "'DM Sans', system-ui, sans-serif", body: "'DM Sans', system-ui, sans-serif" },
  elegant: { display: "'Fraunces', serif", body: "'Inter', system-ui, sans-serif" },
  condensed: { display: "'Archivo Narrow', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif" },
};

// Given a primary HSL string, derive tenant surface/muted variants.
function deriveSurfaces(primary: string) {
  // primary like "18 85% 42%"
  const match = primary.match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  if (!match) {
    return {
      surface: "0 0% 100%",
      surfaceForeground: "230 25% 12%",
      muted: "230 15% 96%",
      mutedForeground: "230 10% 40%",
      border: "230 15% 90%",
      primaryForeground: "0 0% 100%",
    };
  }
  const h = parseFloat(match[1]);
  const s = parseFloat(match[2]);
  const l = parseFloat(match[3]);
  const primaryForeground = l < 55 ? "0 0% 100%" : "230 30% 12%";
  return {
    surface: "0 0% 100%",
    surfaceForeground: "230 25% 12%",
    muted: `${h} ${Math.min(s, 25)}% 96%`,
    mutedForeground: `${h} 10% 40%`,
    border: `${h} 15% 90%`,
    primaryForeground,
  };
}

export function tenantCssVars(business: Business): React.CSSProperties {
  const { theme } = business;
  const { surface, surfaceForeground, muted, mutedForeground, border, primaryForeground } = deriveSurfaces(theme.primary);
  const fonts = fontMap[theme.typography];
  return {
    // @ts-expect-error css vars
    "--t-primary": theme.primary,
    "--t-primary-foreground": primaryForeground,
    "--t-secondary": theme.secondary,
    "--t-accent": theme.accent,
    "--t-surface": surface,
    "--t-surface-foreground": surfaceForeground,
    "--t-muted": muted,
    "--t-muted-foreground": mutedForeground,
    "--t-border": border,
    "--t-radius": radiusMap[theme.stylePreset],
    "--t-font-display": fonts.display,
    "--t-font-body": fonts.body,
  };
}

export function useTenantVars(business: Business) {
  return useMemo(() => tenantCssVars(business), [business]);
}

/** Apply tenant vars to document root temporarily (for previews overriding the scope). */
export function useApplyTenantToRoot(business: Business | undefined, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !business) return;
    const root = document.documentElement;
    const vars = tenantCssVars(business) as Record<string, string>;
    const prev: Record<string, string> = {};
    Object.entries(vars).forEach(([k, v]) => {
      prev[k] = root.style.getPropertyValue(k);
      root.style.setProperty(k, v);
    });
    return () => {
      Object.keys(vars).forEach((k) => {
        if (prev[k]) root.style.setProperty(k, prev[k]);
        else root.style.removeProperty(k);
      });
    };
  }, [business, enabled]);
}
