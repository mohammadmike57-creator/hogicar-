
import { Car, CarCategory, Transmission, FuelPolicy, Booking, Supplier, CommissionType, BookingMode, RateTier, CarType, Extra, ApiPartner, PageContent, Affiliate, RateByDay, SEOConfig, HomepageContent, CarModel, SupplierApplication, PromoCode } from '../types';

export const SUPPLIERS: Supplier[] = [
  { 
    id: 's1', 
    name: 'Alamo', 
    rating: 4.8, 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Alamo_Rent_A_Car_logo.svg/2560px-Alamo_Rent_A_Car_logo.svg.png',
    commissionType: CommissionType.PARTIAL_PREPAID,
    commissionValue: 0.15,
    bookingMode: BookingMode.FREE_SALE,
    status: 'active',
    location: 'Orlando, FL',
    locations: [{ id: 'loc-1', name: 'Orlando International Airport', address: '1 Jeff Fuqua Blvd, Orlando, FL 32827, USA', status: 'active', commissionRate: 0.15 }],
    contactEmail: 'reservations@alamo-mock.com',
    gracePeriodHours: 1,
    minBookingLeadTime: 2,
    termsAndConditions: "Standard Alamo terms apply. Driver must be at least 25 years old. Credit card required for deposit.",
    connectionType: 'manual',
    username: 'alamo_user',
    password: 'password123',
    includesCDW: true,
    includesTP: true,
    oneWayFee: 50,
    enableSocialProof: true,
    address: '1 Jeff Fuqua Blvd, Orlando, FL 32827, USA',
    phone: '+1 844-357-5138',
    workingHours: { monday: '24 Hours', tuesday: '24 Hours', wednesday: '24 Hours', thursday: '24 Hours', friday: '24 Hours', saturday: '24 Hours', sunday: '24 Hours' }
  },
  { 
    id: 's2', 
    name: 'Hertz', 
    rating: 4.5, 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Hertz_logo.svg/2560px-Hertz_logo.svg.png',
    commissionType: CommissionType.FULL_PREPAID,
    commissionValue: 0.20,
    bookingMode: BookingMode.ON_REQUEST,
    status: 'active',
    location: 'Los Angeles, CA',
    locations: [{ id: 'loc-2', name: 'Los Angeles International Airport', address: '1 World Way, Los Angeles, CA 90045, USA', status: 'active', commissionRate: 0.20 }],
    contactEmail: 'bookings@hertz-mock.com',
    gracePeriodHours: 2,
    minBookingLeadTime: 4,
    termsAndConditions: "Hertz Gold Plus Rewards members can skip the counter. Debit cards accepted with return flight ticket.",
    connectionType: 'api',
    apiConnection: { endpointUrl: 'https://api.hertz.com/inventory', accountId: 'HZ-1001', secretKey: 'dummy-secret-key-for-hertz' },
    username: 'hertz_user',
    password: 'password123',
    includesCDW: true,
    includesTP: false,
    oneWayFee: 75.50,
    enableSocialProof: true,
    address: '9000 Airport Blvd, Los Angeles, CA 90045, USA',
    phone: '+1 310-568-5100',
    workingHours: { monday: '08:00 - 22:00', tuesday: '08:00 - 22:00', wednesday: '08:00 - 22:00', thursday: '08:00 - 22:00', friday: '08:00 - 23:00', saturday: '09:00 - 20:00', sunday: '09:00 - 20:00' }
  },
  { 
    id: 's3', 
    name: 'Avis', 
    rating: 4.6, 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Avis_logo.svg/2560px-Avis_logo.svg.png',
    commissionType: CommissionType.PAY_AT_DESK,
    commissionValue: 5.00,
    bookingMode: BookingMode.FREE_SALE,
    status: 'active',
    location: 'New York, NY',
    locations: [{ id: 'loc-3', name: 'JFK International Airport', address: 'JFK Access Road, Queens, NY 11430, USA', status: 'active', commissionRate: 5.00 }],
    contactEmail: 'contact@avis-mock.com',
    gracePeriodHours: 1,
    minBookingLeadTime: 0, // Instant
    termsAndConditions: "Smoke-free fleet. Cleaning fee of $250 applies for smoking in vehicle.",
    connectionType: 'manual',
    username: 'avis_user',
    password: 'password123',
    includesCDW: false,
    includesTP: true,
    oneWayFee: 0, // No fee
    enableSocialProof: false,
    address: '100 W 42nd St, New York, NY 10036, USA',
    phone: '+1 212-354-2847',
    workingHours: { monday: '07:00 - 23:00', tuesday: '07:00 - 23:00', wednesday: '07:00 - 23:00', thursday: '07:00 - 23:00', friday: '07:00 - 23:00', saturday: '08:00 - 22:00', sunday: '08:00 - 22:00' }
  },
  { 
    id: 's4', 
    name: 'Europcar', 
    rating: 4.4, 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Europcar_Logo.svg/2560px-Europcar_Logo.svg.png',
    commissionType: CommissionType.PARTIAL_PREPAID,
    commissionValue: 0.15,
    bookingMode: BookingMode.FREE_SALE,
    status: 'active',
    location: 'London, UK',
    locations: [{ id: 'loc-4', name: 'Heathrow Airport', address: 'Heathrow Airport, Hounslow, UK', status: 'active', commissionRate: 0.15 }],
    contactEmail: 'info@europcar-mock.com',
    gracePeriodHours: 1,
    minBookingLeadTime: 24,
    termsAndConditions: "Cross-border travel allowed to selected countries with prior authorization.",
    connectionType: 'manual',
    username: 'europcar_user',
    password: 'password123',
    includesCDW: true,
    includesTP: true,
    enableSocialProof: false,
    address: 'Heathrow Airport, Northern Perimeter Rd, Hounslow, UK',
    phone: '+44 371 384 3410',
    workingHours: { monday: '08:00 - 20:00', tuesday: '08:00 - 20:00', wednesday: '08:00 - 20:00', thursday: '08:00 - 20:00', friday: '08:00 - 20:00', saturday: '09:00 - 18:00', sunday: '09:00 - 18:00' }
  },
  {
    id: 's5',
    name: 'Sixt',
    rating: 4.7,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Sixt_logo.svg/2560px-Sixt_logo.svg.png',
    commissionType: CommissionType.FULL_PREPAID,
    commissionValue: 0.18,
    bookingMode: BookingMode.FREE_SALE,
    status: 'active',
    location: 'Miami, FL',
    locations: [{ id: 'loc-5', name: 'Miami International Airport', address: '2100 NW 42nd Ave, Miami, FL 33126, USA', status: 'active', commissionRate: 0.18 }],
    contactEmail: 'reservations@sixt-mock.com',
    gracePeriodHours: 1,
    minBookingLeadTime: 4,
    termsAndConditions: "Drivers under 25 are subject to a young driver surcharge.",
    connectionType: 'manual',
    username: 'sixt_user',
    password: 'password123',
    includesCDW: true,
    includesTP: false,
    oneWayFee: 100,
    enableSocialProof: false,
    address: '3900 NW 25th St, Miami, FL 33142, USA',
    phone: '+1 888-749-8227',
    workingHours: { monday: '24 Hours', tuesday: '24 Hours', wednesday: '24 Hours', thursday: '24 Hours', friday: '24 Hours', saturday: '24 Hours', sunday: '24 Hours' }
  },
  {
    id: 's6',
    name: 'Budget',
    rating: 4.3,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Budget_Rent_a_Car_logo.svg/2560px-Budget_Rent_a_Car_logo.svg.png',
    commissionType: CommissionType.PARTIAL_PREPAID,
    commissionValue: 0.12,
    bookingMode: BookingMode.FREE_SALE,
    status: 'active',
    location: 'Chicago, IL',
    locations: [{ id: 'loc-6', name: 'O\'Hare International Airport', address: '10000 W O\'Hare Ave, Chicago, IL 60666, USA', status: 'active', commissionRate: 0.12 }],
    contactEmail: 'contact@budget-mock.com',
    gracePeriodHours: 1,
    minBookingLeadTime: 2,
    connectionType: 'manual',
    username: 'budget_user',
    password: 'password123',
    enableSocialProof: false,
    address: 'O\'Hare International Airport, 10000 W O\'Hare Ave, Chicago, IL 60666, USA',
    phone: '+1 773-686-2000',
    workingHours: { monday: '08:00 - 21:00', tuesday: '08:00 - 21:00', wednesday: '08:00 - 21:00', thursday: '08:00 - 21:00', friday: '08:00 - 21:00', saturday: '09:00 - 19:00', sunday: '09:00 - 19:00' }
  },
  {
    id: 's7',
    name: 'Dollar',
    rating: 4.1,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Dollar_Rent_A_Car_logo.svg/2560px-Dollar_Rent_A_Car_logo.svg.png',
    commissionType: CommissionType.FULL_PREPAID,
    commissionValue: 0.22,
    bookingMode: BookingMode.FREE_SALE,
    status: 'active',
    location: 'Denver, CO',
    locations: [{ id: 'loc-7', name: 'Denver International Airport', address: '8500 Peña Blvd, Denver, CO 80249, USA', status: 'active', commissionRate: 0.22 }],
    contactEmail: 'contact@dollar-mock.com',
    gracePeriodHours: 0,
    minBookingLeadTime: 0,
    connectionType: 'manual',
    username: 'dollar_user',
    password: 'password123',
    enableSocialProof: false,
    address: '8500 Peña Blvd, Denver, CO 80249, USA',
    phone: '+1 866-434-2226',
    workingHours: { monday: '06:00 - 22:00', tuesday: '06:00 - 22:00', wednesday: '06:00 - 22:00', thursday: '06:00 - 22:00', friday: '06:00 - 22:00', saturday: '07:00 - 21:00', sunday: '07:00 - 21:00' }
  },
  {
    id: 's8',
    name: 'Enterprise',
    rating: 4.9,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Enterprise_Rent-A-Car_logo.svg/2560px-Enterprise_Rent-A-Car_logo.svg.png',
    commissionType: CommissionType.PAY_AT_DESK,
    commissionValue: 10.00,
    bookingMode: BookingMode.FREE_SALE,
    status: 'active',
    location: 'Atlanta, GA',
    locations: [{ id: 'loc-8', name: 'Hartsfield-Jackson Atlanta International Airport', address: '6000 N Terminal Pkwy, Atlanta, GA 30320, USA', status: 'active', commissionRate: 10.00 }],
    contactEmail: 'contact@enterprise-mock.com',
    gracePeriodHours: 1,
    minBookingLeadTime: 1,
    connectionType: 'manual',
    username: 'enterprise_user',
    password: 'password123',
    enableSocialProof: false,
    address: '6000 N Terminal Pkwy, Atlanta, GA 30320, USA',
    phone: '+1 833-315-5895',
    workingHours: { monday: '24 Hours', tuesday: '24 Hours', wednesday: '24 Hours', thursday: '24 Hours', friday: '24 Hours', saturday: '24 Hours', sunday: '24 Hours' }
  }
];

