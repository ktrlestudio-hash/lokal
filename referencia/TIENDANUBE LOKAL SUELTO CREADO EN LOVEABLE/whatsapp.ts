import type { Business, Product } from "./types";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export function buildWhatsAppUrl(
  business: Business,
  items: CartItem[],
  opts?: { note?: string; isService?: boolean; serviceTitle?: string },
): string {
  const parts: string[] = [business.defaultMessage || `¡Hola ${business.name}!`];

  if (opts?.isService && opts.serviceTitle) {
    parts.push("", `• Servicio: ${opts.serviceTitle}`);
  } else if (items.length) {
    parts.push("");
    items.forEach((it) => {
      parts.push(`• ${it.quantity}× ${it.name} — $${(it.price * it.quantity).toLocaleString("es-AR")}`);
    });
    const total = items.reduce((a, b) => a + b.price * b.quantity, 0);
    parts.push("", `Total estimado: $${total.toLocaleString("es-AR")}`);
  }

  if (opts?.note) parts.push("", `Nota: ${opts.note}`);

  const text = encodeURIComponent(parts.join("\n"));
  const phone = business.whatsapp.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${text}`;
}

export function productToCartItem(p: Product, quantity = 1): CartItem {
  return { productId: p.id, name: p.name, price: p.price, quantity };
}

export function formatPrice(n: number | null | undefined) {
  if (n == null) return "A consultar";
  return `$${n.toLocaleString("es-AR")}`;
}
