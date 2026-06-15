import axios from 'axios';
import { apiConfig } from '../lib/apiConfig';

const apiClient = axios.create({
  baseURL: apiConfig.baseUrl,
});

export const createShortLink = async (longUrl: string) => {
  const { data } = await apiClient.post('/v1/links', { longUrl });
  return data;
};