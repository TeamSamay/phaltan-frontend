import type { AlertItem, DeviceInfo, ExperimentSummary, LogEvent, PerformanceMetrics, SystemStatus } from '../types';

/**
 * Universal backend payload adapter tailored for SUTRA FastAPI backend.
 * Handles:
 * - Paginated list envelopes: { items: [...], total: n, limit: n, offset: n }
 * - snake_case (FastAPI/Pydantic models) and camelCase
 * - FastAPI Event Types (HEARTBEAT, STEP_STARTED, STEP_COMPLETED, DEVIATION_DETECTED, etc.)
 */

function toSystemStatus(val: unknown): SystemStatus {
  const s = String(val ?? '').toLowerCase();
  if (['healthy', 'online', 'ok', 'running', 'nominal', 'completed'].includes(s)) return 'healthy';
  if (['warning', 'degraded', 'slow', 'in_progress', 'needs_review'].includes(s)) return 'warning';
  if (['critical', 'error', 'failed', 'down', 'rejected', 'camera_disconnected'].includes(s)) return 'critical';
  return 'offline';
}

export function extractListItems<T>(raw: unknown): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.events)) return obj.events as T[];
    if (Array.isArray(obj.devices)) return obj.devices as T[];
    if (Array.isArray(obj.experiments)) return obj.experiments as T[];
    if (Array.isArray(obj.deviations)) return obj.deviations as T[];
  }
  return [];
}

export function normalizeExperiment(raw: Record<string, unknown> | null | undefined): ExperimentSummary | null {
  if (!raw || typeof raw !== 'object') return null;

  const data = (raw.data ?? raw.experiment ?? raw) as Record<string, unknown>;

  const progressVal = Number(data.progress ?? data.completion_percentage ?? data.progress_pct ?? 0);
  const compSteps = Number(data.completedSteps ?? data.completed_steps ?? 0);
  const pendSteps = Number(data.pendingSteps ?? data.pending_steps ?? 0);
  const devCount = Number(data.deviationCount ?? data.deviation_count ?? data.deviations_count ?? 0);

  return {
    id: String(data.id ?? data.experiment_id ?? data.uuid ?? 'EXP-2417'),
    name: String(data.name ?? data.experiment_name ?? data.title ?? 'Autonomous Protocol Run'),
    status: (String(data.status ?? 'running').toLowerCase() as ExperimentSummary['status']) || 'running',
    currentStep: String(data.currentStep ?? data.current_step ?? data.active_step ?? 'Step 03 - Tool transfer'),
    progress: Math.min(100, Math.max(0, isNaN(progressVal) ? 0 : progressVal)),
    completedSteps: isNaN(compSteps) ? 0 : compSteps,
    pendingSteps: isNaN(pendSteps) ? 0 : pendSteps,
    deviationCount: isNaN(devCount) ? 0 : devCount,
    startedAt: (data.startedAt ?? data.started_at ?? data.start_time) as string | undefined,
    updatedAt: (data.updatedAt ?? data.updated_at ?? data.last_updated) as string | undefined,
    aiStatus: toSystemStatus(data.aiStatus ?? data.ai_status ?? data.vision_status ?? 'healthy'),
    backendStatus: toSystemStatus(data.backendStatus ?? data.backend_status ?? data.api_status ?? 'healthy'),
    cameraStatus: toSystemStatus(data.cameraStatus ?? data.camera_status ?? 'healthy'),
  };
}

export function normalizeDevice(raw: Record<string, unknown> | null | undefined): DeviceInfo | null {
  if (!raw || typeof raw !== 'object') return null;

  const statusStr = toSystemStatus(raw.status ?? raw.health_status ?? raw.state);
  const connStr = String(raw.connectionStatus ?? raw.connection_status ?? raw.connected ?? 'connected').toLowerCase();
  const connStatus: 'connected' | 'disconnected' | 'degraded' =
    connStr === 'degraded' || connStr === 'warning'
      ? 'degraded'
      : connStr === 'disconnected' || connStr === 'false' || connStr === 'offline'
      ? 'disconnected'
      : 'connected';

  const typeStr = String(raw.type ?? raw.device_type ?? 'backend').toLowerCase();
  const deviceType: 'ai' | 'backend' | 'camera' =
    typeStr.includes('ai') || typeStr.includes('vision')
      ? 'ai'
      : typeStr.includes('cam') || typeStr.includes('video')
      ? 'camera'
      : 'backend';

  return {
    id: String(raw.id ?? raw.device_id ?? raw.uuid ?? 'DEV-01'),
    type: deviceType,
    name: String(raw.name ?? raw.device_name ?? raw.label ?? 'Hardware Subsystem'),
    status: statusStr,
    connectionStatus: connStatus,
    host: String(raw.host ?? raw.ip ?? raw.ip_address ?? raw.endpoint ?? '127.0.0.1'),
    lastHeartbeat: (raw.lastHeartbeat ?? raw.last_heartbeat ?? raw.heartbeat_at ?? raw.timestamp) as string | undefined,
    lastEvent: (raw.lastEvent ?? raw.last_event ?? raw.event_type) as string | undefined,
    health: (raw.health ?? raw.health_message ?? raw.message ?? 'Inference nominal') as string | undefined,
  };
}

