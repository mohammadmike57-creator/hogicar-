import { CarCategory } from './types';

export const CATEGORY_IMAGES: { [key in CarCategory]: string } = {
    [CarCategory.MINI]: 'https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=500&auto=format&fit=crop',
    [CarCategory.ECONOMY]: 'https://images.unsplash.com/photo-1603811462293-66249419f71c?w=500&auto=format&fit=crop',
    [CarCategory.COMPACT]: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500&auto=format&fit=crop',
    [CarCategory.MIDSIZE]: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&auto=format&fit=crop',
    [CarCategory.FULLSIZE]: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500&auto=format&fit=crop',
    [CarCategory.SUV]: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&auto=format&fit=crop',
    [CarCategory.LUXURY]: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&auto=format&fit=crop',
    [CarCategory.VAN]: 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=500&auto=format&fit=crop',
    [CarCategory.PEOPLE_CARRIER]: 'https://images.unsplash.com/photo-1605335193652-c234a9726245?w=500&auto=format&fit=crop',
    [CarCategory.INTERMEDIATE]: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&auto=format&fit=crop', // Midsize fallback
    [CarCategory.STANDARD]: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500&auto=format&fit=crop', // Fullsize fallback
    [CarCategory.PREMIUM]: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&auto=format&fit=crop', // Luxury fallback
};

export const TRUSTED_BRANDS = [
  { name: 'Hertz', logo: '/brands/hertz.svg' },
  { name: 'Avis', logo: '/brands/avis.svg' },
  { name: 'Europcar', logo: '/brands/europcar.svg' },
  { name: 'Sixt', logo: '/brands/sixt.svg' },
  { name: 'Enterprise', logo: '/brands/enterprise.svg' },
  { name: 'Budget', logo: '/brands/budget.svg' },
  { name: 'Alamo', logo: '/brands/alamo.svg' },
  { name: 'Goldcar', logo: '/brands/goldcar.svg' },
  { name: 'Dollar', logo: '/brands/dollar.svg' },
  { name: 'Thrifty', logo: '/brands/thrifty.svg' }
];
