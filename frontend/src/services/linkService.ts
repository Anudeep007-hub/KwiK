import { apiConfig } from "./apiConfig";
import type { ClickEvent, Link, LinkStatus } from "../types/api";

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Authentication endpoints
export async function getGitHubLoginUrl() {
  const response = await fetch(`${apiConfig.baseUrl}/v1/auth/login/github`);
  if (!response.ok) {
    throw new Error('Unable to get GitHub login URL');
  }
  return response.json() as Promise<{ url: string; state: string }>;
}

export async function getGoogleLoginUrl() {
  const response = await fetch(`${apiConfig.baseUrl}/v1/auth/login/google`);
  if (!response.ok) {
    throw new Error('Unable to get Google login URL');
  }
  return response.json() as Promise<{ url: string; state: string }>;
}

export async function handleGitHubCallback(code: string, state: string) {
  const params = new URLSearchParams({ code, state });
  const response = await fetch(`${apiConfig.baseUrl}/v1/auth/callback/github?${params}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('GitHub authentication failed');
  }

  return response.json() as Promise<{ token: string; user: any }>;
}

export async function handleGoogleCallback(code: string, state: string) {
  const params = new URLSearchParams({ code, state });
  const response = await fetch(`${apiConfig.baseUrl}/v1/auth/callback/google?${params}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Google authentication failed');
  }

  return response.json() as Promise<{ token: string; user: any }>;
}

export async function getCurrentUser() {
  const response = await fetch(`${apiConfig.baseUrl}/v1/auth/me`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Unable to fetch current user');
  }

  return response.json() as Promise<any>;
}

export async function updateUserProfile(name: string) {
  const response = await fetch(`${apiConfig.baseUrl}/v1/auth/me`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error('Unable to update user profile');
  }

  return response.json() as Promise<any>;
}

export async function logout() {
  const response = await fetch(`${apiConfig.baseUrl}/v1/auth/logout`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Unable to logout');
  }

  return response.json();
}

// Link endpoints
export async function createShortLink(longUrl: string) {
  const response = await fetch(`${apiConfig.baseUrl}/v1/links`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ longUrl }),
  });

  if (!response.ok) {
    throw new Error("Unable to create short link");
  }

  return response.json() as Promise<{ shortCode: string }>;
}

export async function getLinks() {
  const response = await fetch(`${apiConfig.baseUrl}/v1/links`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Unable to load links");
  }

  return response.json() as Promise<Link[]>;
}

export async function getLink(shortCode: string) {
  const response = await fetch(`${apiConfig.baseUrl}/v1/links/${shortCode}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Unable to load link");
  }

  return response.json() as Promise<Link>;
}

export async function updateLinkStatus(shortCode: string, status: LinkStatus) {
  const response = await fetch(`${apiConfig.baseUrl}/v1/links/${shortCode}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Unable to update link status");
  }

  return response.json() as Promise<Link>;
}

// Click events endpoints
export async function getClickEvents(shortCode?: string) {
  const path = shortCode
    ? `/v1/links/${shortCode}/events`
    : "/v1/click-events";
  const response = await fetch(`${apiConfig.baseUrl}${path}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Unable to load click events");
  }

  return response.json() as Promise<ClickEvent[]>;
}

