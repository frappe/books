/**
 * Keymint.dev API Client
 * Handles communication with keymint.dev REST API
 */

import { ActivationRequest, ValidationRequest, KeymintApiResponse } from '../types';

export class KeymintApiError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'KeymintApiError';
  }
}

// Note: Using node-fetch v2 which is already a dependency
const fetch = require('node-fetch');

export class KeymintClient {
  private apiUrl: string;
  private accessToken: string;
  private timeout: number;

  constructor(apiUrl: string, accessToken: string, timeout: number = 10000) {
    this.apiUrl = apiUrl;
    this.accessToken = accessToken;
    this.timeout = timeout;
  }

  /**
   * Activate a license key with device binding
   */
  async activate(request: ActivationRequest): Promise<KeymintApiResponse> {
    return this.makePostRequest('/key/activate', request);
  }

  /**
   * Validate an existing license - uses GET /key endpoint
   */
  async validate(request: ValidationRequest): Promise<KeymintApiResponse> {
    return this.makeGetRequest('/key', {
      productId: request.productId,
      licenseKey: request.licenseKey,
    });
  }

  /**
   * Deactivate a license on this device (optional)
   */
  async deactivate(licenseKey: string, hostId: string): Promise<KeymintApiResponse> {
    return this.makePostRequest('/key/deactivate', { licenseKey, hostId });
  }

  /**
   * Create a new license key
   * Ref: https://docs.keymint.dev/api-reference/license-keys/create
   */
  async createLicense(
    productId: string,
    customerId?: string,
    maxActivations: string = '3',
    expiresAt?: string
  ): Promise<KeymintApiResponse> {
    const payload: any = {
      productId,
      maxActivations,
    };

    if (customerId) {
      payload.customerId = customerId;
    }

    if (expiresAt) {
      payload.expiresAt = expiresAt;
    }

    return this.makePostRequest('/key', payload);
  }

  /**
   * Delete/revoke a license key
   * Note: This endpoint may vary based on Keymint's actual API
   */
  async deleteLicense(licenseKey: string): Promise<KeymintApiResponse> {
    return this.makePostRequest('/key/delete', { licenseKey });
  }

  /**
   * Make HTTP GET request with query parameters (for validation)
   */
  private async makeGetRequest(
    endpoint: string,
    params: Record<string, string>,
    retries: number = 2
  ): Promise<KeymintApiResponse> {
    // Build query string
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    const url = `${this.apiUrl}${endpoint}?${queryString}`;
    
    console.log(`\n=== Keymint API GET Request ===`);
    console.log(`URL: ${url}`);
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Params:`, JSON.stringify(params, null, 2));
    
    // Check for missing credentials
    if (!this.accessToken) {
      throw new Error('Keymint access token is not configured. Set KEYMINT_ACCESS_TOKEN environment variable.');
    }
    
    return this.executeRequest(url, 'GET', null, retries);
  }

  /**
   * Make HTTP POST request with JSON body (for activation)
   */
  private async makePostRequest(
    endpoint: string,
    data: unknown,
    retries: number = 2
  ): Promise<KeymintApiResponse> {
    const url = `${this.apiUrl}${endpoint}`;
    
    console.log(`\n=== Keymint API POST Request ===`);
    console.log(`URL: ${url}`);
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Data:`, JSON.stringify(data, null, 2));
    
    // Check for missing credentials
    if (!this.accessToken) {
      throw new Error('Keymint access token is not configured. Set KEYMINT_ACCESS_TOKEN environment variable.');
    }
    
    return this.executeRequest(url, 'POST', data, retries);
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async executeRequest(
    url: string,
    method: 'GET' | 'POST',
    data: unknown | null,
    retries: number
  ): Promise<KeymintApiResponse> {
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const fetchOptions: any = {
          method,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
          signal: controller.signal,
        };

        // Add body and content-type for POST requests
        if (method === 'POST' && data) {
          fetchOptions.headers['Content-Type'] = 'application/json';
          fetchOptions.body = JSON.stringify(data);
        }

        const response = await fetch(url, fetchOptions);

        clearTimeout(timeoutId);

        // Check if response has content
        const contentType = response.headers.get('content-type');
        console.log(`Response Status: ${response.status}`);
        console.log(`Response Content-Type: ${contentType}`);
        
        if (!contentType || !contentType.includes('application/json')) {
          // Log the HTML response for debugging
          const htmlText = await response.text();
          console.log(`HTML Response (first 500 chars):`, htmlText.substring(0, 500));
          throw new Error(`Unexpected content type: ${contentType}. Status: ${response.status}. This might indicate the endpoint doesn't exist or requires different authentication.`);
        }

        const text = await response.text();
        if (!text || text.trim().length === 0) {
          throw new Error(`Empty response from server. Status: ${response.status}`);
        }

        let result;
        try {
          result = JSON.parse(text);
        } catch (e) {
          throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
        }

        if (!response.ok) {
          // Preserve the numeric `code` (2 = expired/blocked/limit reached,
          // 3 = hostId not in allowedHosts) so callers can branch on it
          // instead of just getting a generic Error string.
          throw new KeymintApiError(
            typeof result?.code === 'number' ? result.code : -1,
            result?.message || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        return result as KeymintApiResponse;
      } catch (error: unknown) {
      const isLastAttempt = attempt === retries;

      if (isLastAttempt) {
        if (error instanceof KeymintApiError) {
          throw error; // preserve code — do not retry auth/host errors, but do not mask them either
        }
        if (error instanceof Error) {
          const errorMessage = error.message;
          if (error.name === 'AbortError') {
            throw new Error(`Request timeout after ${this.timeout}ms`);
          }
          if (errorMessage.includes('fetch')) {
            throw new Error(`Network error: Unable to reach ${url}. Check internet connection.`);
          }
          throw new Error(`API request failed: ${errorMessage}`);
        }
        throw new Error('API request failed: Unknown error');
      }

      // Don't burn retries on a definitive 403 (host unauthorized / expired) —
      // retrying won't change the server's answer.
      if (error instanceof KeymintApiError && (error.code === 2 || error.code === 3)) {
        throw error;
      }

      // Exponential backoff for transient/network errors only
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
    }

    throw new Error('API request failed after retries');
  }
}
