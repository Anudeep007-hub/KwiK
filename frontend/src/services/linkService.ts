import { apiConfig } from "./apiConfig";
import type { ClickEvent, Issue, Link } from "../types/api";

export async function createShortLink(longUrl: string) {
  const response = await fetch(`${apiConfig.baseUrl}/v1/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ longUrl }),
  });

  if (!response.ok) {
    throw new Error("Unable to create short link");
  }

  return response.json() as Promise<{ shortCode: string }>;
}

export async function getLinks() {
  const response = await fetch(`${apiConfig.baseUrl}/v1/links`);

  if (!response.ok) {
    throw new Error("Unable to load links");
  }

  return response.json() as Promise<Link[]>;
}

export async function getLink(shortCode: string) {
  const response = await fetch(`${apiConfig.baseUrl}/v1/links/${shortCode}`);

  if (!response.ok) {
    throw new Error("Unable to load link");
  }

  return response.json() as Promise<Link>;
}

export async function getClickEvents(shortCode?: string) {
  const path = shortCode
    ? `/v1/links/${shortCode}/events`
    : "/v1/click-events";
  const response = await fetch(`${apiConfig.baseUrl}${path}`);

  if (!response.ok) {
    throw new Error("Unable to load click events");
  }

  return response.json() as Promise<ClickEvent[]>;
}

export async function getGitHubIssues() {
  const response = await fetch(`${apiConfig.baseUrl}/v1/github/issues`);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? "Unable to load GitHub issues");
  }

  return response.json() as Promise<Issue[]>;
}
