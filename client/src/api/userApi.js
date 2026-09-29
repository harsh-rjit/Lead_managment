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
