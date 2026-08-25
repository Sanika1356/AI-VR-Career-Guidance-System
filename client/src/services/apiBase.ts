const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL =
  configuredApiBaseUrl || (import.meta.env.DEV ? '/api' : 'http://localhost:4000/api');
