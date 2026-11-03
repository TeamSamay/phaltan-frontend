import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { MissionControlSocket, type SocketMessage } from '../services/websocket';
import { normalizeAlert, normalizeDevice, normalizeExperiment, normalizeLogEvent } from '../services/adapter';
import type { AlertItem, DeviceInfo, ExperimentSummary, LogEvent, PerformanceMetrics } from '../types';

export const initialMockExperiment: ExperimentSummary = {
  id: 'EXP-2417',
  name: 'BAS Wet-Lab Protocol',
  status: 'running',
  currentStep: 'Step 03 - Tool transfer',
  progress: 68,
  completedSteps: 3,
  pendingSteps: 2,
  deviationCount: 1,
  startedAt: '2026-11-03T10:12:00Z',
  updatedAt: '2026-11-03T10:15:40Z',
  aiStatus: 'healthy',
  backendStatus: 'healthy',
  cameraStatus: 'warning',
};

export const initialMockDevices: DeviceInfo[] = [
  {
    id: 'AI-01',
    type: 'ai',
    name: 'AI Vision Engine',
    status: 'healthy',
    connectionStatus: 'connected',
    host: '127.0.0.1',
    lastHeartbeat: '2026-11-03T10:15:39Z',
    lastEvent: 'STEP_STARTED',
    health: 'Inference nominal',
  },
  {
    id: 'BK-01',
    type: 'backend',
    name: 'FastAPI Backend Service',
    status: 'healthy',
    connectionStatus: 'connected',
    host: '127.0.0.1:8000',
    lastHeartbeat: '2026-11-03T10:15:38Z',
    lastEvent: 'SYSTEM_STATUS',
    health: 'API v1 nominal',
  },
  {
    id: 'CAM-07',
    type: 'camera',
    name: 'Primary Camera Stream',
    status: 'warning',
    connectionStatus: 'degraded',
    host: '192.168.1.104',
    lastHeartbeat: '2026-11-03T10:15:03Z',
    lastEvent: 'CAMERA_RECONNECTED',
    health: '2 dropped frames',
  },
];

export const initialMockEvents: LogEvent[] = [
  {
    eventId: 'evt-1001',
    type: 'STEP_STARTED',
    experimentId: 'EXP-2417',
    stepId: 'step-3',
    timestamp: '2026-11-03T10:15:39Z',
    confidence: 0.94,
    source: 'ai-vision-engine',
    status: 'verified',
    payload: { activity: 'hand_object_interaction', objects: ['cup', 'hand', 'pipette'], confidence: 0.94 },
  },
  {
    eventId: 'evt-1002',
    type: 'STEP_COMPLETED',
    experimentId: 'EXP-2417',
    stepId: 'step-2',
    timestamp: '2026-11-03T10:15:20Z',
    confidence: 0.93,
    source: 'experiment-engine',
    status: 'verified',
    payload: { transition: 'step_2_to_3', action: 'specimen placement' },
  },
  {
    eventId: 'evt-1003',
    type: 'DEVIATION_DETECTED',
    experimentId: 'EXP-2417',
    stepId: 'step-4',
    timestamp: '2026-11-03T10:14:55Z',
    confidence: 0.58,
    source: 'backend',
    status: 'needs_review',
    payload: { message: 'Skipped expected step', reviewRequired: true },
  },
];

export const initialMockAlerts: AlertItem[] = [
  {
    id: 'AL-001',
    level: 'warning',
    title: 'Skipped step detected',
    message: 'Operator action bypassed expected completed step. Awaiting confirmation.',
    timestamp: '2026-11-03T10:14:53Z',
    acknowledged: false,
    experimentId: 'EXP-2417',
    stepId: 'step-4',
  },
  {
    id: 'AL-002',
    level: 'info',
    title: 'Optical feed latency notice',
    message: 'Camera frame latency measured 92 ms.',
    timestamp: '2026-11-03T10:14:12Z',
    acknowledged: true,
  },
];

export const initialTelemetry = [
  { name: '00:00', fps: 24, latency: 92, throughput: 126 },
  { name: '00:10', fps: 25, latency: 90, throughput: 129 },
  { name: '00:20', fps: 24, latency: 96, throughput: 124 },
  { name: '00:30', fps: 23, latency: 104, throughput: 119 },
  { name: '00:40', fps: 22, latency: 112, throughput: 118 },
  { name: '00:50', fps: 24, latency: 94, throughput: 124 },
];

export const initialPerformance: PerformanceMetrics = {
  fps: 24,
  inferenceLatencyMs: 92,
  eventDeliveryDelayMs: 48,
  memoryUsagePct: 73,
  cpuUsagePct: 62,
  droppedFrames: 2,
  eventThroughput: 128,
  backendHealth: 'Nominal',
};

