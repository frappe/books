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
    
    // Check for missing credentials
    if (!this.accessToken) {
      throw new Error('Keymint access token is not configured. Set KEYMINT_ACCESS_TOKEN environment variable.');
    }
    
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

        // Check if response has content
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Unexpected content type: ${contentType}. Status: ${response.status}`);
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
