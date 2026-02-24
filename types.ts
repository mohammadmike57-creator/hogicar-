









export enum CarCategory {
  ECONOMY = 'Economy',
  COMPACT = 'Compact',
  SUV = 'SUV',
  LUXURY = 'Luxury',
  VAN = 'Van',
  MINI = 'Mini',
  MIDSIZE = 'Midsize',
  FULLSIZE = 'Full-size',
  PEOPLE_CARRIER = 'People Carrier'
}

export enum CarType {
  SEDAN = 'Sedan',
  HATCHBACK = 'Hatchback',
  SUV = 'SUV',
  CONVERTIBLE = 'Convertible',
  VAN = 'Van',
  COUPE = 'Coupe',
  MINIVAN = 'Minivan',
  WAGON = 'Wagon'
}

export enum Transmission {
  MANUAL = 'Manual',
  AUTOMATIC = 'Automatic'
}

export enum FuelPolicy {
  FULL_TO_FULL = 'Full to Full',
  SAME_TO_SAME = 'Same to Same'
}

export interface RateByDay {
  minDays: number;
  maxDays: number;
  dailyRate: number;
}

export interface RateTier {
  id: string;
  name: string; // e.g., "High Season", "Weekend Special"
  startDate: string; // ISO date string "YYYY-MM-DD"
  endDate: string;   // ISO date string "YYYY-MM-DD"
  rates: RateByDay[]; // Replaces dailyRate for dynamic pricing
  promotionLabel?: string; // e.g. "Summer Sale", "Black Friday"
}

export enum CommissionType {
  FULL_PREPAID = 'Full Prepaid',
  PARTIAL_PREPAID = 'Partial Prepaid',
  PAY_AT_DESK = 'Pay at Desk'
}

export enum BookingMode {
  FREE_SALE = 'Free Sale', // Instant confirmation
  ON_REQUEST = 'On Request' // Supplier must confirm
}

export interface ApiConnection {
  endpointUrl: string;
  accountId: string;
  secretKey: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'pending_approval' | 'rejected';
  commissionRate?: number; // Specific commission for this location
}

export interface WorkingHours {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
}

export interface Supplier {
  id: string;
  name: string;
  rating: number;
  logo: string;
  commissionType: CommissionType;
  commissionValue: number; // Percentage (e.g., 0.15 for 15%) or Fixed Amount
  bookingMode: BookingMode;
  status: 'active' | 'pending' | 'rejected';
  
  // Contact & Location Info
  location: string; // Primary location name (legacy)
  locations: Location[]; // New multi-location support
  contactEmail: string;
  address?: string;
  phone?: string;
  workingHours?: WorkingHours;
  
  // Operational Settings
  gracePeriodHours: number; // For returns (Late tolerance)
  gracePeriodDays?: number;
  minBookingLeadTime?: number; // Hours required before pickup (e.g. 2 hours notice)
  termsAndConditions?: string; // HTML or Text terms
  includesCDW?: boolean; // Collision Damage Waiver
  includesTP?: boolean; // Theft Protection
  oneWayFee?: number; // Flat fee for one-way rentals

  // New API Integration Fields
  connectionType: 'manual' | 'api';
  apiConnection?: ApiConnection;

  // Login Credentials
  username?: string;
  password?: string;
  enableSocialProof?: boolean;
  gracePeriod?: number;
  leadTime?: number;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
  type: 'per_day' | 'per_rental';
  description?: string;
  selected?: boolean; // For UI state
  promotionLabel?: string; // e.g. "Free for Summer", "50% Off"
}

export interface CarRatings {
  cleanliness: number; // 0-100
  condition: number; // 0-100
  valueForMoney: number; // 0-100
  pickupSpeed: number; // 0-100
}

export interface Car {
  id: string;
  make: string;
  model: string;
  displayName?: string;
  netPrice?: number;
  commissionPercent?: number;
  commissionAmount?: number;
  finalPrice?: number;
  year: number;
  category: CarCategory;
  type: CarType;
  sippCode: string;
  transmission: Transmission;
  passengers: number;
  bags: number;
  doors: number;
  airCon: boolean;
  image: string;
  galleryImages?: string[];
  supplier: Supplier;
  features: string[];
  fuelPolicy: FuelPolicy;
  isAvailable: boolean;
  location: string;
  locationId?: string; // Link to specific Location record
  
  // Advanced Pricing & Specs
  deposit: number; // Security deposit amount
  excess: number; // Max liability
  stopSales: string[]; // Array of ISO date strings where car is unavailable
  rateTiers: RateTier[]; // Per-vehicle pricing
  extras: Extra[]; // Dynamic extras provided by supplier
  
  // New fields for card details
  locationDetail: string; // e.g., "In Terminal", "Meet & Greet"
  unlimitedMileage: boolean;
  tags?: string[];
  detailedRatings?: CarRatings;
  hasFinalPriceFromApi?: boolean;
  supplierId?: number | null;
  currency?: string;
}

