import type { DeviceInfo, ExperimentSummary } from '../types';

interface MissionOverviewPageProps {
  experiment: ExperimentSummary;
  devices: DeviceInfo[];
  currentTime: string;
}

export function MissionOverviewPage({ experiment, devices, currentTime }: MissionOverviewPageProps) {
  return (
    <div className="grid two-col">
      {/* Mission Execution Overview */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3 className="card-title">Mission Overview</h3>
          </div>
          <span className="status-badge status-healthy">running</span>
        </div>
        <div className="card-body">
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Protocol Execution Progress</span>
              <span style={{ color: 'var(--text)', fontWeight: 700 }}>{experiment.progress}%</span>
            </div>
            <div className="progress-bar-bg" style={{ height: 8 }}>
              <div className="progress-bar-fill" style={{ width: `${experiment.progress}%` }} />
            </div>
          </div>

          <div className="metric-row">
            <span className="metric-label">SUTRA System Status</span>
            <span className="metric-value" style={{ fontSize: 16, color: 'var(--green-text)', fontWeight: 700 }}>
              ● Healthy
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Current Experiment</span>
            <span className="metric-value" style={{ fontSize: 15 }}>{experiment.name}</span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Experiment ID</span>
            <span className="metric-value" style={{ fontSize: 14, fontFamily: 'monospace' }}>{experiment.id}</span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Protocol Active Step</span>
            <span className="metric-value" style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
              {experiment.currentStep}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Completed / Pending Steps</span>
            <span className="metric-value" style={{ fontSize: 14 }}>
              {experiment.completedSteps} Completed &nbsp;/&nbsp; {experiment.pendingSteps} Pending
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Deviation Count</span>
            <span className="metric-value" style={{ fontSize: 14 }}>
              <span className={`status-badge ${experiment.deviationCount > 0 ? 'status-warning' : 'status-healthy'}`}>
                {experiment.deviationCount} Deviation Detected
              </span>
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Current System Time</span>
            <span className="metric-value" style={{ fontSize: 14, fontFamily: 'monospace' }}>{currentTime}</span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button type="button" className="btn btn-primary btn-sm">
              Verify Checkpoint
            </button>
            <button type="button" className="btn btn-sm">
              Hold Sequence
            </button>
            <button type="button" className="btn btn-sm">
              Telemetry Dump
            </button>
          </div>
        </div>
      </div>

      {/* Connected Subsystems & Hardware */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3 className="card-title">Subsystems & Hardware</h3>
          </div>
          <span className="card-subtitle">{devices.length} Units Active</span>
        </div>
        <div className="card-body">
          {devices.map((device) => (
            <div key={device.id} className="metric-row" style={{ padding: '12px 0' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>
                  {device.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 10, marginTop: 3 }}>
                  <span>ID: <code style={{ color: 'var(--text-secondary)' }}>{device.id}</code></span>
                  <span>IP: {device.host}</span>
                  <span>{device.health}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`status-badge status-${device.status}`}>
                  {device.status}
                </span>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 8, background: 'var(--bg-panel-alt)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>Primary Subsystem Gateway</span>
              <span style={{ color: 'var(--green-text)', fontWeight: 600 }}>99.98% Synced</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              Zero packet loss detected in past 60 minutes. Heartbeat frequency 1000ms.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
