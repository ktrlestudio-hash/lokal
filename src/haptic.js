// Haptic feedback — vibración nativa en mobile (Android/iOS PWA)
// En desktop o dispositivos sin vibrate, no hace nada.

const patterns = {
  light:   [8],
  medium:  [18],
  heavy:   [35],
  success: [8, 60, 12],
  error:   [30, 40, 30],
  select:  [5],
  tap:     [6],
};

export function haptic(type = 'light') {
  try {
    if (navigator.vibrate) navigator.vibrate(patterns[type] ?? [8]);
  } catch { /* silencioso */ }
}
