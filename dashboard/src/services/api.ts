import type { AlertItem, DeviceInfo, ExperimentSummary, LogEvent, PerformanceMetrics } from '../types';
import {
  extractListItems,
  normalizeAlert,
  normalizeDevice,
  normalizeExperiment,
  normalizeLogEvent,
  normalizePerformance,
} from './adapter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const HEALTH_URL = import.meta.env.VITE_HEALTH_URL || '/health';

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T | null> {
  const { timeoutMs = 4000, ...init } = options;
  let signal: AbortSignal | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (typeof AbortController !== 'undefined') {
    try {
      const controller = new AbortController();
      signal = controller.signal;
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    } catch {
      // Ignore controller error in test environments
    }
  }

  // Handle absolute or relative URLs
  let fullUrl: string;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    fullUrl = endpoint;
  } else if (endpoint === '/health') {
    fullUrl = HEALTH_URL;
  } else {
    const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    fullUrl = `${cleanBase}${cleanPath}`;
  }

  try {
    const response = await fetch(fullUrl, {
      ...(signal ? { signal } : {}),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[API] HTTP ${response.status} from ${fullUrl}`);
      return null;
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    console.debug(`[API] Offline / Unreachable: ${fullUrl}`);
    return null;
  }
}

export const api = {
  /**
   * Health Ping to SUTRA Backend: GET /health or GET /api/v1/system/status
   */
  async getHealth(): Promise<{ status: string; ok: boolean } | null> {
    const health = await request<{ status?: string; ok?: boolean }>('/health');
    if (health) return { status: health.status ?? 'healthy', ok: true };

    const sysStatus = await request<{ status?: string }>('/system/status');
    if (sysStatus) return { status: sysStatus.status ?? 'healthy', ok: true };

    return null;
  },

  /**
   * Fetch current active experiment: GET /api/v1/experiments/current or /api/v1/experiments
   */
  async getCurrentExperiment(): Promise<ExperimentSummary | null> {
    const current = await request<Record<string, unknown>>('/experiments/current');
    if (current) {
      const exp = normalizeExperiment(current);
      if (exp) return exp;
    }

    const exps = await this.getExperiments();
    return exps.length > 0 ? exps[0] : null;
  },

  /**
   * List experiments: GET /api/v1/experiments
   */
  async getExperiments(): Promise<ExperimentSummary[]> {
    const res = await request<unknown>('/experiments');
    const items = extractListItems<Record<string, unknown>>(res);
    return items.map(normalizeExperiment).filter((e): e is ExperimentSummary => e !== null);
  },

  /**
   * Fetch experiment timeline: GET /api/v1/experiments/{id}/timeline
   */
  async getExperimentTimeline(id: string): Promise<unknown[] | null> {
    const res = await request<unknown>(`/experiments/${id}/timeline`);
    return extractListItems(res);
  },

  /**
   * Start experiment: POST /api/v1/experiments/{id}/start
   */
  async startExperiment(id: string): Promise<boolean> {
    const res = await request<{ ok?: boolean; status?: string }>(`/experiments/${id}/start`, { method: 'POST' });
    return Boolean(res?.ok ?? (res?.status === 'running'));
  },

  /**
   * Stop experiment: POST /api/v1/experiments/{id}/stop
   */
  async stopExperiment(id: string): Promise<boolean> {
    const res = await request<{ ok?: boolean; status?: string }>(`/experiments/${id}/stop`, { method: 'POST' });
    return Boolean(res?.ok ?? true);
  },

  /**
   * List registered hardware & nodes: GET /api/v1/devices
   */
  async getDevices(): Promise<DeviceInfo[]> {
    const res = await request<unknown>('/devices');
    const items = extractListItems<Record<string, unknown>>(res);
    return items.map(normalizeDevice).filter((d): d is DeviceInfo => d !== null);
  },

  /**
   * List vision & transition events: GET /api/v1/events
   */
  async getEvents(limit = 50): Promise<LogEvent[]> {
    const res = await request<unknown>(`/events?limit=${limit}`);
    const items = extractListItems<Record<string, unknown>>(res);
    return items.map(normalizeLogEvent).filter((e): e is LogEvent => e !== null);
  },

  /**
   * List deviations & alerts: GET /api/v1/deviations
   */
  async getDeviations(): Promise<AlertItem[]> {
    const res = await request<unknown>('/deviations');
    const items = extractListItems<Record<string, unknown>>(res);
    return items.map(normalizeAlert).filter((a): a is AlertItem => a !== null);
  },

  /**
   * Acknowledge deviation: POST /api/v1/deviations/{deviation_id}/acknowledge
   */
  async acknowledgeDeviation(deviationId: string): Promise<boolean> {
    const res = await request<{ ok?: boolean }>(`/deviations/${deviationId}/acknowledge`, { method: 'POST' });
    return Boolean(res?.ok ?? true);
  },

  /**
   * Fetch system metrics: GET /api/v1/system/metrics
   */
  async getSystemMetrics(): Promise<PerformanceMetrics | null> {
    const res = await request<Record<string, unknown>>('/system/metrics');
    return normalizePerformance(res);
  },

  /**
   * Fetch system logs: GET /api/v1/system/logs
   */
  async getSystemLogs(): Promise<unknown[] | null> {
    const res = await request<unknown>('/system/logs');
    return extractListItems(res);
  },
};
