




export interface StaffPermissions {
  canViewBookings: boolean;
  canAddWalkInBookings: boolean;
  canEditBookingStatus: boolean;
  canManageCustomers: boolean;
  canViewOverview: boolean;
}

export interface AppUser {
  id?: string;
  uid: string;
  email: string | null;
  name: string | null;
  role: 'client' | 'admin' | 'staff';
  shopId?: string;
  permissions?: StaffPermissions;
  enabled?: boolean;
  homepageLayout?: string[];
  referralCode?: string;
  referredBy?: string | null;
  rewardBalance?: number;
  welcomeRewardUsed?: boolean;
  referralStats?: {
    totalReferrals: number;
    successfulReferrals: number;
    totalRewardsEarned: number;
  };
}

export interface Shop {
  id: string;
  name: string;
  ownerId: string;
  plan: 'free' | 'basic' | 'pro';
  customerCount: number;
  bookingCount?: number;
  maxCustomers: number;
  status: 'active' | 'suspended';
  createdAt: any;
  adminPin?: string;
  featureLocks?: Record<string, boolean>;
  soundEnabled?: boolean;
  settings?: {
    themeColor?: string;
    logoUrl?: string; // Legacy field, prioritize `logo` below
  };
  // Location & Media
  address?: string;
  city?: string;
  location?: {
    lat: number;
    lng: number;
  };
  featuredImage?: string;
  logo?: string;
}

export interface Service {
  id: string;
  shopId: string;
  name: string;
  isPackage: boolean;
  price: number;
  discountedPrice?: number;
  duration: number;
  description?: string;
  enabled: boolean;
  maxQuantity?: number;
}

export interface Barber {
  id: string;
  shopId: string;
  name: string;
  phone?: string;
}

export interface Appointment {
  id: string;
  shopId: string;
  clientId?: string | null;
  clientName: string | null;
  clientPhone?: string | null;
  services: { id: string, name: string, price: number, duration: number, quantity: number }[];
  totalPrice: number;
  totalDuration: number;
  date: string;
  time: string;
  barberId: string | null;
  notes: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  paymentMethod: 'cash' | 'online' | 'pending';
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  createdAt: any;
  bookedBy?: string | null;
  bookingType: 'online' | 'walk-in';
  rewardApplied?: number;
}

export interface Expense {
  id: string;
  shopId: string;
  name: string;
  amount: number;
  createdAt: any;
  notes?: string;
}

export interface ReferralSettings {
  enabled: boolean;
  referrerRewardType: 'fixed' | 'percentage';
  referrerRewardValue: number;
  newClientRewardType: 'fixed' | 'percentage';
  newClientRewardValue: number;
  oneTimeOnly: boolean;
  expiryDays?: number;
}

export interface CurrencySettings {
  baseCurrency: string;
  rates: Record<string, number>; // e.g., { USD: 280, EUR: 300 }
  displayCurrencies: string[]; // List of enabled currencies for display
}

export interface ShopSettings {
  id?: string;
  shopId: string;
  openingTime: string;
  closingTime: string;
  referralSettings?: ReferralSettings;
  currencySettings?: CurrencySettings;
}

export interface PaymentMethod {
  id: string;
  shopId: string;
  methodName: string;
  accountHolderName: string;
  accountNumber: string;
}

