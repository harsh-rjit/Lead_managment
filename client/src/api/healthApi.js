import axiosClient from './axiosClient';

/**
 * Calls backend health check endpoint
 * @returns {Promise<{ status: string, message: string, timestamp: string, uptime: string, environment: string }>}
 */
export const checkHealth = async () => {
  const response = await axiosClient.get('/api/health');
  return response.data;
};