export let MOCK_CAR_LIBRARY: CarModel[] = [
  {
    id: 'cm1',
    make: 'Toyota',
    model: 'Corolla',
    year: 2023,
    category: CarCategory.COMPACT,
    type: CarType.SEDAN,
    image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=2069&auto=format&fit=crop',
    passengers: 5,
    bags: 2,
    doors: 4,
  },
  {
    id: 'cm2',
    make: 'Ford',
    model: 'Mustang Convertible',
    year: 2024,
    category: CarCategory.LUXURY,
    type: CarType.CONVERTIBLE,
    image: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?q=80&w=2070&auto=format&fit=crop',
    passengers: 4,
    bags: 2,
    doors: 2,
  },
  {
    id: 'cm3',
    make: 'Jeep',
    model: 'Wrangler',
    year: 2023,
    category: CarCategory.SUV,
    type: CarType.SUV,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop',
    passengers: 5,
    bags: 3,
    doors: 4,
  },
  {
    id: 'cm4',
    make: 'Fiat',
    model: '500',
    year: 2023,
    category: CarCategory.MINI,
    type: CarType.HATCHBACK,
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop',
    passengers: 4,
    bags: 1,
    doors: 2,
  },
  {
    id: 'cm5',
    make: 'Tesla',
    model: 'Model 3',
    year: 2024,
    category: CarCategory.LUXURY,
    type: CarType.SEDAN,
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop',
    passengers: 5,
    bags: 3,
    doors: 4,
  },
];

