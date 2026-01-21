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
    return this.makeRequest('/key/activate', request);
  }

  /**
   * Validate an existing license
   */
  async validate(request: ValidationRequest): Promise<KeymintApiResponse> {
    return this.makeRequest('/key/validate', request);
  }

  /**
   * Deactivate a license on this device (optional)
   */
  async deactivate(licenseKey: string, hostId: string): Promise<KeymintApiResponse> {
    return this.makeRequest('/key/deactivate', { licenseKey, hostId });
  }

  /**
   * Make HTTP request to keymint.dev API with retry logic
   */
  private async makeRequest(
    endpoint: string,
    data: unknown,
    retries: number = 2
  ): Promise<KeymintApiResponse> {
    const url = `${this.apiUrl}${endpoint}`;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || `HTTP ${response.status}`);
        }

        return result as KeymintApiResponse;
      } catch (error: unknown) {
        const isLastAttempt = attempt === retries;
        
        if (isLastAttempt) {
          if (error instanceof Error) {
            throw new Error(`API request failed: ${error.message}`);
          }
          throw new Error('API request failed');
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }

    throw new Error('API request failed after retries');
  }
}
