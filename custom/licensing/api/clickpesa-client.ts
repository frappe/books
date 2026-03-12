/**
 * ClickPesa API Client
 * Fully compliant with the official ClickPesa API documentation
 * Official API Docs: https://docs.clickpesa.com/
 *
 * Required environment variables:
 *   CLICKPESA_API_URL       = https://api.clickpesa.com
 *   CLICKPESA_CLIENT_ID     = Your Application Client ID (from ClickPesa dashboard)
 *   CLICKPESA_API_KEY       = Your Application API Key
 *   CLICKPESA_CHECKSUM_KEY  = Your Checksum Key (for payload signing)
 */

import fetch from 'node-fetch';
import { createHmac } from 'crypto';

// ─────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────

export interface PaymentMethod {
  name: string;
  status: 'AVAILABLE' | string;
  fee?: number;
  message?: string | number;
}

export interface SenderDetails {
  accountName: string;
  accountNumber: string;
  accountProvider: string;
}

export interface PreviewPaymentResponse {
  activeMethods: PaymentMethod[];
  sender?: SenderDetails;
}

export interface InitiateCheckoutRequest {
  amount: number;
  phoneNumber: string;
  currency?: string;
  orderReference?: string;
  fetchSenderDetails?: boolean;
}

export interface CheckoutResponse {
  id: string;
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'SETTLED';
  channel: string;
  orderReference: string;
  collectedAmount: string;
  collectedCurrency: string;
  createdAt: string;
  clientId: string;
}

export type PaymentStatus =
  | 'SUCCESS'
  | 'SETTLED'
  | 'PROCESSING'
  | 'PENDING'
  | 'FAILED';

export interface PaymentRecord {
  id: string;
  status: PaymentStatus;
  paymentReference: string;
  paymentPhoneNumber: string;
  orderReference: string;
  collectedAmount: number;
  collectedCurrency: string;
  message: string;
  updatedAt: string;
  createdAt: string;
  customer?: {
    customerName?: string;
    customerPhoneNumber?: string;
    customerEmail?: string;
  };
  clientId: string;
}

// ─────────────────────────────────────────────
// Internal types
// ─────────────────────────────────────────────

interface TokenResponse {
  success: boolean;
  /** Returned as "Bearer <jwt>" — already includes the prefix */
  token: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

// ─────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────

export class ClickPesaClient {
  private readonly apiUrl: string;
  private readonly clientId: string;
  private readonly apiKey: string;
  private readonly checksumKey: string;
  private readonly timeout: number;

  /** Stored WITHOUT the "Bearer " prefix so we add it cleanly ourselves */
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    apiUrl: string,
    clientId: string,
    apiKey: string,
    checksumKey: string,
    timeout = 30_000
  ) {
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.clientId = clientId;
    this.apiKey = apiKey;
    this.checksumKey = checksumKey;
    this.timeout = timeout;

    const missing: string[] = [];
    if (!clientId) missing.push('CLICKPESA_CLIENT_ID');
    if (!apiKey) missing.push('CLICKPESA_API_KEY');
    if (!checksumKey) missing.push('CLICKPESA_CHECKSUM_KEY');

    if (missing.length) {
      // console.warn('⚠️  ClickPesa credentials not fully configured:');
      missing.forEach((m) => console.warn(`   - ${m} is missing`));
    } else {
      // console.log('✓ ClickPesa client initialised');
    }
  }

  // ───────────────────────────────────────────
  // Checksum
  // ───────────────────────────────────────────