export const MOCK_CARS: Car[] = [
    {
        id: 'c1',
        make: 'Toyota',
        model: 'Corolla',
        year: 2023,
        category: CarCategory.COMPACT,
        type: CarType.SEDAN,
        sippCode: 'CDAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 5,
        bags: 2,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=2069&auto=format&fit=crop',
        galleryImages: [
            'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=2069&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1617469767053-13b3363e0051?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1617469767223-283328c6c596?q=80&w=2070&auto=format&fit=crop',
        ],
        supplier: SUPPLIERS[0],
        features: ['Bluetooth', 'Backup Camera', 'Apple CarPlay'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'Queen Alia International Airport',
        deposit: 200,
        excess: 1000,
        stopSales: [],
        rateTiers: [
            {
                id: 'rt1',
                name: 'Standard',
                startDate: '2023-01-01',
                endDate: '2025-12-31',
                rates: [
                    { minDays: 1, maxDays: 3, dailyRate: 55 },
                    { minDays: 4, maxDays: 7, dailyRate: 50 },
                    { minDays: 8, maxDays: 14, dailyRate: 48 },
                    { minDays: 15, maxDays: 30, dailyRate: 45 }
                ]
            }
        ],
        extras: [
            { id: 'ex1', name: 'GPS', price: 10, type: 'per_day', description: 'Navigate with ease. Includes up-to-date maps and traffic alerts.' },
            { id: 'ex2', name: 'Child Seat', price: 8, type: 'per_day', description: 'Keep your little ones safe. Suitable for children up to 40lbs.' }
        ],
        locationDetail: "In Terminal - Main Arrivals Hall",
        unlimitedMileage: true,
        tags: ["Best Value"],
        detailedRatings: {
            cleanliness: 92,
            condition: 95,
            valueForMoney: 88,
            pickupSpeed: 90,
        }
    },
    {
        id: 'c2',
        make: 'Ford',
        model: 'Mustang Convertible',
        year: 2024,
        category: CarCategory.LUXURY,
        type: CarType.CONVERTIBLE,
        sippCode: 'STAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 4,
        bags: 2,
        doors: 2,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?q=80&w=2070&auto=format&fit=crop',
        galleryImages: [
            'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1626505244195-a54b38a4d7d2?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1555510522-652399158ad4?q=80&w=2070&auto=format&fit=crop',
        ],
        supplier: SUPPLIERS[1],
        features: ['Leather Seats', 'Apple CarPlay'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'Los Angeles, CA',
        deposit: 500,
        excess: 2000,
        stopSales: [],
        rateTiers: [
             {
                id: 'rt2',
                name: 'Standard',
                startDate: '2023-01-01',
                endDate: '2025-12-31',
                rates: [{ minDays: 1, maxDays: 30, dailyRate: 95 }]
            }
        ],
        extras: [],
        locationDetail: "Meet & Greet Service",
        unlimitedMileage: false,
        tags: ["Popular Choice"],
        detailedRatings: {
            cleanliness: 95,
            condition: 98,
            valueForMoney: 85,
            pickupSpeed: 88,
        }
    }
];

// Let's add more mock cars to have variety
const extraCars: Car[] = [
    {
        id: 'c3',
        make: 'Jeep',
        model: 'Wrangler',
        year: 2023,
        category: CarCategory.SUV,
        type: CarType.SUV,
        sippCode: 'SFAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 5,
        bags: 3,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop',
        galleryImages: [
            'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1605634593933-25a8850259e2?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop'
        ],
        supplier: SUPPLIERS[0],
        features: ['4WD', 'Bluetooth', 'Removable Top'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'Queen Alia International Airport',
        deposit: 300,
        excess: 1500,
        stopSales: [],
        rateTiers: [{ id: 'rt3', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 85 }], promotionLabel: "Off-Road Deal" }],
        extras: [
            { id: 'ex2', name: 'Child Seat', price: 8, type: 'per_day', description: 'Keep your little ones safe. Suitable for children up to 40lbs.' },
            { id: 'ex3', name: 'Ski Rack', price: 55, type: 'per_rental', description: 'Transport your skis or snowboards securely to the slopes.'}
        ],
        locationDetail: "Shuttle Bus to Depot",
        unlimitedMileage: true,
        detailedRatings: {
            cleanliness: 89,
            condition: 91,
            valueForMoney: 82,
            pickupSpeed: 85,
        }
    },
    {
        id: 'c4',
        make: 'Fiat',
        model: '500',
        year: 2023,
        category: CarCategory.MINI,
        type: CarType.HATCHBACK,
        sippCode: 'MBMR',
        transmission: Transmission.MANUAL,
        passengers: 4,
        bags: 1,
        doors: 2,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop',
        supplier: SUPPLIERS[3],
        features: ['Compact', 'Bluetooth'],
        fuelPolicy: FuelPolicy.SAME_TO_SAME,
        isAvailable: true,
        location: 'London, UK',
        deposit: 150,
        excess: 800,
        stopSales: [],
        rateTiers: [{ id: 'rt4', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 35 }] }],
        extras: [
            { id: 'ex1', name: 'GPS', price: 10, type: 'per_day', description: 'Navigate with ease. Includes up-to-date maps and traffic alerts.' }
        ],
        locationDetail: "In Terminal - Counter in T2",
        unlimitedMileage: false,
        detailedRatings: {
            cleanliness: 88,
            condition: 90,
            valueForMoney: 92,
            pickupSpeed: 85,
        }
    },
    {
        id: 'c5',
        make: 'Tesla',
        model: 'Model 3',
        year: 2024,
        category: CarCategory.LUXURY,
        type: CarType.SEDAN,
        sippCode: 'LDAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 5,
        bags: 3,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop',
        supplier: SUPPLIERS[1],
        features: ['Electric', 'Autopilot', 'GPS'],
        fuelPolicy: FuelPolicy.SAME_TO_SAME,
        isAvailable: true,
        location: 'Los Angeles, CA',
        deposit: 400,
        excess: 1500,
        stopSales: [],
        rateTiers: [{ id: 'rt5', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 110 }] }],
        extras: [],
        locationDetail: "Meet & Greet Service",
        unlimitedMileage: true,
        detailedRatings: {
            cleanliness: 96,
            condition: 97,
            valueForMoney: 89,
            pickupSpeed: 91,
        }
    },
    {
        id: 'c6',
        make: 'Mercedes-Benz',
        model: 'C-Class',
        year: 2023,
        category: CarCategory.LUXURY,
        type: CarType.SEDAN,
        sippCode: 'PDAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 5,
        bags: 3,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2070&auto=format&fit=crop',
        supplier: SUPPLIERS[4], // Sixt
        features: ['Leather', 'Navigation', 'Premium Audio'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'Miami, FL',
        deposit: 600,
        excess: 2000,
        stopSales: [],
        rateTiers: [{ id: 'rt6', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 125 }] }],
        extras: [],
        locationDetail: "In Terminal",
        unlimitedMileage: true,
        tags: ["Premium"],
        detailedRatings: {
            cleanliness: 98,
            condition: 96,
            valueForMoney: 90,
            pickupSpeed: 92,
        }
    },
    {
        id: 'c7',
        make: 'Chevrolet',
        model: 'Suburban',
        year: 2023,
        category: CarCategory.SUV,
        type: CarType.SUV,
        sippCode: 'FFAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 7,
        bags: 5,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1626245367375-7243cb3a2233?q=80&w=2070&auto=format&fit=crop',
        supplier: SUPPLIERS[0], // Alamo
        features: ['7 Seats', '4WD', 'Rear AC'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'Orlando, FL',
        deposit: 400,
        excess: 1200,
        stopSales: [],
        rateTiers: [{ id: 'rt7', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 140 }] }],
        extras: [],
        locationDetail: "Shuttle Bus",
        unlimitedMileage: true,
        detailedRatings: {
            cleanliness: 91,
            condition: 93,
            valueForMoney: 85,
            pickupSpeed: 88,
        }
    },
    {
        id: 'c8',
        make: 'Volkswagen',
        model: 'Golf',
        year: 2023,
        category: CarCategory.COMPACT,
        type: CarType.HATCHBACK,
        sippCode: 'CDMR',
        transmission: Transmission.MANUAL,
        passengers: 5,
        bags: 2,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=2070&auto=format&fit=crop',
        supplier: SUPPLIERS[3], // Europcar
        features: ['Bluetooth', 'Efficient'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'London, UK',
        deposit: 250,
        excess: 900,
        stopSales: [],
        rateTiers: [{ id: 'rt8', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 55 }] }],
        extras: [],
        locationDetail: "In Terminal",
        unlimitedMileage: false,
        detailedRatings: {
            cleanliness: 90,
            condition: 92,
            valueForMoney: 87,
            pickupSpeed: 86,
        }
    },
    {
        id: 'c9',
        make: 'Dodge',
        model: 'Grand Caravan',
        year: 2022,
        category: CarCategory.VAN,
        type: CarType.MINIVAN,
        sippCode: 'MVAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 7,
        bags: 4,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1612462767094-131dfd4f6470?q=80&w=2070&auto=format&fit=crop',
        supplier: SUPPLIERS[2], // Avis
        features: ['7 Seats', 'Sliding Doors'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'New York, NY',
        deposit: 300,
        excess: 1000,
        stopSales: [],
        rateTiers: [{ id: 'rt9', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 98 }] }],
        extras: [],
        locationDetail: "Meet & Greet Service",
        unlimitedMileage: true,
        detailedRatings: {
            cleanliness: 90,
            condition: 88,
            valueForMoney: 91,
            pickupSpeed: 78,
        }
    },
    {
        id: 'c10',
        make: 'Kia',
        model: 'Rio',
        year: 2023,
        category: CarCategory.ECONOMY,
        type: CarType.SEDAN,
        sippCode: 'ECAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 5,
        bags: 1,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1625231362746-324c43a29623?q=80&w=2070&auto=format&fit=crop',
        supplier: SUPPLIERS[0],
        features: ['Apple CarPlay', 'Rear Camera'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'Queen Alia International Airport',
        deposit: 200,
        excess: 800,
        stopSales: [],
        rateTiers: [{ id: 'rt10', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 42 }] }],
        extras: [],
        locationDetail: "In Terminal",
        unlimitedMileage: true,
        detailedRatings: {
            cleanliness: 89,
            condition: 91,
            valueForMoney: 93,
            pickupSpeed: 89,
        }
    },
    {
        id: 'c11',
        make: 'Lamborghini',
        model: 'Huracan',
        year: 2024,
        category: CarCategory.LUXURY,
        type: CarType.COUPE,
        sippCode: 'XSAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 2,
        bags: 1,
        doors: 2,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=1974&auto=format&fit=crop',
        supplier: SUPPLIERS[1], // Hertz
        features: ['V10 Engine', 'Sport Mode'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'Test City',
        deposit: 2000,
        excess: 5000,
        stopSales: [],
        rateTiers: [{ id: 'rt11', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 450 }] }],
        extras: [],
        locationDetail: "Meet & Greet Service",
        unlimitedMileage: false,
        detailedRatings: {
            cleanliness: 99,
            condition: 99,
            valueForMoney: 80,
            pickupSpeed: 95,
        }
    },
    {
        id: 'c12',
        make: 'Hyundai',
        model: 'i10',
        year: 2023,
        category: CarCategory.ECONOMY,
        type: CarType.HATCHBACK,
        sippCode: 'EDAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 4,
        bags: 1,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1617461732383-9b9385511bda?q=80&w=2070&auto=format&fit=crop',
        supplier: SUPPLIERS[5], // Budget
        features: ['Bluetooth', 'USB Port'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'Chicago, IL',
        deposit: 200,
        excess: 900,
        stopSales: [],
        rateTiers: [{ id: 'rt12', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 48 }] }],
        extras: [],
        locationDetail: "Shuttle Bus from Terminal 3",
        unlimitedMileage: true,
        detailedRatings: {
            cleanliness: 87,
            condition: 89,
            valueForMoney: 91,
            pickupSpeed: 84,
        }
    },
    {
        id: 'c13',
        make: 'Nissan',
        model: 'Qashqai',
        year: 2023,
        category: CarCategory.SUV,
        type: CarType.SUV,
        sippCode: 'IFAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 5,
        bags: 3,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1636683309315-731382e75e47?q=80&w=2070&auto=format&fit=crop',
        supplier: SUPPLIERS[6], // Dollar
        features: ['Cruise Control', 'Parking Sensors'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'Denver, CO',
        deposit: 250,
        excess: 1200,
        stopSales: [],
        rateTiers: [{ id: 'rt13', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 72 }] }],
        extras: [],
        locationDetail: "In Terminal, Desk at Baggage Claim",
        unlimitedMileage: true,
        detailedRatings: {
            cleanliness: 85,
            condition: 88,
            valueForMoney: 80,
            pickupSpeed: 75,
        }
    },
    {
        id: 'c14',
        make: 'BMW',
        model: '3 Series',
        year: 2024,
        category: CarCategory.LUXURY,
        type: CarType.SEDAN,
        sippCode: 'PDAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 5,
        bags: 2,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=2070&auto=format&fit=crop',
        supplier: SUPPLIERS[4], // Sixt
        features: ['Leather Seats', 'Sunroof', 'GPS'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'Miami, FL',
        deposit: 700,
        excess: 2500,
        stopSales: [],
        rateTiers: [{ id: 'rt14', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 130 }] }],
        extras: [],
        locationDetail: "Meet & Greet at Arrivals Gate",
        unlimitedMileage: true,
        tags: ["New Model"],
        detailedRatings: {
            cleanliness: 97,
            condition: 96,
            valueForMoney: 88,
            pickupSpeed: 93,
        }
    },
    {
        id: 'c15',
        make: 'Ford',
        model: 'Transit',
        year: 2022,
        category: CarCategory.PEOPLE_CARRIER,
        type: CarType.VAN,
        sippCode: 'FVAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 9,
        bags: 6,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1599427985721-a456385b017a?q=80&w=2070&auto=format&fit=crop',
        supplier: SUPPLIERS[7], // Enterprise
        features: ['9 Seats', 'Spacious'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'Atlanta, GA',
        deposit: 350,
        excess: 1000,
        stopSales: [],
        rateTiers: [{ id: 'rt15', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 155 }] }],
        extras: [],
        locationDetail: "Shuttle Bus - 10 min ride",
        unlimitedMileage: true,
        detailedRatings: {
            cleanliness: 88,
            condition: 90,
            valueForMoney: 86,
            pickupSpeed: 90,
        }
    },
    {
        id: 'c16',
        make: 'Audi',
        model: 'A4',
        year: 2023,
        category: CarCategory.FULLSIZE,
        type: CarType.SEDAN,
        sippCode: 'FDAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 5,
        bags: 3,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1616421233882-b5b6329e4683?q=80&w=1932&auto=format&fit=crop',
        supplier: SUPPLIERS[2], // Avis
        features: ['Virtual Cockpit', 'Leather Seats'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'New York, NY',
        deposit: 500,
        excess: 1800,
        stopSales: [],
        rateTiers: [{ id: 'rt16', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 105 }] }],
        extras: [],
        locationDetail: "In Terminal T4",
        unlimitedMileage: true,
        detailedRatings: {
            cleanliness: 95,
            condition: 94,
            valueForMoney: 87,
            pickupSpeed: 92,
        }
    },
    {
        id: 'c17',
        make: 'Toyota',
        model: 'RAV4',
        year: 2024,
        category: CarCategory.SUV,
        type: CarType.SUV,
        sippCode: 'CFAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 5,
        bags: 3,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1631002888975-fc08ce12f2e7?q=80&w=2070&auto=format&fit=crop',
        supplier: SUPPLIERS[0], // Alamo
        features: ['Hybrid', 'Apple CarPlay', 'Safety Sense'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'Queen Alia International Airport',
        deposit: 300,
        excess: 1200,
        stopSales: [],
        rateTiers: [{ id: 'rt17', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 78 }] }],
        extras: [],
        locationDetail: "Meet & Greet - Representative with sign",
        unlimitedMileage: true,
        detailedRatings: {
            cleanliness: 93,
            condition: 94,
            valueForMoney: 90,
            pickupSpeed: 91,
        }
    },
    {
        id: 'c18',
        make: 'Renault',
        model: 'Clio',
        year: 2023,
        category: CarCategory.ECONOMY,
        type: CarType.HATCHBACK,
        sippCode: 'ECMR',
        transmission: Transmission.MANUAL,
        passengers: 5,
        bags: 2,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1595460027196-8d6a894c5a93?q=80&w=2070&auto=format&fit=crop',
        supplier: SUPPLIERS[3], // Europcar
        features: ['Bluetooth', 'Efficient'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'London, UK',
        deposit: 200,
        excess: 1000,
        stopSales: [],
        rateTiers: [{ id: 'rt18', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 40 }] }],
        extras: [],
        locationDetail: "Shuttle to off-airport location",
        unlimitedMileage: false,
        detailedRatings: {
            cleanliness: 86,
            condition: 88,
            valueForMoney: 90,
            pickupSpeed: 83,
        }
    },
    {
        id: 'c19',
        make: 'Peugeot',
        model: '208',
        year: 2023,
        category: CarCategory.ECONOMY,
        type: CarType.HATCHBACK,
        sippCode: 'ECMR',
        transmission: Transmission.MANUAL,
        passengers: 5,
        bags: 2,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1647416355294-099953846618?q=80&w=2070&auto=format&fit=crop',
        supplier: SUPPLIERS[3], // Europcar
        features: ['i-Cockpit', 'Bluetooth'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'London, UK',
        deposit: 220,
        excess: 950,
        stopSales: [],
        rateTiers: [{ id: 'rt19', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 43 }] }],
        extras: [],
        locationDetail: "In Terminal, Heathrow T5",
        unlimitedMileage: false,
        detailedRatings: {
            cleanliness: 87,
            condition: 89,
            valueForMoney: 91,
            pickupSpeed: 84,
        }
    },
    {
        id: 'c20',
        make: 'Volvo',
        model: 'XC60',
        year: 2023,
        category: CarCategory.SUV,
        type: CarType.SUV,
        sippCode: 'PDAR',
        transmission: Transmission.AUTOMATIC,
        passengers: 5,
        bags: 3,
        doors: 4,
        airCon: true,
        image: 'https://images.unsplash.com/photo-1617084252399-9069b3b3531?q=80&w=2070&auto=format&fit=crop',
        supplier: SUPPLIERS[1], // Hertz
        features: ['Leather', 'Pilot Assist', 'Premium Sound'],
        fuelPolicy: FuelPolicy.FULL_TO_FULL,
        isAvailable: true,
        location: 'Los Angeles, CA',
        deposit: 600,
        excess: 2000,
        stopSales: [],
        rateTiers: [{ id: 'rt20', name: 'Standard', startDate: '2023-01-01', endDate: '2025-12-31', rates: [{ minDays: 1, maxDays: 30, dailyRate: 115 }] }],
        extras: [],
        locationDetail: "Hertz Gold Member Canopy",
        unlimitedMileage: true,
        detailedRatings: {
            cleanliness: 96,
            condition: 95,
            valueForMoney: 89,
            pickupSpeed: 92,
        }
    }
];

