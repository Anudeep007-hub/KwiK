export type LinkStatus = "ACTIVE" | "DISABLED";
export type IssueStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IssueType = "BUG" | "FEATURE";

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

export interface Issue {
  id: string;
  number: number;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  createdAt: string;
  author: string;
  repository: string;
  url: string;
  linkedPR?: {
    number: number;
    title: string;
    merged: boolean;
    repo: string;
  } | null;
}
