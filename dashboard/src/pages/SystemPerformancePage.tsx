import type { PerformanceMetrics } from '../types';

interface SystemPerformancePageProps {
  performance: PerformanceMetrics;
}

export function SystemPerformancePage({ performance }: SystemPerformancePageProps) {
  const cpuPct = performance.cpuUsagePct ?? 62;
  const memPct = performance.memoryUsagePct ?? 73;

  return (
    <div className="grid two-col">
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3 className="card-title">Telemetry & Compute Load</h3>
          </div>
          <span className="status-badge status-healthy">Online</span>
        </div>
        <div className="card-body">
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>CPU Utilization</span>
              <span style={{ fontWeight: 700, color: cpuPct > 80 ? 'var(--red-text)' : 'var(--text)' }}>{cpuPct}%</span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${cpuPct}%`,
                  background: cpuPct > 80 ? 'var(--red)' : cpuPct > 65 ? 'var(--amber)' : 'var(--primary)',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>RAM / Memory Allocation</span>
              <span style={{ fontWeight: 700, color: memPct > 85 ? 'var(--red-text)' : 'var(--text)' }}>{memPct}%</span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${memPct}%`,
                  background: memPct > 85 ? 'var(--red)' : memPct > 70 ? 'var(--amber)' : 'var(--primary)',
                }}
              />
            </div>
          </div>

          <div className="metric-row">
            <span className="metric-label">Vision FPS Throughput</span>
            <span className="metric-value" style={{ fontSize: 15 }}>{performance.fps ?? 24} FPS</span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Inference Compute Latency</span>
            <span className="metric-value" style={{ fontSize: 15 }}>{performance.inferenceLatencyMs ?? 92} ms</span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Event Delivery Delay</span>
            <span className="metric-value" style={{ fontSize: 15 }}>{performance.eventDeliveryDelayMs ?? 48} ms</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3 className="card-title">Reliability & Packet Integrity</h3>
          </div>
          <span className="card-subtitle">Diagnostics window: 1 hr</span>
        </div>
        <div className="card-body">
          <div className="metric-row">
            <span className="metric-label">Optical Dropped Frames</span>
            <span className="metric-value" style={{ fontSize: 15, color: (performance.droppedFrames ?? 0) > 0 ? 'var(--amber-text)' : 'var(--green-text)' }}>
              {performance.droppedFrames ?? 0} frames
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Event Pipeline Throughput</span>
            <span className="metric-value" style={{ fontSize: 15 }}>{performance.eventThroughput ?? 128} events / sec</span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Backend Node Health</span>
            <span className="metric-value" style={{ fontSize: 15, color: 'var(--green-text)', fontWeight: 700 }}>
              ● {performance.backendHealth ?? 'Nominal'}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">WebSocket Transport Layer</span>
            <span className="metric-value">
              <span className="status-badge status-healthy">Connected</span>
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Buffer Overflow Rate</span>
            <span className="metric-value" style={{ fontSize: 15 }}>0.00%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
