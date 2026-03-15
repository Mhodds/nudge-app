export interface Kick {
  id: string;
  seq: number;
  result: "made" | "miss";
  kickType?: "conversion" | "penalty" | "try" | "drop_goal";
  distance: string;
  angle: string;
  wind?: string;
  technicalMiss?: string;
  feel?: number;
  notes?: string;
}

export interface Session {
  id: string;
  type: "match" | "training";
  timestamp: string;
  teamName?: string;
  kicks: Kick[];
  madeCount: number;
  totalCount: number;
  accuracy: number;
  avgFeel: number;
}
