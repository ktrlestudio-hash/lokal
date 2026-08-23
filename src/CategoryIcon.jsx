// Mapa de íconos de categorías RAÍZ — cubre las 29 raíces del árbol
// multi-rubro (src/categories.js), no solo las 12 de comida rápida
// originales. Antes solo tenía esas 12: cualquier consumidor que iterara
// categorías del bloque "no comida" (electrónica, ropa, ferretería...)
// -CategoryPicker, CategoryFilterBar, StoreApp, y ahora HomeGlobal- recibía
// `null` de vuelta y el ícono simplemente no se dibujaba. Si se agrega una
// raíz nueva a categories.js, su `icon` tiene que sumarse acá también.
import {
  Beef, Pizza, Sandwich, Croissant, CakeSlice, UtensilsCrossed, Flame,
  Salad, IceCream, CupSoda, Package, MoreHorizontal,
  Smartphone, Refrigerator, Laptop, Sofa, HardHat, Wrench, Shirt,
  Footprints, Dumbbell, Car, ShoppingCart, Heart, PawPrint, Gamepad2,
  BookOpen, Settings2,
} from 'lucide-react';

const ICON_MAP = {
  Beef, Pizza, Sandwich, Croissant, CakeSlice, UtensilsCrossed, Flame,
  Salad, IceCream, CupSoda, Package, MoreHorizontal,
  Smartphone, Refrigerator, Laptop, Sofa, HardHat, Wrench, Shirt,
  Footprints, Dumbbell, Car, ShoppingCart, Heart, PawPrint, Gamepad2,
  BookOpen, Settings2,
};

export default function CategoryIcon({ name, className = 'w-4 h-4' }) {
  if (!name) return null;
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}
