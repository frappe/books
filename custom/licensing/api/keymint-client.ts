/**
 * Keymint.dev API Client
 * Handles communication with keymint.dev REST API
 */

import { ActivationRequest, ValidationRequest, KeymintApiResponse } from '../types';

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
          throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return result as KeymintApiResponse;
      } catch (error: unknown) {
        const isLastAttempt = attempt === retries;
        
        if (isLastAttempt) {
          if (error instanceof Error) {
            // Add more context to the error
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

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }

    throw new Error('API request failed after retries');
  }
}
