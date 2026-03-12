/**
 * Subscription Manager
 * Orchestrates the complete subscription purchase flow:
 * 1. Payment via ClickPesa
 * 2. License creation via Keymint
 * 3. Old license deletion
 * 4. New license activation
 */

import { ClickPesaClient, PaymentMethod } from '../api/clickpesa-client';
import { KeymintClient } from '../api/keymint-client';
import { loadLicenseCache, clearLicenseCache } from '../cache/license-cache';
import { LicenseConfig, LicenseValidationResult } from '../types';
import {
  SubscriptionConfig,
  SubscriptionPurchaseRequest,
  SubscriptionPurchaseResult,
  PaymentStatusResult,
} from './types';

export class SubscriptionManager {
  private clickpesa: ClickPesaClient;
  private keymint: KeymintClient;
  private licenseConfig: LicenseConfig;
  private subscriptionConfig: SubscriptionConfig;

  constructor(
    licenseConfig: LicenseConfig,
    subscriptionConfig: SubscriptionConfig
  ) {
    this.licenseConfig = licenseConfig;
    this.subscriptionConfig = subscriptionConfig;

    this.clickpesa = new ClickPesaClient(
      subscriptionConfig.clickpesaApiUrl,
      subscriptionConfig.clickpesaClientId,
      subscriptionConfig.clickpesaApiKey,
      subscriptionConfig.clickpesaChecksumKey,
      subscriptionConfig.paymentTimeout
    );

    this.keymint = new KeymintClient(
      licenseConfig.apiUrl,
      licenseConfig.accessToken,
      licenseConfig.validationTimeout
    );
  }

  // ───────────────────────────────────────────
  // Payment Methods
  // ───────────────────────────────────────────

  /**
   * Get available payment methods.
   *
   * Dummy values are passed internally — the Preview endpoint only needs a
   * structurally valid phone number and a non-zero amount to return the list
   * of active channels. These are not tied to any real transaction.
   *
   * @param phoneNumber  Optional override (defaults to a dummy TZ number)
   * @param amount       Optional override (defaults to yearlyLicensePrice)
   */
  async getPaymentMethods(
    phoneNumber = '255700000000',
    amount?: number
  ): Promise<PaymentMethod[]> {
    const resolvedAmount =
      amount ?? this.subscriptionConfig.yearlyLicensePrice ?? 500000;
    return this.clickpesa.getPaymentMethods(phoneNumber, resolvedAmount, 'TZS');
  }

  // ───────────────────────────────────────────
  // Initiate Payment
  // ───────────────────────────────────────────

  /**
   * Initiate a USSD-PUSH payment and return the orderReference for polling.
   *
   * orderReference must be purely alphanumeric — no hyphens or special chars.
   * Ref: https://docs.clickpesa.com (Invalid Order Reference error)
   */
  async initiatePayment(
    request: SubscriptionPurchaseRequest
  ): Promise<{ orderReference: string }> {
    console.log('\n=== Initiating Subscription Payment ===');

    if (!this.isValidTanzanianPhone(request.phoneNumber)) {
      throw new Error(
        'Invalid phone number format. Use: 255712345678 or 0712345678'
      );
    }

    // ✅ Purely alphanumeric — no hyphens allowed by ClickPesa
    const orderReference = `LICORD${Date.now()}`;

    const checkoutResponse = await this.clickpesa.initiateCheckout({
      // ClickPesa adds fee on top, so we send chargeAmount (= yearlyPrice - fee)
      // ensuring customer USSD shows exactly yearlyLicensePrice.
      amount: request.amount ?? this.subscriptionConfig.yearlyLicensePrice,
      phoneNumber: request.phoneNumber,
      currency: 'TZS',
      orderReference,
    });

    // ✅ CheckoutResponse has `status`, not `success`
    if (
      checkoutResponse.status !== 'PROCESSING' &&
      checkoutResponse.status !== 'SUCCESS'
    ) {
      throw new Error(
        `Failed to initiate payment. Status: ${checkoutResponse.status}`
      );
    }

    // ✅ Use orderReference for polling — CheckoutResponse has no `transactionId`
    const resolvedOrderRef = checkoutResponse.orderReference || orderReference;

    console.log('✓ Payment initiated. Order Reference:', resolvedOrderRef);

    return { orderReference: resolvedOrderRef };
  }

  // ───────────────────────────────────────────
  // Check Payment Status
  // ───────────────────────────────────────────