export type ConnectionMode = 'live' | 'local' | 'connecting';

export function useMissionControl() {
  const [experiment, setExperiment] = useState<ExperimentSummary>(initialMockExperiment);
  const [devices, setDevices] = useState<DeviceInfo[]>(initialMockDevices);
  const [events, setEvents] = useState<LogEvent[]>(initialMockEvents);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialMockAlerts);
  const [telemetry, setTelemetry] = useState(initialTelemetry);
  const [performance, setPerformance] = useState<PerformanceMetrics>(initialPerformance);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('local');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  const socketRef = useRef<MissionControlSocket | null>(null);

  const fetchBackendData = useCallback(async () => {
    try {
      const health = await api.getHealth();
      if (!health) {
        setConnectionMode('local');
        return;
      }

      setConnectionMode('live');

      // Concurrent fetch of all versioned REST endpoints
      const [currentExp, devList, evtList, deviationList, metrics] = await Promise.all([
        api.getCurrentExperiment(),
        api.getDevices(),
        api.getEvents(50),
        api.getDeviations(),
        api.getSystemMetrics(),
      ]);

      if (currentExp) setExperiment(currentExp);
      if (devList.length > 0) setDevices(devList);
      if (evtList.length > 0) setEvents(evtList);
      if (deviationList.length > 0) setAlerts(deviationList);
      if (metrics) setPerformance(metrics);

      setLastSyncTime(new Date().toLocaleTimeString());
    } catch {
      setConnectionMode('local');
    }
  }, []);

  // Handle incoming broadcast messages from /ws/dashboard
  const handleSocketMessage = useCallback(
    (msg: SocketMessage) => {
      const eventType = String(msg.type ?? msg.event_type ?? msg.event ?? '').toUpperCase();
      const payload = (msg.payload ?? msg.data ?? msg) as Record<string, unknown>;

      if (eventType.includes('STEP')) {
        // Step transition occurred: update experiment and trigger sync
        const updated = normalizeExperiment(payload);
        if (updated) setExperiment(updated);
        fetchBackendData();
      } else if (eventType.includes('DEVIATION') || eventType.includes('REVIEW')) {
        const newAlert = normalizeAlert(payload);
        if (newAlert) {
          setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
        }
      } else if (eventType.includes('CAMERA')) {
        const isDown = eventType.includes('DISCONNECTED');
        setExperiment((prev) => ({
          ...prev,
          cameraStatus: isDown ? 'critical' : 'healthy',
        }));
      } else if (eventType.includes('HEARTBEAT') || eventType.includes('DEVICE')) {
        const updatedDev = normalizeDevice(payload);
        if (updatedDev) {
          setDevices((prev) => {
            const index = prev.findIndex((d) => d.id === updatedDev.id);
            if (index >= 0) {
              const next = [...prev];
              next[index] = { ...next[index], ...updatedDev };
              return next;
            }
            return [...prev, updatedDev];
          });
        }
      }

      // Append real-time telemetry tick if available
      const nowLabel = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
      const fpsVal = Number(payload.fps ?? performance.fps ?? 24);
      const latencyVal = Number(payload.latency ?? payload.latency_ms ?? performance.inferenceLatencyMs ?? 92);
      const throughputVal = Number(payload.throughput ?? performance.eventThroughput ?? 124);

      setTelemetry((prev) => [
        ...prev.slice(1),
        { name: nowLabel, fps: fpsVal, latency: latencyVal, throughput: throughputVal },
      ]);
    },
    [fetchBackendData, performance]
  );

  useEffect(() => {
    fetchBackendData();

    // 8-second interval polling for updates and health checking
    const pollTimer = setInterval(fetchBackendData, 8000);

    // Initialize FastAPI WebSocket connection at /ws/dashboard
    socketRef.current = new MissionControlSocket(undefined, {
      onOpen: () => {
        setWsConnected(true);
        setConnectionMode('live');
        fetchBackendData();
      },
      onClose: () => {
        setWsConnected(false);
      },
      onMessage: handleSocketMessage,
    });

    return () => {
      clearInterval(pollTimer);
      socketRef.current?.disconnect();
    };
  }, [fetchBackendData, handleSocketMessage]);

  const acknowledgeAlert = useCallback(async (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
    await api.acknowledgeDeviation(id);
  }, []);

  return {
    experiment,
    devices,
    events,
    alerts,
    telemetry,
    performance,
    connectionMode,
    wsConnected,
    lastSyncTime,
    refreshData: fetchBackendData,
    acknowledgeAlert,
  };
}
