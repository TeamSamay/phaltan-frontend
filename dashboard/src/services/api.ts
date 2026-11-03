import type { AlertItem, DeviceInfo, ExperimentSummary, LogEvent, PerformanceMetrics } from '../types';
import {
  normalizeAlert,
  normalizeDevice,
  normalizeExperiment,
  normalizeLogEvent,
  normalizePerformance,
} from './adapter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
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

  const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${cleanBase}${cleanPath}`;

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
      console.warn(`[API] ${response.status} from ${fullUrl}`);
      return null;
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    // Non-blocking log: allows dashboard to gracefully fallback to cache / mock
    console.debug(`[API] Unreachable: ${fullUrl}`, (error as Error).message);
    return null;
  }
}

export const api = {
  /**
   * Health ping to backend
   */
  async getHealth(): Promise<{ status: string; ok: boolean } | null> {
    return request<{ status: string; ok: boolean }>(`/health`);
  },

  /**
   * Fetch active or all experiments
   */
  async getExperiments(): Promise<ExperimentSummary[]> {
    interface RawExperimentsResponse {
      data?: unknown[];
      experiments?: unknown[];
      [key: string]: unknown;
    }
    const res = await request<RawExperimentsResponse | unknown[]>('/experiments');
    if (!res) return [];

    const list = Array.isArray(res) ? res : (res.data ?? res.experiments ?? []);
    if (!Array.isArray(list)) return [];

    return list.map((item) => normalizeExperiment(item as Record<string, unknown>)).filter((e): e is ExperimentSummary => e !== null);
  },

  /**
   * Fetch specific experiment by ID
   */
  async getExperiment(id: string): Promise<ExperimentSummary | null> {
    const res = await request<Record<string, unknown>>(`/experiments/${id}`);
    return normalizeExperiment(res);
  },

  /**
   * Start experiment run
   */
  async startExperiment(id: string): Promise<boolean> {
    const res = await request<{ ok?: boolean; success?: boolean }>(`/experiments/${id}/start`, { method: 'POST' });
    return Boolean(res?.ok ?? res?.success ?? true);
  },

  /**
   * Complete protocol step
   */
  async completeStep(experimentId: string, stepId: string): Promise<boolean> {
    const res = await request<{ ok?: boolean }>(`/experiments/${experimentId}/steps/${stepId}/complete`, { method: 'POST' });
    return Boolean(res?.ok ?? true);
  },

  /**
   * Fetch connected hardware & devices
   */
  async getDevices(): Promise<DeviceInfo[]> {
    interface RawDevicesResponse {
      devices?: unknown[];
      data?: unknown[];
      [key: string]: unknown;
    }
    const res = await request<RawDevicesResponse | unknown[]>('/devices');
    if (!res) return [];

    const list = Array.isArray(res) ? res : (res.devices ?? res.data ?? []);
    if (!Array.isArray(list)) return [];

    return list.map((item) => normalizeDevice(item as Record<string, unknown>)).filter((d): d is DeviceInfo => d !== null);
  },

  /**
   * Fetch real-time or recent event log
   */
  async getEvents(query?: string): Promise<LogEvent[]> {
    interface RawEventsResponse {
      events?: unknown[];
      data?: unknown[];
      [key: string]: unknown;
    }
    const res = await request<RawEventsResponse | unknown[]>(`/events${query ? `?${query}` : ''}`);
    if (!res) return [];

    const list = Array.isArray(res) ? res : (res.events ?? res.data ?? []);
    if (!Array.isArray(list)) return [];

    return list.map((item) => normalizeLogEvent(item as Record<string, unknown>)).filter((e): e is LogEvent => e !== null);
  },

  /**
   * Fetch alerts
   */
  async getAlerts(): Promise<AlertItem[]> {
    interface RawAlertsResponse {
      alerts?: unknown[];
      data?: unknown[];
      [key: string]: unknown;
    }
    const res = await request<RawAlertsResponse | unknown[]>('/alerts');
    if (!res) return [];

    const list = Array.isArray(res) ? res : (res.alerts ?? res.data ?? []);
    if (!Array.isArray(list)) return [];

    return list.map((item) => normalizeAlert(item as Record<string, unknown>)).filter((a): a is AlertItem => a !== null);
  },

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(id: string): Promise<boolean> {
    const res = await request<{ ok?: boolean }>(`/alerts/${id}/acknowledge`, { method: 'POST' });
    return Boolean(res?.ok ?? true);
  },

  /**
   * Fetch system performance stats
   */
  async getPerformance(): Promise<PerformanceMetrics | null> {
    const res = await request<Record<string, unknown>>('/performance');
    return normalizePerformance(res);
  },

  /**
   * Fetch telemetry data points for graph
   */
  async getTelemetry(): Promise<Array<{ name: string; fps: number; latency: number; throughput: number }>> {
    interface RawTelemetryPoint {
      name?: string;
      time?: string;
      fps?: number;
      latency?: number;
      throughput?: number;
    }
    interface RawTelemetryResponse {
      telemetry?: RawTelemetryPoint[];
      data?: RawTelemetryPoint[];
    }
    const res = await request<RawTelemetryResponse | RawTelemetryPoint[]>('/telemetry');
    if (!res) return [];

    const list = Array.isArray(res) ? res : (res.telemetry ?? res.data ?? []);
    if (!Array.isArray(list)) return [];

    return list.map((pt) => ({
      name: String(pt.name ?? pt.time ?? ''),
      fps: Number(pt.fps ?? 0),
      latency: Number(pt.latency ?? 0),
      throughput: Number(pt.throughput ?? 0),
    }));
  },
};
