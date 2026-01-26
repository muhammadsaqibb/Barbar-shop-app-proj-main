



export interface StaffPermissions {
  canViewBookings: boolean;
  canAddWalkInBookings: boolean;
  canEditBookingStatus: boolean;
  canManageCustomers: boolean;
  canViewOverview: boolean;
}

export interface AppUser {
  id?: string; // from firestore doc id
  uid: string;
  email: string | null;
  name: string | null;
  role: 'client' | 'admin' | 'staff';
  permissions?: StaffPermissions;
  enabled?: boolean;
  homepageLayout?: string[];
}

export interface Service {
  id: string;
  name:string;
  isPackage: boolean;
  price: number;
  discountedPrice?: number;
  duration: number; // in minutes
  description?: string;
  enabled: boolean;
  maxQuantity?: number;
}

export interface Barber {
  id: string;
  name: string;
  phone?: string;
}

export interface Appointment {
  id:string;
  clientId: string;
  clientName: string | null;
  services: { id: string, name: string, price: number, duration: number, quantity: number }[];
  totalPrice: number;
  totalDuration: number;
  date: string;
  time: string;
  barberId: string | null;
  notes: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  paymentMethod: 'cash' | 'online';
  paymentStatus: 'paid' | 'unpaid';
  createdAt: any;
  bookedBy?: string | null;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  createdAt: any;
  notes?: string;
}

export interface ShopSettings {
  id?: string;
  openingTime: string; // e.g. "09:00"
  closingTime: string; // e.g. "18:00"
}

export interface PaymentMethod {
    id: string;
    methodName: string;
    accountHolderName: string;
    accountNumber: string;
}
    
