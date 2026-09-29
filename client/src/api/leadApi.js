import axiosClient from './axiosClient';

/**
 * Create a new lead (organizationId injected automatically by backend from JWT)
 */
export const createLead = async (leadData) => {
  const response = await axiosClient.post('/api/v1/leads', leadData);
  return response.data;
};

/**
 * Get leads with pagination, search, and status filters
 */
export const getLeads = async (params = {}) => {
  const response = await axiosClient.get('/api/v1/leads', { params });
  return response.data;
};

/**
 * Get lead details by ID (Tenant-scoped)
 */
export const getLeadById = async (id) => {
  const response = await axiosClient.get(`/api/v1/leads/${id}`);
  return response.data;
};

/**
 * Update lead
 */
export const updateLead = async (id, updateData) => {
  const response = await axiosClient.patch(`/api/v1/leads/${id}`, updateData);
  return response.data;
};

/**
 * Delete lead
 */
export const deleteLead = async (id) => {
  const response = await axiosClient.delete(`/api/v1/leads/${id}`);
  return response.data;
};

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
