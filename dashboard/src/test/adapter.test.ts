import { describe, it, expect } from 'vitest';
import {
  normalizeExperiment,
  normalizeDevice,
  normalizeLogEvent,
  normalizeAlert,
  normalizePerformance,
} from '../services/adapter';

describe('Backend Adapter Normalizer', () => {
  it('correctly normalizes snake_case backend payloads', () => {
    const raw = {
      experiment_id: 'EXP-9999',
      experiment_name: 'Field Trial Alpha',
      current_step: 'Step 02 - Calibration',
      progress: 45,
      completed_steps: 2,
      pending_steps: 3,
      deviation_count: 0,
      ai_status: 'nominal',
      backend_status: 'online',
      camera_status: 'healthy',
    };

    const result = normalizeExperiment(raw);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('EXP-9999');
    expect(result?.name).toBe('Field Trial Alpha');
    expect(result?.currentStep).toBe('Step 02 - Calibration');
    expect(result?.progress).toBe(45);
    expect(result?.aiStatus).toBe('healthy');
  });

  it('correctly normalizes camelCase backend payloads', () => {
    const raw = {
      id: 'EXP-1234',
      name: 'Lab Test',
      currentStep: 'Step 01',
      progress: 10,
      completedSteps: 1,
      pendingSteps: 5,
      deviationCount: 0,
      aiStatus: 'warning',
      backendStatus: 'healthy',
      cameraStatus: 'healthy',
    };

    const result = normalizeExperiment(raw);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('EXP-1234');
    expect(result?.aiStatus).toBe('warning');
  });

  it('normalizes device payloads with IP and status mapping', () => {
    const raw = {
      device_id: 'CAM-01',
      device_type: 'camera',
      device_name: 'Overhead Camera',
      health_status: 'ok',
      connection_status: 'connected',
      ip_address: '192.168.1.50',
    };

    const result = normalizeDevice(raw);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('CAM-01');
    expect(result?.type).toBe('camera');
    expect(result?.host).toBe('192.168.1.50');
    expect(result?.status).toBe('healthy');
  });

  it('normalizes alert items', () => {
    const raw = {
      alert_id: 'AL-500',
      severity: 'critical',
      summary: 'Sensor Offline',
      detail: 'Lost optical feed',
      is_acknowledged: false,
    };

    const alert = normalizeAlert(raw);
    expect(alert).not.toBeNull();
    expect(alert?.id).toBe('AL-500');
    expect(alert?.level).toBe('critical');
    expect(alert?.title).toBe('Sensor Offline');
    expect(alert?.acknowledged).toBe(false);
  });
});

