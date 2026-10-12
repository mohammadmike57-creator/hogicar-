export interface Country {
  name: string;
  code: string;
  supplierCount: number;
  locationCount: number;
  carCount: number;
}

export interface Location {
  name: string;
  iataCode: string;
  type: string;
  supplierCount: number;
}

/** A car sample, if the backend ever includes one on the supplier link. All fields optional. */
export interface ExternalCar {
  name?: string;
  model?: string;
  make?: string;
  carName?: string;
  category?: string;
  imageUrl?: string;
  image?: string;
  carImage?: string;
  photoUrl?: string;
  picture?: string;
}

export interface SupplierConfig {
  supplierId: number;
  vendorCode: string;
  supplierName: string;
  locationCode: string;
  externalLocationId: string;
  contactEmail: string;
  contactPhone: string;
  markupPercentage: number;
  commissionPercentage: number;
  fixedFee: number;
  currency: string;
  priority: number;
  active: boolean;
  isConfigured: boolean;
  logoUrl: string;
  carCount: number;
  carDeposit?: number;
  lastDiscoveredAt?: string;
  // Optional extras some backends send; shown when present.
  supplierLogo?: string;
  logo?: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  cars?: ExternalCar[];
  sampleCars?: ExternalCar[];
}

export interface SupplierSearchResponse {
  totalSuppliers?: number;
  totalCars?: number;
  suppliers?: SupplierConfig[];
}