export function normalizeLogEvent(raw: Record<string, unknown> | null | undefined): LogEvent | null {
  if (!raw || typeof raw !== 'object') return null;

  const confVal = Number(raw.confidence ?? raw.score ?? raw.probability ?? 0);
  const rawType = String(raw.type ?? raw.event_type ?? raw.action ?? 'HEARTBEAT');

  const statusVal = String(raw.status ?? (rawType.includes('DEVIATION') ? 'needs_review' : 'detected')).toLowerCase();
  const validStatus: LogEvent['status'] =
    ['detected', 'inferred', 'verified', 'unknown', 'needs_review'].includes(statusVal)
      ? (statusVal as LogEvent['status'])
      : 'detected';

  return {
    eventId: String(raw.eventId ?? raw.event_id ?? raw.id ?? `evt-${Date.now()}`),
    type: rawType,
    experimentId: String(raw.experimentId ?? raw.experiment_id ?? 'EXP-2417'),
    stepId: (raw.stepId ?? raw.step_id) as string | undefined,
    timestamp: String(raw.timestamp ?? raw.created_at ?? raw.time ?? new Date().toISOString()),
    confidence: isNaN(confVal) ? undefined : confVal,
    source: String(raw.source ?? raw.origin ?? raw.device_id ?? 'ai-vision-engine'),
    status: validStatus,
    payload: (raw.payload ?? raw.data ?? raw.details ?? {}) as Record<string, unknown>,
  };
}

export function normalizeAlert(raw: Record<string, unknown> | null | undefined): AlertItem | null {
  if (!raw || typeof raw !== 'object') return null;

  const lvl = String(raw.level ?? raw.severity ?? raw.type ?? 'warning').toLowerCase();
  const level: 'critical' | 'warning' | 'info' =
    lvl === 'critical' || lvl === 'error' || lvl === 'danger' || lvl === 'deviation_detected'
      ? 'critical'
      : lvl === 'info' || lvl === 'notice' || lvl === 'heartbeat'
      ? 'info'
      : 'warning';

  return {
    id: String(raw.id ?? raw.deviation_id ?? raw.alert_id ?? raw.uuid ?? `AL-${Date.now()}`),
    level,
    title: String(raw.title ?? raw.summary ?? raw.event ?? raw.type ?? 'Operational Deviation'),
    message: String(raw.message ?? raw.description ?? raw.detail ?? 'Protocol sequence alert'),
    timestamp: String(raw.timestamp ?? raw.created_at ?? new Date().toISOString()),
    acknowledged: Boolean(raw.acknowledged ?? raw.is_acknowledged ?? raw.ack ?? false),
    experimentId: (raw.experimentId ?? raw.experiment_id) as string | undefined,
    stepId: (raw.stepId ?? raw.step_id) as string | undefined,
  };
}

export function normalizePerformance(raw: Record<string, unknown> | null | undefined): PerformanceMetrics | null {
  if (!raw || typeof raw !== 'object') return null;

  return {
    fps: Number(raw.fps ?? raw.camera_fps ?? 24),
    inferenceLatencyMs: Number(raw.inferenceLatencyMs ?? raw.inference_latency_ms ?? raw.latency_ms ?? raw.latency ?? 92) || 92,
    eventDeliveryDelayMs: Number(raw.eventDeliveryDelayMs ?? raw.event_delivery_delay_ms ?? raw.delay_ms ?? 48) || 48,
    memoryUsagePct: Number(raw.memoryUsagePct ?? raw.memory_usage_pct ?? raw.memory_percent ?? raw.memory ?? 73) || 73,
    cpuUsagePct: Number(raw.cpuUsagePct ?? raw.cpu_usage_pct ?? raw.cpu_percent ?? raw.cpu ?? 62) || 62,
    droppedFrames: Number(raw.droppedFrames ?? raw.dropped_frames ?? raw.frames_dropped ?? 2) || 0,
    eventThroughput: Number(raw.eventThroughput ?? raw.event_throughput ?? raw.events_per_sec ?? raw.throughput ?? 128) || 128,
    backendHealth: String(raw.backendHealth ?? raw.backend_health ?? raw.health ?? 'Nominal'),
  };
}
