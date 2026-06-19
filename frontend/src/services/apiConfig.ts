export const apiConfig = {
  baseUrl: (process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000").replace(/\/+$/, ""),
};

export const getShortUrl = (shortCode: string) => `${apiConfig.baseUrl}/${shortCode}`;
