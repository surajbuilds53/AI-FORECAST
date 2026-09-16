import apiClient from './client';

/**
 * Fetches time-series data points, moving average, trendline, and distribution statistics.
 * @param {Object} payload 
 * @returns {Promise<Object>} AnalyticsResponse
 */
export const fetchAnalyticsData = async (payload) => {
  const response = await apiClient.post('/api/analytics/timeseries', payload);
  return response.data;
};
