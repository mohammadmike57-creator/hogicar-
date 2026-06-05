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
  { name: 'Hertz', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Hertz_logo.svg/2560px-Hertz_logo.svg.png' },
  { name: 'Avis', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Avis_logo.svg/2560px-Avis_logo.svg.png' },
  { name: 'Europcar', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Europcar_Logo.svg/2560px-Europcar_Logo.svg.png' },
  { name: 'Sixt', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Sixt_logo.svg/2560px-Sixt_logo.svg.png' },
  { name: 'Enterprise', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Enterprise_Rent-A-Car_logo.svg/2560px-Enterprise_Rent-A-Car_logo.svg.png' },
  { name: 'Budget', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Budget_Rent_A_Car_logo.svg/2560px-Budget_Rent_A_Car_logo.svg.png' },
  { name: 'Alamo', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Alamo_Rent_A_Car_logo.svg/2560px-Alamo_Rent_A_Car_logo.svg.png' },
  { name: 'Goldcar', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Goldcar_logo.svg/2560px-Goldcar_logo.svg.png' },
  { name: 'Dollar', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Dollar_Rent_A_Car_logo.svg/2560px-Dollar_Rent_A_Car_logo.svg.png' },
  { name: 'Thrifty', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Thrifty_Rent_A_Car_logo.svg/2560px-Thrifty_Rent_A_Car_logo.svg.png' }
];
