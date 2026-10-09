import axiosClient from './axiosClient';

/**
 * Fetch tenant analytics overview metrics and chart time-series
 */
export const getAnalyticsOverview = async () => {
  const response = await axiosClient.get('/api/v1/analytics/overview');
  return response.data;
};
