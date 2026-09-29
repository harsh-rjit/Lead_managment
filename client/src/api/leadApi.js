import axiosClient from './axiosClient';

/**
 * Get all team leads (Admin and Manager only)
 */
export const getTeamLeads = async () => {
  const response = await axiosClient.get('/api/v1/leads/team');
  return response.data;
};

/**
 * Get leads assigned to the requesting user (Sales, Manager, Admin)
 */
export const getMyLeads = async () => {
  const response = await axiosClient.get('/api/v1/leads/my-leads');
  return response.data;
};
