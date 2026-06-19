export const apiConfig = {
  baseUrl: (__BACKEND_API_URL__ || "http://localhost:8000").replace(/\/+$/, ""),
};

export const getShortUrl = (shortCode: string) => `${apiConfig.baseUrl}/${shortCode}`;