  /**
   * Recursively sort all object keys alphabetically at every nesting level.
   * Arrays are mapped element-by-element. Primitives are returned as-is.
   * Ref: https://docs.clickpesa.com/home/checksum
   */
  private canonicalize(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.canonicalize(item));
    const sorted = obj as Record<string, unknown>;
    return Object.keys(sorted)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = this.canonicalize(sorted[key]);
        return acc;
      }, {});
  }

  /**
   * Generate HMAC-SHA256 checksum for a request payload.
   * Algorithm: canonicalize → JSON.stringify → HMAC-SHA256 hex digest.
   * Never include `checksum` or `checksumMethod` in the payload passed here.
   * Ref: https://docs.clickpesa.com/home/checksum
   */
  private calculateChecksum(payload: Record<string, unknown>): string {
    const canonical = this.canonicalize(payload);
    const payloadString = JSON.stringify(canonical);
    return createHmac('sha256', this.checksumKey)
      .update(payloadString)
      .digest('hex');
  }

  // ───────────────────────────────────────────
  // Authorization
  // ───────────────────────────────────────────

  /**
   * Generate (or return cached) JWT access token.
   * Endpoint : POST /third-parties/generate-token
   * Auth     : `api-key` + `client-id` headers — NO body
   * Ref: https://docs.clickpesa.com/api-reference/authorization/generate-token
   */
  private async generateAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 300_000) {
      return this.accessToken;
    }

    // console.log('Generating new ClickPesa access token…');

    const url = `${this.apiUrl}/third-parties/generate-token`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'client-id': this.clientId,
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        const body = await response.text();
        throw new Error(
          `Expected JSON but got "${contentType}". ` +
            `Status ${response.status}. Body: ${body.substring(0, 300)}`
        );
      }

      const result = (await response.json()) as TokenResponse;

      if (!response.ok) {
        throw new Error(
          (result as unknown as ApiErrorResponse).message ??
            `HTTP ${response.status}: token generation failed`
        );
      }

      if (!result.token) {
        throw new Error('Token response did not contain a token field');
      }

      this.accessToken = result.token.replace(/^Bearer\s+/i, '');
      this.tokenExpiresAt = Date.now() + 3_600_000;

      console.log('✓ Access token obtained (valid ~1 h)');
      return this.accessToken;
    } catch (error) {
      clearTimeout(timer);
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`ClickPesa token generation failed: ${msg}`);
    }
  }

  // ───────────────────────────────────────────
  // Payment Methods (live from API)
  // ───────────────────────────────────────────

  /**
   * Returns available payment channels for the given phone + amount by calling
   * the Preview endpoint and surfacing its activeMethods array.
   * Ref: https://docs.clickpesa.com/api-reference/collection/ussd-push-requests/
   *        preview-ussd-push-request#response-active-methods
   */
  async getPaymentMethods(
    phoneNumber: string,
    amount: number,
    currency = 'TZS',
    orderReference?: string
  ): Promise<PaymentMethod[]> {
    // console.log('\n=== ClickPesa Get Payment Methods ===');
    // console.log('Phone   :', phoneNumber);
    // console.log('Amount  :', amount);

    const preview = await this.previewPayment({
      phoneNumber,
      amount,
      currency,
      orderReference,
    });
    const methods = preview.activeMethods ?? [];
    // console.log(`✓ ${methods.length} payment method(s) returned`);
    return methods;
  }

  // ───────────────────────────────────────────
  // Step 1 — Preview USSD-PUSH request
  // ───────────────────────────────────────────

  /**
   * Validates payment details and returns available payment channels.
   * Endpoint : POST /third-parties/payments/preview-ussd-push-request
   * Ref: https://docs.clickpesa.com/api-reference/collection/ussd-push-requests/preview-ussd-push-request
   */
  async previewPayment(
    request: InitiateCheckoutRequest
  ): Promise<PreviewPaymentResponse> {
    // console.log('\n=== ClickPesa Preview Payment ===');
    // console.log('Amount  :', request.amount);
    // console.log('Phone   :', request.phoneNumber);

    const currency = request.currency ?? 'TZS';
    const orderReference = request.orderReference ?? `ORD${Date.now()}`;

    const payload: Record<string, unknown> = {
      amount: request.amount,
      currency,
      orderReference,
      phoneNumber: request.phoneNumber,
    };

    if (request.fetchSenderDetails !== undefined) {
      payload.fetchSenderDetails = request.fetchSenderDetails;
    }

    const checksum = this.calculateChecksum(payload);
    const body = { ...payload, checksum };

    // console.log('Preview payload:', JSON.stringify(body, null, 2));

    const response = await this.makePostRequest(
      '/third-parties/payments/preview-ussd-push-request',
      body
    );

    // console.log('Preview response:', JSON.stringify(response, null, 2));
    return response as unknown as PreviewPaymentResponse;
  }

  // ───────────────────────────────────────────
  // Step 2 — Initiate USSD-PUSH request
  // ───────────────────────────────────────────

  /**
   * Sends the USSD-PUSH prompt to the customer's handset.
   * Runs previewPayment() first to validate channels are available.
   * Endpoint : POST /third-parties/payments/initiate-ussd-push-request
   * Ref: https://docs.clickpesa.com/api-reference/collection/ussd-push-requests/initiate-ussd-push-request
   */
  async initiateCheckout(
    request: InitiateCheckoutRequest
  ): Promise<CheckoutResponse> {
    // console.log('\n=== ClickPesa Initiate Payment ===');
    // console.log('Amount  :', request.amount);
    // console.log('Phone   :', request.phoneNumber);

    const preview = await this.previewPayment(request);
    const availableChannels = (preview.activeMethods ?? []).filter(
      (m) => m.status === 'AVAILABLE'
    );
    if (!availableChannels.length) {
      throw new Error(
        'No active payment channels available for this phone number / amount combination'
      );
    }

    const currency = request.currency ?? 'TZS';
    const orderReference = request.orderReference ?? `ORD${Date.now()}`;

    const payload: Record<string, unknown> = {
      amount: request.amount,
      currency,
      orderReference,
      phoneNumber: request.phoneNumber,
    };

    const checksum = this.calculateChecksum(payload);
    const body = { ...payload, checksum };

    // console.log('Initiate payload:', JSON.stringify(body, null, 2));

    const response = await this.makePostRequest(
      '/third-parties/payments/initiate-ussd-push-request',
      body
    );

    // console.log('Initiate response:', JSON.stringify(response, null, 2));
    return response as unknown as CheckoutResponse;
  }

  // ───────────────────────────────────────────
  // Step 3 — Query payment status
  // ───────────────────────────────────────────

  /**
   * Returns the latest status of a payment by its orderReference.
   * The API returns an array; this method returns the first (most recent) record.
   * Endpoint : GET /third-parties/payments/{orderReference}
   * Ref: https://docs.clickpesa.com/api-reference/collection/querying-for-payments/querying-for-payments
   */
  async checkPaymentStatus(orderReference: string): Promise<PaymentRecord> {
    // console.log('\n=== ClickPesa Status Check ===');
    // console.log('Order Reference:', orderReference);

    const response = await this.makeGetRequest(
      `/third-parties/payments/${encodeURIComponent(orderReference)}`
    );

    console.log('Status response:', JSON.stringify(response, null, 2));

    const records = Array.isArray(response) ? response : [response];
    if (!records.length) {
      throw new Error(
        `No payment records found for orderReference: ${orderReference}`
      );
    }

    return records[0] as PaymentRecord;
  }

  // ───────────────────────────────────────────
  // Status helper
  // ───────────────────────────────────────────

  getStatusMessage(status: PaymentStatus): string {
    const messages: Record<PaymentStatus, string> = {
      SUCCESS: 'Payment completed successfully',
      SETTLED: 'Payment settled to merchant account',
      PROCESSING: 'Payment is being processed — awaiting customer PIN',
      PENDING: 'Payment is pending',
      FAILED: 'Payment failed',
    };
    return messages[status] ?? 'Unknown payment status';
  }

  // ───────────────────────────────────────────
  // HTTP helpers
  // ───────────────────────────────────────────

  private async makeGetRequest(path: string): Promise<unknown> {
    if (!this.apiKey) throw new Error('CLICKPESA_API_KEY is not configured');
    return this.executeRequest(`${this.apiUrl}${path}`, 'GET', null);
  }

  private async makePostRequest(
    path: string,
    data: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.apiKey) throw new Error('CLICKPESA_API_KEY is not configured');
    if (!this.checksumKey)
      throw new Error('CLICKPESA_CHECKSUM_KEY is not configured');
    return this.executeRequest(`${this.apiUrl}${path}`, 'POST', data);
  }

  /**
   * Executes an HTTP request with Bearer token auth and retry / exponential backoff.
   * On a 401 the cached token is invalidated and a fresh one is fetched before retry.
   */
  private async executeRequest(
    url: string,
    method: 'GET' | 'POST',
    data: Record<string, unknown> | null,
    retries = 2
  ): Promise<unknown> {
    let token = await this.generateAccessToken();

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);

      try {
        const options: RequestInit = {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        };

        if (method === 'POST' && data !== null) {
          options.body = JSON.stringify(data);
        }

        // console.log(
        //   `[${method}] ${url} (attempt ${attempt + 1}/${retries + 1})`
        // );

        const response = await fetch(url, options);
        clearTimeout(timer);

        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(
            `Unexpected content-type "${contentType}". ` +
              `Status ${response.status}. Body: ${text.substring(0, 300)}`
          );
        }

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            (result as ApiErrorResponse).message ??
              `HTTP ${response.status}: ${response.statusText}`
          );
        }

        return result;
      } catch (error) {
        clearTimeout(timer);

        const err = error instanceof Error ? error : new Error(String(error));
        const isLast = attempt === retries;

        if (isLast) {
          if (err.name === 'AbortError') {
            throw new Error(
              `Request timed out after ${this.timeout} ms: ${url}`
            );
          }
          throw new Error(`ClickPesa API error: ${err.message}`);
        }

        if (
          err.message.includes('401') ||
          err.message.toLowerCase().includes('unauthorized')
        ) {
          // console.warn('Access token rejected (401) — refreshing…');
          this.accessToken = null;
          this.tokenExpiresAt = 0;
          token = await this.generateAccessToken();
        }

        const delay = 1_000 * Math.pow(2, attempt);
        // console.log(
        //   `Retrying in ${delay} ms… (attempt ${attempt + 1}/${retries})`
        // );
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    throw new Error('ClickPesa request failed after all retries');
  }
}
