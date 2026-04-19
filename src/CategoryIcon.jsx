import {
  Smartphone, Refrigerator, Laptop, Sofa, HardHat, Wrench, Shirt,
  Footprints, Dumbbell, Car, ShoppingCart, Heart, PawPrint, Gamepad2,
  BookOpen, Settings2, Package, Tablet, Headphones, Tv, Camera, Watch,
  Plug2,
} from 'lucide-react';

const ICON_MAP = {
  Smartphone, Refrigerator, Laptop, Sofa, HardHat, Wrench, Shirt,
  Footprints, Dumbbell, Car, ShoppingCart, Heart, PawPrint, Gamepad2,
  BookOpen, Settings2, Package, Tablet, Headphones, Tv, Camera, Watch,
  Plug2,
};

export default function CategoryIcon({ name, className = 'w-4 h-4' }) {
  if (!name) return null;
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}
