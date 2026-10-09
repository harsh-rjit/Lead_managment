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

/**
 * Get assignable team members in organization (All authenticated roles)
 */
export const getLeadAssignees = async () => {
  const response = await axiosClient.get('/api/v1/leads/assignees');
  return response.data;
};

/**
 * Trigger AI analysis for a lead using Gemini API
 * Strictly calls backend endpoint; API key is never exposed to client
 */
export const analyzeLeadWithAI = async (leadId) => {
  const response = await axiosClient.post(`/api/v1/ai/analyze/${leadId}`);
  return response.data;
};

/**
 * Retrieve latest AI analysis for a lead
 */
export const getLeadAnalysis = async (leadId) => {
  const response = await axiosClient.get(`/api/v1/ai/lead/${leadId}`);
  return response.data;
};

/**
 * Generate AI-powered follow-up message (email or short message)
 * @param {string} leadId - Lead ID
 * @param {Object} options - { type: 'email' | 'short_message', tone: 'professional' | 'friendly' }
 */
export const generateFollowUpMessage = async (leadId, { type = 'email', tone = 'professional' } = {}) => {
  const response = await axiosClient.post(`/api/v1/ai/follow-up/${leadId}`, {
    type,
    tone,
  });
  return response.data;
};

/**
 * Upload and bulk import leads from a CSV file
 * @param {FormData} formData - Multipart form data containing 'file'
 */
export const uploadLeadsCSV = async (formData) => {
  const response = await axiosClient.post('/api/v1/leads/import/csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Retrieve chronological activity audit trail for a specific lead
 * @param {string} leadId - Lead ID
 */
export const getLeadActivities = async (leadId) => {
  const response = await axiosClient.get(`/api/v1/leads/${leadId}/activities`);
  return response.data;
};

