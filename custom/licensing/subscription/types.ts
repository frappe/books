/**
 * Subscription Module Type Definitions
 */

export interface SubscriptionConfig {
  clickpesaApiUrl: string;
  clickpesaClientId: string;
  clickpesaApiKey: string;
  clickpesaChecksumKey: string;
  yearlyLicensePrice: number;
  paymentTimeout: number; // milliseconds
}

export interface SubscriptionPurchaseRequest {
  phoneNumber: string;
  paymentMethod: string;
}

export interface SubscriptionPurchaseResult {
  success: boolean;
  transactionId?: string;
  newLicenseKey?: string;
  error?: string;
  message?: string;
}

export interface PaymentStatusResult {
  status: 'pending' | 'completed' | 'failed' | 'expired';
  transactionId: string;
  message?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}
