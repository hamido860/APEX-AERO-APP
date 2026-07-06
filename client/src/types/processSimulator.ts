export type ZoneStatus = "completed" | "in_progress" | "on_hold" | "blocked" | "not_started";

export interface ProcessZone {
  id: string;
  name: string;
  zone_name: string;
  zone_key: string;
  product_code: string;
  status: ZoneStatus;
  progress: number;
  description?: string;
  blocked_reason?: string;
  assigned_team?: string;
  last_updated_at: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tasks?: string[];
}
