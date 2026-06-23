export type LinkStatus = "ACTIVE" | "DISABLED";

export interface Link {
  shortCode: string;
  longUrl: string;
  createdAt: string;
  expiresAt: string | null;
  status: LinkStatus;
  ownerId: string | null;
  clickCount: number;
}

export interface ClickEvent {
  eventId: string;
  shortCode: string;
  timestamp: string;
  ipHash: string;
  userAgent: string;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  isp: string | null;
}

