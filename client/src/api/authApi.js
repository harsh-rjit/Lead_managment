import axiosClient from './axiosClient';

/**
 * Register a new user and organization
 *
 * @param {Object} data
 * @param {string} data.name
 * @param {string} data.email
 * @param {string} data.password
 * @param {string} data.organizationName
 * @returns {Promise<Object>} API response data
 */
export const registerUser = async (data) => {
  const response = await axiosClient.post('/api/v1/auth/register', data);
  return response.data;
};
