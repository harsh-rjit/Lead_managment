import axiosClient from './axiosClient';

/**
 * Register a new user and organization
 */
export const registerUser = async (data) => {
  const response = await axiosClient.post('/api/v1/auth/register', data);
  return response.data;
};

/**
 * Authenticate user credentials and retrieve JWT
 */
export const loginUser = async (credentials) => {
  const response = await axiosClient.post('/api/v1/auth/login', credentials);
  return response.data;
};

/**
 * Fetch current user profile using JWT token
 */
export const getMe = async () => {
  const response = await axiosClient.get('/api/v1/auth/me');
  return response.data;
};

/**
 * Test a protected endpoint verifying JWT transmission
 */
export const testProtectedEndpoint = async () => {
  const response = await axiosClient.get('/api/v1/auth/protected-test');
  return response.data;
};