MOCK_CARS.push(...extraCars);

export let MOCK_BOOKINGS: Booking[] = [
    {
        id: 'B1001',
        carId: 'c1',
        carName: 'Toyota Corolla',
        customerName: 'Alice Johnson',
        customerEmail: 'alice@example.com',
        customerPhone: '+1 555 0101',
        startDate: '2024-09-10',
        startTime: '10:00',
        endDate: '2024-09-15',
        endTime: '10:00',
        bookingDate: '2024-08-01',
        totalPrice: 225,
        status: 'confirmed',
        amountPaidOnline: 33.75, // 15%
        amountToPayAtDesk: 191.25,
        bookingMode: BookingMode.FREE_SALE,
        selectedExtras: [],
        flightNumber: 'AA1234',
        reviewSubmitted: false,
    },
    {
        id: 'B1002',
        carId: 'c2',
        carName: 'Ford Mustang Convertible',
        customerName: 'bob@example.com',
        customerEmail: 'bob@example.com',
        startDate: '2024-10-05',
        startTime: '12:00',
        endDate: '2024-10-08',
        endTime: '12:00',
        bookingDate: '2024-09-20',
        totalPrice: 285,
        status: 'pending',
        amountPaidOnline: 57, // 20%
        amountToPayAtDesk: 228,
        bookingMode: BookingMode.ON_REQUEST,
        selectedExtras: [],
        reviewSubmitted: false,
    },
    {
        id: 'B1003',
        carId: 'c3',
        carName: 'Jeep Wrangler',
        customerName: 'demo@hogicar.com',
        customerEmail: 'demo@hogicar.com',
        customerPhone: '+1 555 0103',
        startDate: '2024-06-01',
        startTime: '11:00',
        endDate: '2024-06-05',
        endTime: '11:00',
        bookingDate: '2024-05-15',
        totalPrice: 340,
        status: 'completed',
        amountPaidOnline: 51,
        amountToPayAtDesk: 289,
        bookingMode: BookingMode.FREE_SALE,
        selectedExtras: [],
        reviewSubmitted: false,
    }
];

