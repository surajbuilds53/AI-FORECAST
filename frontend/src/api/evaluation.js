import apiClient from './client';

/**
 * Fetches real validation evaluation metrics and actual vs predicted points for a model.
 * @param {string} modelId 
 * @returns {Promise<Object>} ModelEvaluationResponse
 */
export const getModelEvaluation = async (modelId) => {
  const response = await apiClient.get(`/api/evaluation/model/${modelId}`);
  return response.data;
};

/**
 * Compares all trained models across MAE, RMSE, and R² scores.
 * @returns {Promise<Object>} ModelComparisonResponse
 */
export const getModelsComparison = async () => {
  const response = await apiClient.get('/api/evaluation/compare');
  return response.data;
};
