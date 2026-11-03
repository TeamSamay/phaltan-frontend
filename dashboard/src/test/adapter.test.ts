import { describe, it, expect } from 'vitest';
import {
  normalizeExperiment,
  normalizeDevice,
  normalizeLogEvent,
  normalizeAlert,
  normalizePerformance,
  extractListItems,
} from '../services/adapter';

describe('FastAPI Backend Adapter', () => {
  it('unwraps paginated items envelope from FastAPI list endpoints', () => {
    const response = {
      items: [
        { id: 'EXP-1', name: 'Test 1' },
        { id: 'EXP-2', name: 'Test 2' },
      ],
      total: 2,
      limit: 50,
      offset: 0,
    };

    const items = extractListItems<{ id: string; name: string }>(response);
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('EXP-1');
  });

  it('correctly normalizes FastAPI snake_case experiment payload', () => {
    const raw = {
      id: 'EXP-2417',
      name: 'BAS Wet-Lab Protocol',
      current_step: 'Step 03 - Tool transfer',
      progress: 68,
      completed_steps: 3,
      pending_steps: 2,
      deviation_count: 1,
      ai_status: 'healthy',
      backend_status: 'healthy',
      camera_status: 'warning',
    };

    const result = normalizeExperiment(raw);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('EXP-2417');
    expect(result?.name).toBe('BAS Wet-Lab Protocol');
    expect(result?.currentStep).toBe('Step 03 - Tool transfer');
    expect(result?.progress).toBe(68);
    expect(result?.aiStatus).toBe('healthy');
  });

  it('normalizes FastAPI device payloads', () => {
    const raw = {
      id: 'AI-01',
      device_type: 'ai',
      name: 'AI Vision Engine',
      status: 'healthy',
      connection_status: 'connected',
      host: '127.0.0.1',
      health: 'Inference nominal',
    };

    const result = normalizeDevice(raw);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('AI-01');
    expect(result?.type).toBe('ai');
    expect(result?.host).toBe('127.0.0.1');
    expect(result?.status).toBe('healthy');
  });

  it('normalizes FastAPI deviations into alerts', () => {
    const raw = {
      deviation_id: 'dev-001',
      type: 'DEVIATION_DETECTED',
      severity: 'warning',
      title: 'Skipped step detected',
      message: 'Operator action bypassed step',
      is_acknowledged: false,
    };

    const alert = normalizeAlert(raw);
    expect(alert).not.toBeNull();
    expect(alert?.id).toBe('dev-001');
    expect(alert?.title).toBe('Skipped step detected');
    expect(alert?.acknowledged).toBe(false);
  });
});