export interface ApiSearchResult {
  id: string;
  name?: string;
  brand?: string;
  model?: string;
  category?: CarCategory;
  netPrice?: number;
  finalPrice?: number | null;
  currency?: string;
  available?: boolean;
  image?: string;
  passengers?: number;
  bags?: number;
  doors?: number;
  transmission?: Transmission;
  airCon?: boolean;
  fuelPolicy?: FuelPolicy;
  unlimitedMileage?: boolean;
  locationDetail?: string;
  sippCode?: string;
  description?: string;
  commissionAmount?: number;
  commissionPercent?: number;
  
  // Fields for normalization
  supplierId?: number | null;
  supplierName?: string;
  supplierLogoUrl?: string;
  supplierTerms?: string;
  supplierGracePeriodDays?: number;

  supplier?: {
    id?: number | null;
    name: string;
    logoUrl: string;
    terms: string;
    gracePeriodDays: number;
    rating?: number;
  } | null;
}


export interface Booking {
  id: string | number;
  // FIX: Add optional 'bookingRef' property to align with API response and fix type errors.
  bookingRef?: string;
  carId: string;
  carName: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  flightNumber?: string;
  
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  bookingDate: string; // Date booking was created

  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'modified';
  
  // Financial breakdown
  amountPaidOnline: number;
  amountToPayAtDesk: number;
  bookingMode: BookingMode; // Snapshot of mode at booking time
  selectedExtras?: Extra[];
  
  // Affiliate Tracking
  affiliateId?: string;

  // Supplier confirmation number
  supplierConfirmationNumber?: string;

  // Promotions
  appliedPromoCode?: string;
  discountAmount?: number;

  // Post-rental
  reviewSubmitted?: boolean;

  // Fields from API response
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  finalPrice?: number;
  payNow?: number;
  payAtDesk?: number;
  supplierName?: string;
  pickupCode?: string;
  dropoffCode?: string;
  pickupDate?: string;
  dropoffDate?: string;
  currency?: string;
  netPrice?: number;
  commissionPercent?: number;
  commissionAmount?: number;
}

export interface StatsData {
  name: string;
  value: number;
}

export interface ApiPartner {
  id: string;
  name: string;
  apiKey: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface PageContent {
  slug: string;
  title: string;
  content: string; // HTML-like string or plain text
  lastUpdated: string;
}

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  password?: string;
  website: string;
  status: 'active' | 'pending' | 'rejected';
  commissionRate: number; // e.g., 0.05 for 5%
  totalEarnings: number;
  clicks: number;
  conversions: number;
  joinDate: string;
}

export interface SEOConfig {
  route: string; // e.g., "/", "/about", "/search"
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
}

// --- Homepage Content Management ---

export interface FeatureItem {
  id: string;
  icon: 'Globe' | 'Tag' | 'Star' | 'Award';
  title: string;
  description: string;
}

export interface StepItem {
  id: string;
  icon: 'Search' | 'FileSymlink' | 'BookCheck';
  title: string;
  description: string;
}

export interface DestinationItem {
  id: string;
  name: string;
  country: string;
  price: number;
  image: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface ValuePropositionItem {
  id: string;
  icon: 'CheckCircle' | 'Shield' | 'Tag';
  title: string;
  description: string;
}

export interface HomepageContent {
  hero: {
    title: string;
    subtitle: string;
    backgroundImage: string;
  };
  searchWidgetTitle: string;
  features: FeatureItem[];
  howItWorks: {
    title: string;
    subtitle: string;
    steps: StepItem[];
  };
  valuePropositions: ValuePropositionItem[];
  popularDestinations: {
    title: string;
    subtitle: string;
    destinations: DestinationItem[];
  };
  partners: {
    title: string;
  };
  cta: {
    title: string;
    subtitle: string;
  };
  faqs: {
    title: string;
    items: FaqItem[];
  };
}

export interface CarModel {
  id: string;
  make: string;
  model: string;
  year: number;
  category: CarCategory;
  type: CarType;
  image: string;
  passengers: number;
  bags: number;
  doors: number;
}

export interface SupplierApplication {
  id: string;
  companyName: string;
  website: string;
  contactName: string;
  email: string;
  phone: string;
  fleetSize: string;
  primaryLocation: string;
  integrationType: 'api' | 'portal' | 'unsure';
  status: 'pending';
  submissionDate: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount: number; // 0.10 for 10%
  status: 'active' | 'inactive';
}

export interface RateImportSummary {
  ok: boolean;
  message: string;
  sheetsProcessed: number;
  sheetsSkippedEmpty: number;
  rowsProcessed: number;
  tiersReplaced: number;
  bandsInserted: number;
  carsUpdated: number;
  periodsReplaced: string[];
  ms: number;
}


// --- NEW PRICING / TEMPLATE TYPES ---

export interface BandConfig {
  minDays: number;
  maxDays: number | null;
  perMonth: boolean;
  label?: string;
}

export interface PeriodConfig {
  name: string;
  startDate: string;
  endDate: string;
  usePreviousBands: boolean;
  bands: BandConfig[];
}

export interface TemplateConfig {
  currency: string;
  bands: BandConfig[]; // Global bands
  periods: PeriodConfig[];
}

export interface CarRateBand {
  id: number;
  minDays: number;
  maxDays: number;
  dailyRate: number;
}

export interface CarRateTier {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  currency: string;
  bands: CarRateBand[];
}