const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const useRemoteApi = import.meta.env.VITE_USE_REMOTE_API === 'true';

export const API_BASE_URL =
  import.meta.env.DEV && !useRemoteApi
    ? '/api'
    : configuredApiBaseUrl || 'http://localhost:4000/api';
