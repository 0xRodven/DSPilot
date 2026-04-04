// Core types for DSPilot

import type { CoachingActionType, CoachingStatus, ImportStatus } from "./utils/status";
import type { Tier } from "./utils/tier";

// Driver types
export interface Driver {
  id: string;
  name: string;
  amazonId: string;
  dwcPercent: number;
  iadcPercent: number;
  daysActive: number;
  tier: Tier;
  trend: number;
}

export interface DriverDetail extends Driver {
  deliveries: number;
  errors: number;
  activeSince: string;
  streak: number;
  rank: number | null; // null when driver not found in ranking
  totalDrivers: number;
  dailyPerformance: DailyPerformance[];
  errorBreakdown: ErrorBreakdown;
  coachingHistory: CoachingAction[];
  weeklyHistory: WeeklyData[];
  hasDataForSelectedWeek?: boolean; // false when selected week has no data
  // Trends vs previous week
  iadcTrend?: number; // IADC% difference vs previous week
  deliveriesTrend?: number; // Deliveries count difference vs previous week
  errorsTrend?: number; // Errors count difference vs previous week
  // WhatsApp
  phoneNumber?: string | null;
  whatsappOptIn?: boolean;
}

export interface DailyPerformance {
  day: string;
  date: string;
  dwcPercent: number | null;
  iadcPercent: number | null;
  deliveries: number | null;
  errors: number | null;
  dnrCount?: number;
  status: "excellent" | "tres-bon" | "bon" | "moyen" | "non-travaille";
}

// Error types
export interface ErrorType {
  id: string;
  name: string;
  category: "dwc" | "iadc";
  count: number;
  percentage: number;
}

export interface ErrorBreakdown {
  dwcMisses: {
    total: number;
    categories: { name: string; count: number; subcategories: { name: string; count: number }[] }[];
  };
  iadcNonCompliant: {
    total: number;
    categories: { name: string; count: number }[];
  };
}

export type ErrorCategory = "dwc" | "iadc" | "false-scans";

export interface ErrorSubcategory {
  name: string;
  count: number;
  percentage: number;
  trend: number;
  locations?: ErrorLocation[];
}

export interface ErrorLocation {
  name: string;
  count: number;
  percentage: number;
  trend: number;
}

export interface ErrorCategoryData {
  id: ErrorCategory;
  name: string;
  total: number;
  trend: number;
  trendPercent: number;
  subcategories: ErrorSubcategory[];
}

export interface DriverWithErrors {
  id: string;
  name: string;
  totalErrors: number;
  percentage: number;
  tier: Tier;
  dwcPercent: number;
  mainError: string;
  mainErrorCount: number;
}

export interface ErrorTrendData {
  week: string;
  weekNumber: number;
  total: number;
  contactMiss: number;
  photoDefect: number;
  noPhoto: number;
  otpMiss: number;
  failedAttempts: number;
}

// Weekly data
export interface WeeklyData {
  week: string;
  weekNumber: number;
  dwc: number;
  iadc: number;
}

// Coaching types
export interface CoachingAction {
  id: string;
  week: string;
  date: string;
  type: "discussion" | "formation" | "suivi";
  subject: string;
  result: "ameliore" | "complete" | "en-cours";
  impactPercent?: number;
}

export interface CoachingActionFull {
  id: string;
  stationId: string;
  driverId: string;
  driverName: string;
  driverAmazonId: string;
  driverTier: Tier;
  driverDwc: number;
  actionType: CoachingActionType;
  status: CoachingStatus;
  reason: string;
  targetCategory?: string;
  targetSubcategory?: string;
  dwcAtAction: number;
  dwcAfterAction?: number;
  notes?: string;
  evaluationNotes?: string;
  createdAt: string;
  evaluatedAt?: string;
  followUpDate: string;
  escalationDate?: string;
  escalationNote?: string;
  waitingDays: number;
}

export interface CoachingSuggestion {
  id: string;
  driverId: string;
  driverName: string;
  driverTier: Tier;
  driverDwc: number;
  priority: "high" | "negative_trend" | "relapse" | "new_poor";
  reason: string;
  mainError: string;
  mainErrorCount: number;
  weeksUnderThreshold?: number;
  trendPercent?: number;
  lastCoachingWeek?: string;
  hasActiveAction: boolean;
}

export interface CoachingEffectiveness {
  period: "3M" | "6M" | "1Y";
  successRate: number;
  successCount: number;
  totalEvaluated: number;
  avgImprovement: number;
  avgDaysToEffect: number;
  byType: {
    type: CoachingActionType;
    successRate: number;
    successCount: number;
    total: number;
    avgImprovement: number;
  }[];
}

// Import types
export interface ImportRecord {
  id: string;
  filename: string;
  stationId: string;
  stationCode: string;
  year: number;
  week: number;
  weekDates: string;
  status: ImportStatus;
  driversImported: number;
  dailyRecordsCount: number | null;
  weeklyRecordsCount: number;
  dwcScore: number;
  iadcScore: number;
  tierDistribution: {
    fantastic: number;
    great: number;
    fair: number;
    poor: number;
  };
  importedAt: string;
  importedBy: string;
  errorMessage?: string;
  warnings?: string[];
  newDriversCount?: number;
}

export interface ParsedImportData {
  filename: string;
  stationCode: string;
  stationName: string;
  year: number;
  week: number;
  weekDates: string;
  driversCount: number;
  dailyRecordsCount: number;
  weeklyRecordsCount: number;
  trendsData: number;
  dwcScore: number;
  iadcScore: number;
  tierDistribution: {
    fantastic: number;
    great: number;
    fair: number;
    poor: number;
  };
  newDrivers: number;
  existingWeek: boolean;
  drivers: {
    id: string;
    name: string;
    amazonId: string;
    dwcPercent: number;
    iadcPercent: number;
    tier: Tier;
    isNew: boolean;
  }[];
}

export interface WeekCoverage {
  week: number;
  year: number;
  status: "complete" | "partial" | "failed" | "missing";
}

// Daily performance with coaching marker (for chart)
export interface DailyPerformanceWithCoaching {
  date: string;
  dwcPercent: number | null;
  iadcPercent: number | null;
  deliveries: number;
  errors: number;
  coachingAction: CoachingMarkerData | null;
}

export interface CoachingMarkerData {
  id: string;
  actionType: CoachingActionType;
  status: CoachingStatus;
  reason: string;
  dwcAtAction: number;
  dwcAfterAction?: number;
  followUpDate?: string;
  notes?: string;
  createdAt: number;
}

// Coaching pipeline suggestion
export interface CoachingPipelineSuggestion {
  suggestedAction: CoachingActionType;
  reason: string;
  pipelineStage: 1 | 2 | 3 | 4 | 5;
  history: {
    discussionCount: number;
    warningCount: number;
    trainingCount: number;
    suspensionCount: number;
    pendingActions: number;
    lastAction?: {
      type: CoachingActionType;
      date: string;
      status: CoachingStatus;
    };
  };
  canEscalate: boolean;
}

// ============================================
// CHAT TYPES
// ============================================

export interface ChatMessage {
  key: string;
  role: "user" | "assistant" | "system";
  text: string;
  status?: "pending" | "streaming" | "complete" | "failed";
  toolCalls?: ChatToolCall[];
  createdAt: number;
}

export interface ChatToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "running" | "complete" | "error";
}

export interface ChatThread {
  threadId: string;
  stationId: string;
  userId: string;
  createdAt: number;
  lastMessageAt?: number;
  metadata?: {
    stationCode?: string;
    stationName?: string;
  };
}