export const addMockBooking = (bookingData: Omit<Booking, 'id' | 'bookingDate'>): Booking => {
  const newBooking: Booking = {
    ...bookingData,
    id: `B${Math.floor(1000 + Math.random() * 9000)}`,
    bookingDate: new Date().toISOString().split('T')[0],
    status: bookingData.bookingMode === BookingMode.ON_REQUEST ? 'pending' : 'confirmed',
    reviewSubmitted: false,
  };
  MOCK_BOOKINGS.unshift(newBooking);
  return newBooking;
};

export const submitReview = (bookingId: string, newRatings: { cleanliness: number, condition: number, valueForMoney: number, pickupSpeed: number }) => {
    const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) return false;

    const booking = MOCK_BOOKINGS[bookingIndex];
    const carIndex = MOCK_CARS.findIndex(c => c.id === booking.carId);
    if (carIndex === -1) return false;
    
    const car = MOCK_CARS[carIndex];

    const supplierIndex = SUPPLIERS.findIndex(s => s.id === car.supplier.id);
    if (supplierIndex === -1) return false;
    
    const supplier = SUPPLIERS[supplierIndex];

    // Convert 1-5 star rating to 0-100 percentage
    const newDetailed = {
        cleanliness: newRatings.cleanliness * 20,
        condition: newRatings.condition * 20,
        valueForMoney: newRatings.valueForMoney * 20,
        pickupSpeed: newRatings.pickupSpeed * 20,
    };

    // Update Car's Detailed Ratings (simple running average with one previous "review")
    const reviewCount = 2;
    if (car.detailedRatings) {
        car.detailedRatings.cleanliness = Math.round((car.detailedRatings.cleanliness + newDetailed.cleanliness) / reviewCount);
        car.detailedRatings.condition = Math.round((car.detailedRatings.condition + newDetailed.condition) / reviewCount);
        car.detailedRatings.valueForMoney = Math.round((car.detailedRatings.valueForMoney + newDetailed.valueForMoney) / reviewCount);
        car.detailedRatings.pickupSpeed = Math.round((car.detailedRatings.pickupSpeed + newDetailed.pickupSpeed) / reviewCount);
    } else {
        car.detailedRatings = newDetailed;
    }
    MOCK_CARS[carIndex] = car;

    // Update Supplier's Overall Rating
    const newOverallRating = (newRatings.cleanliness + newRatings.condition + newRatings.valueForMoney + newRatings.pickupSpeed) / 4.0;
    
    // Simple running average for supplier rating, assuming a base of 250 reviews
    const supplierReviewCount = 250;
    supplier.rating = ((supplier.rating * supplierReviewCount) + newOverallRating) / (supplierReviewCount + 1);
    supplier.rating = parseFloat(supplier.rating.toFixed(1));
    SUPPLIERS[supplierIndex] = supplier;

    // Mark booking as reviewed
    MOCK_BOOKINGS[bookingIndex].reviewSubmitted = true;

    return true;
};


