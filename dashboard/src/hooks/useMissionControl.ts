import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { MissionControlSocket, type SocketMessage } from '../services/websocket';
import { normalizeAlert, normalizeDevice, normalizeExperiment, normalizeLogEvent } from '../services/adapter';
import type { AlertItem, DeviceInfo, ExperimentSummary, LogEvent, PerformanceMetrics } from '../types';

export const initialMockExperiment: ExperimentSummary = {
  id: 'EXP-2417',
  name: 'BAS Test Run',
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
    host: '192.168.1.101',
    lastHeartbeat: '2026-11-03T10:15:39Z',
    lastEvent: 'activity.detected',
    health: 'Inference nominal',
  },
  {
    id: 'BK-01',
    type: 'backend',
    name: 'Backend Service',
    status: 'healthy',
    connectionStatus: 'connected',
    host: '192.168.1.102',
    lastHeartbeat: '2026-11-03T10:15:38Z',
    lastEvent: 'experiment.updated',
    health: 'API nominal',
  },
  {
    id: 'CAM-07',
    type: 'camera',
    name: 'Primary Camera',
    status: 'warning',
    connectionStatus: 'degraded',
    host: '192.168.1.104',
    lastHeartbeat: '2026-11-03T10:15:03Z',
    lastEvent: 'frame_loss',
    health: '2 dropped frames',
  },
];

export const initialMockEvents: LogEvent[] = [
  {
    eventId: 'evt-1001',
    type: 'activity.detected',
    experimentId: 'EXP-2417',
    stepId: 'step-3',
    timestamp: '2026-11-03T10:15:39Z',
    confidence: 0.94,
    source: 'ai-vision-engine',
    status: 'verified',
    payload: { activity: 'hand_object_interaction', objects: ['cup', 'hand'], confidence: 0.94 },
  },
  {
    eventId: 'evt-1002',
    type: 'step.transition',
    experimentId: 'EXP-2417',
    stepId: 'step-4',
    timestamp: '2026-11-03T10:15:20Z',
    confidence: 0.81,
    source: 'experiment-engine',
    status: 'inferred',
    payload: { transition: 'step_3_to_4', action: 'tool transfer' },
  },
  {
    eventId: 'evt-1003',
    type: 'deviation.alert',
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
    title: 'Frame delivery slight delay',
    message: 'Camera feed latency increased to 92 ms.',
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

      // Fetch all endpoints concurrently
      const [expList, devList, evtList, alertList, perf, telem] = await Promise.all([
        api.getExperiments(),
        api.getDevices(),
        api.getEvents(),
        api.getAlerts(),
        api.getPerformance(),
        api.getTelemetry(),
      ]);

      if (expList.length > 0) setExperiment(expList[0]);
      if (devList.length > 0) setDevices(devList);
      if (evtList.length > 0) setEvents(evtList);
      if (alertList.length > 0) setAlerts(alertList);
      if (perf) setPerformance(perf);
      if (telem.length > 0) setTelemetry(telem);

      setLastSyncTime(new Date().toLocaleTimeString());
    } catch {
      setConnectionMode('local');
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleSocketMessage = useCallback((msg: SocketMessage) => {
    const type = msg.type || msg.event || msg.topic;
    const payload = (msg.payload || msg.data || msg) as Record<string, unknown>;

    if (type?.includes('experiment')) {
      const updated = normalizeExperiment(payload);
      if (updated) setExperiment(updated);
    } else if (type?.includes('device') || type?.includes('heartbeat')) {
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
    } else if (type?.includes('alert')) {
      const newAlert = normalizeAlert(payload);
      if (newAlert) {
        setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
      }
    } else if (type?.includes('activity') || type?.includes('event')) {
      const newEvent = normalizeLogEvent(payload);
      if (newEvent) {
        setEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
      }
    } else if (type?.includes('telemetry')) {
      if (payload.fps !== undefined || payload.latency !== undefined) {
        const timeLabel = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
        setTelemetry((prev) => [
          ...prev.slice(1),
          {
            name: timeLabel,
            fps: Number(payload.fps ?? prev[prev.length - 1]?.fps ?? 24),
            latency: Number(payload.latency ?? prev[prev.length - 1]?.latency ?? 90),
            throughput: Number(payload.throughput ?? prev[prev.length - 1]?.throughput ?? 120),
          },
        ]);
      }
    }
  }, []);

  // Connect WebSocket & start background check
  useEffect(() => {
    fetchBackendData();

    // Polling every 10 seconds if backend is offline or as sync fallback
    const pollTimer = setInterval(fetchBackendData, 10000);

    // Initialize socket
    socketRef.current = new MissionControlSocket(undefined, {
      onOpen: () => {
        setWsConnected(true);
        setConnectionMode('live');
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
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
    await api.acknowledgeAlert(id);
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

