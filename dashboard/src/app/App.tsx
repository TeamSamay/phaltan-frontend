import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ActivityPulseIcon,
  AlertIcon,
  DashboardIcon,
  DevicesIcon,
  HistoryIcon,
  MoonIcon,
  PerformanceIcon,
  RefreshIcon,
  ScanIcon,
  SunIcon,
  TimelineIcon,
  VideoIcon,
} from '../components/Icons';
import { useMissionControl } from '../hooks/useMissionControl';
import { ActivityRecognitionPage } from '../pages/ActivityRecognitionPage';
import { AlertsPage } from '../pages/AlertsPage';
import { DeviceManagementPage } from '../pages/DeviceManagementPage';
import { EventHistoryPage } from '../pages/EventHistoryPage';
import { ExperimentTimelinePage } from '../pages/ExperimentTimelinePage';
import { LiveMonitoringPage } from '../pages/LiveMonitoringPage';
import { MissionOverviewPage } from '../pages/MissionOverviewPage';
import { SystemPerformancePage } from '../pages/SystemPerformancePage';

const navSections = [
  {
    title: 'Operations',
    items: [
      { id: 'overview', label: 'Mission Overview', icon: DashboardIcon },
      { id: 'live', label: 'Live Monitoring', icon: VideoIcon },
      { id: 'activity', label: 'Activity Recognition', icon: ScanIcon },
      { id: 'timeline', label: 'Experiment Timeline', icon: TimelineIcon },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'alerts', label: 'Alerts & Deviations', icon: AlertIcon },
      { id: 'devices', label: 'Device Management', icon: DevicesIcon },
      { id: 'performance', label: 'System Performance', icon: PerformanceIcon },
      { id: 'events', label: 'Event History', icon: HistoryIcon },
    ],
  },
] as const;

type PageId = (typeof navSections)[number]['items'][number]['id'];

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number | string; color: string; dataKey: string }>;
  label?: string;
}

function CustomChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        <div className="tooltip-title">Time: {label}</div>
        {payload.map((item) => (
          <div key={item.dataKey} className="tooltip-row">
            <span style={{ color: item.color, fontWeight: 600 }}>
              {item.dataKey === 'fps' ? 'Frame Rate' : item.dataKey === 'latency' ? 'Inference Latency' : 'Throughput'}:
            </span>
            <span style={{ fontWeight: 700 }}>
              {item.value} {item.dataKey === 'fps' ? 'FPS' : item.dataKey === 'latency' ? 'ms' : 'evt/s'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [telemetryWindow, setTelemetryWindow] = useState<'1m' | '5m' | '15m' | '1h' | 'Live'>('5m');
  const [utcTime, setUtcTime] = useState<string>('');

  const {
    experiment,
    devices,
    events,
    alerts,
    telemetry,
    performance,
    connectionMode,
    wsConnected,
    lastSyncTime,
    refreshData,
    acknowledgeAlert,
  } = useMissionControl();

  // Keep live UTC ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(
        now.toUTCString().split(' ')[4] ||
          now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Theme synchronization with document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const pendingAlertCount = alerts.filter((a) => !a.acknowledged).length;

  const renderActivePage = () => {
    switch (activePage) {
      case 'overview':
        return <MissionOverviewPage experiment={experiment} devices={devices} currentTime={utcTime} />;
      case 'live':
        return <LiveMonitoringPage event={events[0] || {}} status={experiment.cameraStatus} />;
      case 'activity':
        return <ActivityRecognitionPage event={events[0] || ({} as any)} />;
      case 'timeline':
        return <ExperimentTimelinePage />;
      case 'alerts':
        return <AlertsPage alerts={alerts} onAcknowledge={acknowledgeAlert} />;
      case 'devices':
        return <DeviceManagementPage devices={devices} />;
      case 'performance':
        return <SystemPerformancePage performance={performance} />;
      case 'events':
        return <EventHistoryPage events={events} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      {/* Top Navigation Bar */}
      <header className="topbar">
        <div className="brand-wrapper">
          <div className="brand">
            <div className="brand-icon-box">
              <ActivityPulseIcon size={20} />
              <span className="brand-pulse-ring" />
            </div>
            <div className="brand-text-container">
              <span className="brand-title">SUTRA Mission Control</span>
              <span className="brand-subtitle">Flight & Lab Control</span>
            </div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="telemetry-beacon">
            <span className="beacon-dot" />
            LIVE TELEMETRY
          </div>

          <div
            className="system-pill"
            style={{ cursor: 'pointer' }}
            title="Backend Integration Status"
            onClick={refreshData}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: connectionMode === 'live' ? 'var(--green)' : 'var(--amber)',
                display: 'inline-block',
              }}
            />
            {connectionMode === 'live' ? (
              <span>
                Backend: <strong>Online</strong> {wsConnected && '(Live)'}
              </span>
            ) : (
              <span>
                Backend: <strong>Standby (Local)</strong>
              </span>
            )}
            <RefreshIcon size={13} style={{ marginLeft: 4, opacity: 0.7 }} />
          </div>

          <div className="system-pill">
            Experiment: <strong>{experiment.id}</strong>
          </div>

          <div className="system-pill">
            UTC: <strong>{utcTime}</strong>
          </div>

          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'White'} theme`}
            aria-label="Toggle visual theme"
          >
            {theme === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="layout">
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          <div>
            {navSections.map((sec, secIdx) => (
              <div key={sec.title} style={{ marginBottom: secIdx === 0 ? 16 : 0 }}>
                <div className="nav-section-title">{sec.title}</div>
                <nav className="nav-list">
                  {sec.items.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activePage === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setActivePage(item.id)}
                      >
                        <div className="nav-item-content">
                          <IconComponent size={16} />
                          <span>{item.label}</span>
                        </div>
                        {item.id === 'alerts' && pendingAlertCount > 0 && (
                          <span className="nav-badge">{pendingAlertCount}</span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            <div className="sidebar-status-box">
              <div className="sidebar-status-title">
                <span>Telemetry Link</span>
                <span style={{ color: wsConnected ? 'var(--green-text)' : 'var(--muted)', fontWeight: 700 }}>
                  {wsConnected ? 'LIVE' : 'POLLING'}
                </span>
              </div>
              <div className="sidebar-metric">
                <span>Inference Sync:</span>
                <span className="sidebar-metric-val">{performance.inferenceLatencyMs ?? 92} ms</span>
              </div>
              <div className="sidebar-metric">
                <span>Last Ingest:</span>
                <span className="sidebar-metric-val">{lastSyncTime}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="main">
          {/* Executive KPI Overview Grid */}
          <div className="kpi-grid">
            {/* System Status Card */}
            <div className="card kpi-card">
              <div className="kpi-header">
                <span>System Status</span>
                <span className="status-badge status-healthy">Healthy</span>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value">Nominal</span>
              </div>
              <div className="kpi-rate">
                <span>●</span> All Systems Ready
              </div>
            </div>

            {/* AI Engine Status Card */}
            <div className="card kpi-card">
              <div className="kpi-header">
                <span>AI Vision Engine</span>
                <span className="status-badge status-healthy">Online</span>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value">98.4%</span>
              </div>
              <div className="kpi-rate">
                <span>▲</span> Vision Accurate (+1.2%)
              </div>
            </div>

            {/* Mission Progress Card */}
            <div className="card kpi-card">
              <div className="kpi-header">
                <span>Mission Steps</span>
                <span className="status-badge status-running">Running</span>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value">{experiment.progress}%</span>
                <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
                  Step {experiment.completedSteps} of {experiment.completedSteps + experiment.pendingSteps}
                </span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${experiment.progress}%` }} />
              </div>
            </div>

            {/* Video Latency & Throughput Card */}
            <div className="card kpi-card">
              <div className="kpi-header">
                <span>Camera Lag</span>
                <span className="status-badge status-warning">92 ms</span>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value">24.2 FPS</span>
              </div>
              <div className="kpi-rate neutral">
                <span>■</span> 2 Dropped Frames (CAM-07)
              </div>
            </div>
          </div>

          {/* Telemetry Overview Chart */}
          <div className="grid" style={{ marginTop: '18px' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <h3 className="card-title">Live Chart</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div className="telemetry-legend">
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: '#0284c7' }} />
                      <span>FPS:</span>
                      <span className="legend-value">{telemetry[telemetry.length - 1]?.fps ?? 24}</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: '#f59e0b' }} />
                      <span>Latency:</span>
                      <span className="legend-value">{telemetry[telemetry.length - 1]?.latency ?? 92} ms</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: '#7c3aed' }} />
                      <span>Throughput:</span>
                      <span className="legend-value">{telemetry[telemetry.length - 1]?.throughput ?? 124}</span>
                    </div>
                  </div>

                  <div className="chart-controls">
                    {(['1m', '5m', '15m', '1h', 'Live'] as const).map((win) => (
                      <button
                        key={win}
                        type="button"
                        className={`chart-pill ${telemetryWindow === win ? 'active' : ''}`}
                        onClick={() => setTelemetryWindow(win)}
                      >
                        {win}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card-body" style={{ height: 230, minHeight: 230 }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <LineChart data={telemetry} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e2e8f0' : '#1e293b'} />
                    <XAxis dataKey="name" stroke={theme === 'light' ? '#64748b' : '#94a3b8'} fontSize={11} />
                    <YAxis stroke={theme === 'light' ? '#64748b' : '#94a3b8'} fontSize={11} domain={[0, 140]} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="fps"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#0284c7' }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="latency"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#f59e0b' }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="throughput"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Active Subpage Content */}
          <div style={{ marginTop: '18px' }}>{renderActivePage()}</div>
        </main>
      </div>
    </div>
  );
}
