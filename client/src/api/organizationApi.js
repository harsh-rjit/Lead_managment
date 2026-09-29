import axiosClient from './axiosClient';

/**
 * Get organization settings (Admin only)
 */
export const getOrgSettings = async () => {
  const response = await axiosClient.get('/api/v1/organization/settings');
  return response.data;
};

/**
 * Update organization settings (Admin only)
 */
export const updateOrgSettings = async (updateData) => {
  const response = await axiosClient.patch('/api/v1/organization/settings', updateData);
  return response.data;
};
