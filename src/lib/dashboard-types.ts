// src/lib/dashboard-types.ts
export type ServiceStatus = "locked" | "available" | "in_progress" | "done" | "alert";

export type ServiceKey = "audit" | "plagiat" | "quiz" | "jury";

export interface ServiceState {
  key: ServiceKey;
  status: ServiceStatus;
  summary?: string; // ex: "16/20", "3% similarité", "8 questions générées"
}