export const modifyMockBooking = (bookingId: string, modifications: Partial<Booking>): Booking | null => {
    const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) {
        return null;
    }

    const originalBooking = MOCK_BOOKINGS[bookingIndex];
    const car = MOCK_CARS.find(c => c.id === originalBooking.carId);
    if (!car) return null;

    // Merge changes
    const updatedBookingData = { ...originalBooking, ...modifications };
    
    // Check if dates or extras changed to see if we need to recalculate price
    const datesChanged = originalBooking.startDate !== updatedBookingData.startDate || originalBooking.endDate !== updatedBookingData.endDate;
    const extrasChanged = JSON.stringify(originalBooking.selectedExtras) !== JSON.stringify(updatedBookingData.selectedExtras);

    if (datesChanged || extrasChanged) {
        const startD = new Date(updatedBookingData.startDate);
        const endD = new Date(updatedBookingData.endDate);
        const diffTime = Math.abs(endD.getTime() - startD.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

        const { total: newGrossTotal, netTotal: newNetTotal } = calculatePrice(car, days, updatedBookingData.startDate);
        
        const extrasTotal = (updatedBookingData.selectedExtras || []).reduce((acc, extra) => {
            return acc + (extra.type === 'per_day' ? extra.price * days : extra.price);
        }, 0);

        const finalTotal = newGrossTotal + extrasTotal;
        const { payNow, payAtDesk } = calculateBookingFinancials(newGrossTotal, newNetTotal, extrasTotal, car.supplier);
        
        updatedBookingData.totalPrice = finalTotal;
        updatedBookingData.amountPaidOnline = payNow;
        updatedBookingData.amountToPayAtDesk = payAtDesk;
    }

    // Set status to modified
    updatedBookingData.status = 'modified';

    // Update the booking in the main array
    MOCK_BOOKINGS[bookingIndex] = updatedBookingData;

    return updatedBookingData;
};


export const confirmBooking = (bookingId: string, confirmationNumber: string): boolean => {
    const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === bookingId);
    if (bookingIndex > -1 && MOCK_BOOKINGS[bookingIndex].status === 'pending') {
        MOCK_BOOKINGS[bookingIndex].status = 'confirmed';
        MOCK_BOOKINGS[bookingIndex].supplierConfirmationNumber = confirmationNumber;
        return true;
    }
    return false;
};

export const ADMIN_STATS = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 1890 },
    { name: 'Jun', revenue: 2390 },
    { name: 'Jul', revenue: 3490 },
    { name: 'Aug', revenue: 4200 },
    { name: 'Sep', revenue: 5100 },
    { name: 'Oct', revenue: 4500 },
    { name: 'Nov', revenue: 3900 },
    { name: 'Dec', revenue: 4800 },
];

export let MOCK_API_PARTNERS: ApiPartner[] = [
    { id: 'p1', name: 'Kayak', apiKey: 'pk_live_kayak_12345', status: 'active', createdAt: '2023-01-15' },
    { id: 'p2', name: 'Skyscanner', apiKey: 'pk_live_sky_67890', status: 'active', createdAt: '2023-03-22' },
];

export const generateApiKey = (): string => {
    return `pk_live_${[...Array(24)].map(() => Math.random().toString(36)[2]).join('')}`;
};

export const addMockApiPartner = (name: string) => {
    const newPartner: ApiPartner = {
        id: `p${Date.now()}`,
        name,
        apiKey: generateApiKey(),
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0]
    };
    MOCK_API_PARTNERS.push(newPartner);
};

export const updateApiPartnerStatus = (id: string, status: 'active' | 'inactive') => {
    const partner = MOCK_API_PARTNERS.find(p => p.id === id);
    if (partner) {
        partner.status = status;
    }
};

export const MOCK_PAGES: PageContent[] = [
    { slug: 'about', title: 'About Us', content: 'Hogicar is a leading car rental aggregator...', lastUpdated: '2023-12-01' },
    { slug: 'terms', title: 'Terms of Service', content: 'By using this service, you agree to the following terms...', lastUpdated: '2024-01-10' },
    { slug: 'privacy', title: 'Privacy Policy', content: 'Your privacy is important to us...', lastUpdated: '2024-01-15' },
    { slug: 'help', title: 'Help Center', content: 'Find answers to common questions here...', lastUpdated: '2024-02-20' },
    { slug: 'cookies', title: 'Cookie Policy', content: 'We use cookies to improve your experience...', lastUpdated: '2024-01-05' },
    { slug: 'press', title: 'Press', content: 'Latest news and media resources...', lastUpdated: '2024-03-01' },
];

export const getPage = (slug: string): PageContent | undefined => {
    return MOCK_PAGES.find(p => p.slug === slug);
};

export const updatePage = (slug: string, data: { title: string, content: string }) => {
    const page = MOCK_PAGES.find(p => p.slug === slug);
    if (page) {
        page.title = data.title;
        page.content = data.content;
        page.lastUpdated = new Date().toISOString().split('T')[0];
    }
};

export let MOCK_AFFILIATES: Affiliate[] = [
    { id: 'aff1', name: 'Travel Bloggers LLC', email: 'partners@travelbloggers.com', password: 'password123', website: 'https://travelbloggers.com', status: 'active', commissionRate: 0.07, totalEarnings: 1250.50, clicks: 5420, conversions: 125, joinDate: '2023-05-12' },
    { id: 'aff2', name: 'Nomad Couple', email: 'hello@nomadcouple.com', password: 'password123', website: 'https://nomadcouple.com', status: 'pending', commissionRate: 0.05, totalEarnings: 340.00, clicks: 1200, conversions: 28, joinDate: '2023-08-20' }
];

export const registerAffiliate = (name: string, email: string, website: string, password?: string): Affiliate => {
    const newAffiliate: Affiliate = {
        id: `aff${Date.now()}`,
        name,
        email,
        website,
        password,
        status: 'pending',
        commissionRate: 0.05, // Default rate
        totalEarnings: 0,
        clicks: 0,
        conversions: 0,
        joinDate: new Date().toISOString().split('T')[0]
    };
    MOCK_AFFILIATES.push(newAffiliate);
    return newAffiliate;
};

