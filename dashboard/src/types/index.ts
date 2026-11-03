export type SystemStatus = 'healthy' | 'warning' | 'critical' | 'offline';

export interface DeviceInfo {
  id: string;
  type: 'ai' | 'backend' | 'camera';
  name: string;
  status: SystemStatus;
  connectionStatus: 'connected' | 'disconnected' | 'degraded';
  host: string;
  lastHeartbeat?: string;
  lastEvent?: string;
  health?: string;
}

export interface ExperimentStep {
  id: string;
  sequence: number;
  name: string;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'out_of_order' | 'failed';
  confidence?: number;
  skipped?: boolean;
  deviation?: boolean;
}

export interface LogEvent {
  eventId: string;
  type: string;
  experimentId: string;
  stepId?: string;
  timestamp: string;
  confidence?: number;
  source: string;
  status: 'detected' | 'inferred' | 'verified' | 'unknown' | 'needs_review';
  payload?: Record<string, unknown>;
}

export interface ExperimentSummary {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  currentStep?: string;
  progress: number;
  completedSteps: number;
  pendingSteps: number;
  deviationCount: number;
  startedAt?: string;
  updatedAt?: string;
  aiStatus: SystemStatus;
  backendStatus: SystemStatus;
  cameraStatus: SystemStatus;
}

export interface PerformanceMetrics {
  fps?: number;
  inferenceLatencyMs?: number;
  eventDeliveryDelayMs?: number;
  memoryUsagePct?: number;
  cpuUsagePct?: number;
  droppedFrames?: number;
  eventThroughput?: number;
  backendHealth?: string;
}

export interface AlertItem {
  id: string;
  level: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  acknowledged?: boolean;
  experimentId?: string;
  stepId?: string;
}