  /**
   * Poll payment status by orderReference.
   * Maps ClickPesa statuses to the internal normalized set.
   */
  async checkPaymentStatus(
    orderReference: string
  ): Promise<PaymentStatusResult> {
    const record = await this.clickpesa.checkPaymentStatus(orderReference);

    // ✅ ClickPesa statuses: SUCCESS | SETTLED | PROCESSING | PENDING | FAILED
    let normalizedStatus: 'pending' | 'completed' | 'failed';
    switch (record.status) {
      case 'SUCCESS':
      case 'SETTLED':
        normalizedStatus = 'completed';
        break;
      case 'FAILED':
        normalizedStatus = 'failed';
        break;
      case 'PROCESSING':
      case 'PENDING':
      default:
        normalizedStatus = 'pending';
    }

    return {
      status: normalizedStatus,
      transactionId: orderReference,
      message: record.message,
      customer: record.customer ? {
        name: record.customer.customerName,
        email: record.customer.customerEmail,
        phone: record.customer.customerPhoneNumber,
      } : undefined,
    };
  }

  // ───────────────────────────────────────────
  // Complete Subscription
  // ───────────────────────────────────────────

  /**
   * Verify payment, create a new Keymint license, retire the old one.
   */
  async completeSubscription(
    orderReference: string
  ): Promise<SubscriptionPurchaseResult> {
    console.log('\n=== Completing Subscription ===');
    console.log('Order Reference:', orderReference);

    try {
      // 1. Verify payment is completed
      const paymentStatus = await this.checkPaymentStatus(orderReference);
      if (paymentStatus.status !== 'completed') {
        return {
          success: false,
          error: `Payment not completed. Status: ${paymentStatus.status}`,
        };
      }

      // 2. Get current license details for email / name
      const currentLicense = loadLicenseCache();
      
      let licenseeEmail = currentLicense?.licenseeEmail;
      let licenseeName = currentLicense?.licenseeName;
      let customerId = currentLicense?.customerId;
      const oldLicenseKey = currentLicense?.licenseKey;

      // Fallback to ClickPesa customer details if cache is missing
      if (!licenseeEmail || !licenseeName) {
        console.log('User details missing from cache, using payment record details...');
        licenseeEmail = licenseeEmail || paymentStatus.customer?.email;
        licenseeName = licenseeName || paymentStatus.customer?.name;
      }

      if (!licenseeEmail || !licenseeName) {
        return {
          success: false,
          error: 'License email or name not found in cache or payment record.',
        };
      }

      // 3. Create new license key (12 months / 3 activations)
      // Use customerId from Keymint if we have it, otherwise let it be undefined
      // as Keymint API may fail if the customerId (email) doesn't exist.
      const targetCustomerId = customerId;
      console.log('Creating new license for customer target:', targetCustomerId || 'none (fallback)');

      // Calculate 12-month expiration date
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      const expiresAt = expirationDate.toISOString();

      let createResponse = await this.keymint.createLicense(
        this.licenseConfig.productId,
        targetCustomerId,
        '3',
        expiresAt
      );

      // Add a fallback if it fails due to customer not found
      if (createResponse.code !== 0 && 
          (createResponse.message?.includes('not found') || createResponse.message?.includes('Customer'))) {
        console.warn('Keymint reported customer error, trying fallback without customerId...');
        createResponse = await this.keymint.createLicense(
          this.licenseConfig.productId,
          undefined,
          '3',
          expiresAt
        );
      }

      if (createResponse.code !== 0) {
        throw new Error(
          createResponse.message || 'Failed to create new license key'
        );
      }

      const newLicenseKey =
        (createResponse as any).licenseKey ||
        (createResponse as any).license_key ||
        (createResponse as any).key;

      if (!newLicenseKey) {
        throw new Error('New license key not found in Keymint response');
      }

      console.log(
        'New license key created:',
        newLicenseKey.substring(0, 10) + '…'
      );

      // 4. Delete old license key (non-critical)
      if (oldLicenseKey) {
        try {
          await this.keymint.deleteLicense(oldLicenseKey);
          console.log('Old license deleted successfully');
        } catch (error) {
          console.warn('Failed to delete old license (non-critical):', error);
        }
      }

      // 5. Clear old license cache
      clearLicenseCache();
      console.log('Old license cache cleared');

      return {
        success: true,
        transactionId: orderReference,
        newLicenseKey,
        message: 'Subscription completed successfully',
      };
    } catch (error) {
      console.error('Subscription completion error:', error);
      return {
        success: false,
        transactionId: orderReference,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ───────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────

  private isValidTanzanianPhone(phone: string): boolean {
    const cleaned = phone.trim().replace(/\s+/g, '');
    console.log('Validating phone:', cleaned);

    if (/^\+255[67]\d{8}$/.test(cleaned)) {
      console.log('✓ +255XXXXXXXXX');
      return true;
    }
    if (/^255[67]\d{8}$/.test(cleaned)) {
      console.log('✓ 255XXXXXXXXX');
      return true;
    }
    if (/^0[67]\d{8}$/.test(cleaned)) {
      console.log('✓ 0XXXXXXXXX');
      return true;
    }

    console.error(
      '✗ Invalid phone format:',
      cleaned,
      '(length:',
      cleaned.length + ')'
    );
    return false;
  }
}
