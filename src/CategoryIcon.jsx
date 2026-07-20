import {
  Beef, Pizza, Sandwich, Croissant, CakeSlice, UtensilsCrossed, Flame,
  Salad, IceCream, CupSoda, Package, MoreHorizontal,
} from 'lucide-react';

const ICON_MAP = {
  Beef, Pizza, Sandwich, Croissant, CakeSlice, UtensilsCrossed, Flame,
  Salad, IceCream, CupSoda, Package, MoreHorizontal,
};

export default function CategoryIcon({ name, className = 'w-4 h-4' }) {
  if (!name) return null;
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}