export const updateAffiliateStatus = (id: string, status: Affiliate['status']) => {
    const affiliate = MOCK_AFFILIATES.find(a => a.id === id);
    if (affiliate) {
        affiliate.status = status;
    }
};

export const updateAffiliateCommissionRate = (id: string, rate: number) => {
    const affiliate = MOCK_AFFILIATES.find(a => a.id === id);
    if (affiliate) {
        affiliate.commissionRate = rate;
    }
};

export let MOCK_SUPPLIER_APPLICATIONS: SupplierApplication[] = [
    {
        id: `app${Date.now()}`,
        companyName: 'Florida Sunshine Cars',
        website: 'https://floridacars.com',
        contactName: 'John Sunshine',
        email: 'john@floridacars.com',
        phone: '555-123-4567',
        fleetSize: '51-200',
        primaryLocation: 'Miami, FL',
        integrationType: 'api',
        status: 'pending',
        submissionDate: new Date().toISOString().split('T')[0]
    }
];

export const submitSupplierApplication = (applicationData: Omit<SupplierApplication, 'id' | 'status' | 'submissionDate'>) => {
    const newApplication: SupplierApplication = {
        ...applicationData,
        id: `app${Date.now()}`,
        status: 'pending',
        submissionDate: new Date().toISOString().split('T')[0]
    };
    MOCK_SUPPLIER_APPLICATIONS.push(newApplication);
    return newApplication;
};

export const removeSupplierApplication = (id: string) => {
    MOCK_SUPPLIER_APPLICATIONS = MOCK_SUPPLIER_APPLICATIONS.filter(app => app.id !== id);
};

export let MOCK_SEO_CONFIGS: SEOConfig[] = [
    {
        route: '/',
        title: 'Hogicar | Affordable Car Rentals Worldwide',
        description: 'Compare car rental deals from 900+ suppliers at 60,000+ locations. Find the perfect car for your next trip with Hogicar.',
        keywords: 'car rental, cheap car hire, rent a car, auto rental',
        ogImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e-40d?q=80&w=2070&auto=format&fit=crop'
    },
    {
        route: '/about',
        title: 'About Hogicar | Our Story',
        description: 'Learn about Hogicar\'s mission to make car rental transparent, affordable, and accessible for everyone.',
        keywords: 'about hogicar, car rental company, travel tech'
    }
];

export const updateSeoConfig = (config: SEOConfig) => {
    const index = MOCK_SEO_CONFIGS.findIndex(c => c.route === config.route);
    if (index > -1) {
        MOCK_SEO_CONFIGS[index] = config;
    } else {
        MOCK_SEO_CONFIGS.push(config);
    }
};

export const saveCarModel = (model: CarModel) => {
    if (model.id) {
        const index = MOCK_CAR_LIBRARY.findIndex(m => m.id === model.id);
        if (index > -1) {
            MOCK_CAR_LIBRARY[index] = model;
        }
    } else {
        model.id = `cm${Date.now()}`;
        MOCK_CAR_LIBRARY.push(model);
    }
    // Sync the updated image to all cars of the same model in the main MOCK_CARS array.
    MOCK_CARS.forEach((car, index) => {
        if (car.make === model.make && car.model === model.model) {
            MOCK_CARS[index].image = model.image;
        }
    });
};

export const deleteCarModel = (id: string) => {
    MOCK_CAR_LIBRARY = MOCK_CAR_LIBRARY.filter(m => m.id !== id);
};

export let MOCK_CATEGORY_IMAGES: { [key in CarCategory]: string } = {
    [CarCategory.MINI]: 'https://images.unsplash.com/photo-1580273916550-4821b3a160fa?w=500&auto=format&fit=crop',
    [CarCategory.ECONOMY]: 'https://images.unsplash.com/photo-1580273916550-4821b3a160fa?w=500&auto=format&fit=crop',
    [CarCategory.COMPACT]: 'https://images.unsplash.com/photo-1580273916550-4821b3a160fa?w=500&auto=format&fit=crop',
    [CarCategory.MIDSIZE]: 'https://images.unsplash.com/photo-1614026480209-52c62c1a8448?w=500&auto=format&fit=crop',
    [CarCategory.FULLSIZE]: 'https://images.unsplash.com/photo-1614026480209-52c62c1a8448?w=500&auto=format&fit=crop',
    [CarCategory.SUV]: 'https://images.unsplash.com/photo-1554744512-d6c603f27c54?w=500&auto=format&fit=crop',
    [CarCategory.LUXURY]: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&auto=format&fit=crop',
    [CarCategory.VAN]: 'https://images.unsplash.com/photo-1605335193652-c234a9726245?w=500&auto=format&fit=crop',
    [CarCategory.PEOPLE_CARRIER]: 'https://images.unsplash.com/photo-1605335193652-c234a9726245?w=500&auto=format&fit=crop',
};

