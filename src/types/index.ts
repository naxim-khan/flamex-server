import { OrderType, OrderStatus, PaymentStatus, DeliveryStatus, UserRole } from '../generated/prisma/client';

export interface OrderFilter {
  orderType?: OrderType;
  paymentStatus?: PaymentStatus;
  orderStatus?: OrderStatus;
  deliveryStatus?: DeliveryStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface CreateOrderInput {
  items: Array<{
    menuItemId: number;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  paymentMethod: 'cash' | 'bank_transfer';
  amountTaken?: number;
  returnAmount?: number;
  orderType?: OrderType;
  customerId?: number;
  deliveryAddress?: string;
  deliveryNotes?: string;
  deliveryCharge?: number;
  paymentStatus?: PaymentStatus;
  specialInstructions?: string;
  tableNumber?: number;
  discountPercent?: number;
}

export interface UpdateOrderInput extends Partial<CreateOrderInput> {
  changeReason?: string;
  editedBy?: string;
  ipAddress?: string;
}

export interface PrinterConfig {
  vendorId?: string;
  productId?: string;
  port?: string;
  ip?: string;
}

export interface BusinessInfo {
  key: string;
  value: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  password: string;
  fullName: string;
  role: 'admin' | 'manager';
  email?: string;
  phone?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface AuthResponse {
  user: any;
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  categoryId?: number;
  category?: Category;
  imageUrl?: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}