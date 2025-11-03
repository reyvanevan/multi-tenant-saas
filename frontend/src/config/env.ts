/**
 * Environment Configuration
 * Manages all environment variables for the application
 */

interface EnvironmentConfig {
  // API Configuration
  apiUrl: string;
  apiPrefix: string;
  apiTimeout: number;

  // App Configuration
  appName: string;
  appVersion: string;
  environment: 'development' | 'staging' | 'production';

  // Feature Flags
  enableDevTools: boolean;
  enableMockData: boolean;
}

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: string, defaultValue: string = ''): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  return defaultValue;
}

/**
 * Application environment configuration
 */
export const env: EnvironmentConfig = {
  // API Configuration
  apiUrl:
    getEnvVar('VITE_API_URL') ||
    'https://multi-tenant-saas-production-175e.up.railway.app',
  apiPrefix: getEnvVar('VITE_API_PREFIX') || '/api/v1',
  apiTimeout: parseInt(getEnvVar('VITE_API_TIMEOUT', '30000')),

  // App Configuration
  appName: getEnvVar('VITE_APP_NAME') || 'Multi-Tenant SaaS',
  appVersion: getEnvVar('VITE_APP_VERSION') || '1.0.0',
  environment: (getEnvVar('VITE_ENVIRONMENT') ||
    'development') as EnvironmentConfig['environment'],

  // Feature Flags
  enableDevTools: getEnvVar('VITE_ENABLE_DEV_TOOLS') !== 'false',
  enableMockData: getEnvVar('VITE_ENABLE_MOCK_DATA') === 'true',
};

/**
 * Get full API URL
 */
export function getApiUrl(endpoint: string = ''): string {
  const baseUrl = `${env.apiUrl}${env.apiPrefix}`;
  return endpoint ? `${baseUrl}${endpoint}` : baseUrl;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return env.environment === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return env.environment === 'production';
}

/**
 * Log environment configuration (development only)
 */
if (isDevelopment()) {
  console.log('🔧 Environment Configuration:', {
    apiUrl: env.apiUrl,
    apiPrefix: env.apiPrefix,
    environment: env.environment,
    fullApiUrl: getApiUrl(),
  });
}

export default env;