export let MOCK_HOMEPAGE_CONTENT: HomepageContent = {
  hero: {
    title: 'Car Hire – Search, Compare & Save',
    subtitle: 'Free cancellations on most bookings • 60,000+ locations • Customer support in 40+ languages',
    backgroundImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e-40d?q=80&w=2070&auto=format&fit=crop',
  },
  searchWidgetTitle: "Let's find your ideal car",
  features: [
    { id: 'f1', icon: 'Globe', title: 'Global Coverage', description: '60,000+ locations worldwide' },
    { id: 'f2', icon: 'Tag', title: 'Price Match Guarantee', description: "We'll match any lower price" },
    { id: 'f3', icon: 'Star', title: 'Excellent Reviews', description: 'Rated 4.8/5 by our customers' },
    { id: 'f4', icon: 'Award', title: 'Award-Winning Service', description: '24/7 multilingual support' },
  ],
  howItWorks: {
    title: 'Get Your Perfect Car in 3 Easy Steps',
    subtitle: 'Renting a car has never been simpler. Follow our straightforward process to get on the road in no time.',
    steps: [
      { id: 's1', icon: 'Search', title: 'Search', description: 'Enter your location and dates to find available cars.' },
      { id: 's2', icon: 'FileSymlink', title: 'Compare', description: 'Filter and sort to find the best deal from hundreds of suppliers.' },
      { id: 's3', icon: 'BookCheck', title: 'Book', description: 'Select your car, add extras, and book securely in minutes.' },
    ],
  },
  valuePropositions: [
    { id: 'vp1', icon: 'CheckCircle', title: 'Flexible Bookings', description: 'Cancel or change most bookings for free up to 48 hours before pick-up.' },
    { id: 'vp2', icon: 'Shield', title: 'No Hidden Fees', description: 'Know exactly what you’re paying. We believe in transparent pricing.' },
    { id: 'vp3', icon: 'Tag', title: 'Price Match Guarantee', description: 'Found the same deal for less? We\'ll match the price.' },
  ],
  popularDestinations: {
    title: 'Popular Destinations',
    subtitle: "Discover the world's top spots for road trips and adventure.",
    destinations: [
      { id: 'd1', name: 'London', country: 'United Kingdom', price: 35, image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2070&auto=format&fit=crop' },
      { id: 'd2', name: 'Miami', country: 'United States', price: 42, image: 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?q=80&w=1974&auto=format&fit=crop' },
      { id: 'd3', name: 'Paris', country: 'France', price: 38, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop' },
      { id: 'd4', name: 'Dubai', country: 'UAE', price: 45, image: 'https://images.unsplash.com/photo-1512453979798-5ea936a79402?q=80&w=2070&auto=format&fit=crop' },
    ],
  },
  partners: {
    title: 'We work with the best',
  },
  cta: {
    title: 'Save time, save money!',
    subtitle: "Sign up and we'll send the best deals to you",
  },
  faqs: {
    title: 'Frequently Asked Questions',
    items: [
      { id: 'faq1', question: "What do I need to rent a car?", answer: "To book a car, you need a credit or debit card. When you pick the car up, you'll need: Your voucher / e-voucher, to show that you've paid for the car. The main driver's credit card, with enough funds for the car's deposit. The main driver's full, valid driving licence, which they've held for at least 12 months. Your passport or any other ID the car hire company needs to see." },
      { id: 'faq2', question: "How old do I have to be to rent a car?", answer: "For most car hire companies, the age requirement is between 21 and 70 years old. If you're under 25 or over 70, you might have to pay an additional fee." },
    ],
  },
};

export let MOCK_APP_CONFIG = {
  searchingScreenDuration: 5000, // default in ms
  commissionPercent: 15,
};

export let MOCK_PROMO_CODES: PromoCode[] = [
    { id: 'promo1', code: 'HOGI10', discount: 0.10, status: 'active' },
    { id: 'promo2', code: 'SAVE20', discount: 0.20, status: 'active' },
    { id: 'promo3', code: 'WINTER', discount: 0.15, status: 'inactive' },
];

export const getPromoCode = (code: string): PromoCode | undefined => {
    return MOCK_PROMO_CODES.find(p => p.code.toUpperCase() === code.toUpperCase());
};

export const addPromoCode = (code: string, discount: number): PromoCode => {
    const newPromo: PromoCode = {
        id: `promo${Date.now()}`,
        code: code.toUpperCase(),
        discount: discount / 100, // convert percentage to decimal
        status: 'active'
    };
    MOCK_PROMO_CODES.unshift(newPromo);
    return newPromo;
};

export const updatePromoCodeStatus = (id: string, status: 'active' | 'inactive') => {
    const promo = MOCK_PROMO_CODES.find(p => p.id === id);
    if (promo) {
        promo.status = status;
    }
};

export const deletePromoCode = (id: string) => {
    MOCK_PROMO_CODES = MOCK_PROMO_CODES.filter(p => p.id !== id);
};

export const updateAppConfig = (newConfig: Partial<typeof MOCK_APP_CONFIG>) => {
  MOCK_APP_CONFIG = { ...MOCK_APP_CONFIG, ...newConfig };
};

export const updateCategoryImages = (newImages: { [key in CarCategory]: string }) => {
    MOCK_CATEGORY_IMAGES = newImages;
};

export const updateHomepageContent = (newContent: HomepageContent) => {
    MOCK_HOMEPAGE_CONTENT = newContent;
};

export const calculatePrice = (car: Car, days: number, startDate: string): { dailyRate: number; total: number; netTotal: number; promotionLabel?: string, tierName?: string } => {
    // Find applicable rate tier
    const startParts = startDate.split('-').map(Number);
    const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);

    const tier = car.rateTiers.find(t => {
        const tStartParts = t.startDate.split('-').map(Number);
        const tStart = new Date(tStartParts[0], tStartParts[1] - 1, tStartParts[2]);
        const tEndParts = t.endDate.split('-').map(Number);
        const tEnd = new Date(tEndParts[0], tEndParts[1] - 1, tEndParts[2]);
        
        tEnd.setHours(23, 59, 59, 999);
        
        return start >= tStart && start <= tEnd;
    });

    let netDailyRate = 50; // Default fallback
    let promotionLabel = undefined;
    let tierName = undefined;

    if (tier && tier.rates) {
        // Find rate by duration
        const rateBand = tier.rates.find(r => days >= r.minDays && days <= r.maxDays);
        if (rateBand) {
            netDailyRate = rateBand.dailyRate;
        } else if (tier.rates.length > 0) {
             // Fallback to the rate of the last band (longest duration usually)
             netDailyRate = tier.rates[tier.rates.length - 1].dailyRate;
        }
        promotionLabel = tier.promotionLabel;
        tierName = tier.name;
    }
    
    // If final price is from API, it's already the gross daily rate.
    if (car.hasFinalPriceFromApi) {
        const correctNetTotal = (car.netPrice || 0) * days;
        return {
            dailyRate: netDailyRate,
            total: netDailyRate * days,
            netTotal: correctNetTotal,
            promotionLabel,
            tierName
        };
    }

    const netTotal = netDailyRate * days;
    let grossTotal = netTotal;

    // ADD COMMISSION ON TOP
    switch(car.supplier.commissionType) {
        case CommissionType.PARTIAL_PREPAID:
        case CommissionType.FULL_PREPAID:
            // This is a percentage markup
            grossTotal = netTotal * (1 + car.supplier.commissionValue);
            break;
        case CommissionType.PAY_AT_DESK:
            // This is a fixed fee PER BOOKING added on top.
            grossTotal = netTotal + car.supplier.commissionValue;
            break;
    }

    return {
        dailyRate: grossTotal / days, // Return gross daily rate
        total: grossTotal, // Return gross total
        netTotal: netTotal,
        promotionLabel,
        tierName
    };
};

export const calculateBookingFinancials = (grossTotal: number, netTotal: number, extrasTotal: number, supplier: Supplier) => {
    const commissionAmount = grossTotal - netTotal;
    const payNow = commissionAmount;
    const payAtDesk = netTotal + extrasTotal;

    return { payNow, payAtDesk };
};

export const addMockSupplier = (supplier: Supplier) => {
    if (supplier.id) { // Existing supplier
        const index = SUPPLIERS.findIndex(s => s.id === supplier.id);
        if (index > -1) {
            SUPPLIERS[index] = supplier;
            // Propagate changes to all cars with this supplier
            MOCK_CARS.forEach((car, carIndex) => {
                if (car.supplier.id === supplier.id) {
                    MOCK_CARS[carIndex].supplier = supplier;
                }
            });
        }
    } else { // New supplier
        const newSupplier: Supplier = {
            rating: 0,
            status: 'pending',
            gracePeriodHours: 1,
            minBookingLeadTime: 24,
            connectionType: 'manual',
            logo: 'https://placehold.co/100x100/e2e8f0/64748b?text=Logo',
            enableSocialProof: false,
            ...supplier,
            id: `s${Date.now()}`,
        };
        SUPPLIERS.unshift(newSupplier);
    }
};

export const processSupplierXmlUpdate = async (supplierId: string): Promise<{ success: boolean, message: string }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({ success: true, message: "Inventory synced successfully (14 vehicles updated, 2 removed)." });
        }, 2000);
    });
};

export const getAvailableLocations = (): string[] => {
    const locations = new Set(MOCK_CARS.map(car => car.location));
    return Array.from(locations).sort();
};
