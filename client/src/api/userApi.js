import axiosClient from './axiosClient';

/**
 * Get organization team members (Admin only)
 */
export const getUsers = async () => {
  const response = await axiosClient.get('/api/v1/users');
  return response.data;
};

/**
 * Invite a new member with specified role (Admin only)
 */
export const inviteUser = async (userData) => {
  const response = await axiosClient.post('/api/v1/users/invite', userData);
  return response.data;
};

/**
 * Create a new user (Admin only)
 */
export const createUser = async (userData) => {
  const response = await axiosClient.post('/api/v1/users', userData);
  return response.data;
};

/**
 * Change a user's role (Admin only)
 * @param {string} userId
 * @param {'admin'|'manager'|'sales'} role
 */
export const updateUserRole = async (userId, role) => {
  const response = await axiosClient.patch(`/api/v1/users/${userId}/role`, { role });
  return response.data;
};

/**
 * Change a user's status (Admin only)
 * @param {string} userId
 * @param {'active'|'inactive'} status
 */
export const updateUserStatus = async (userId, status) => {
  const response = await axiosClient.patch(`/api/v1/users/${userId}/status`, { status });
  return response.data;
};
