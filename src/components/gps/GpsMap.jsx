import { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

const DEVICE_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];
function getColor(i) { return DEVICE_COLORS[i % DEVICE_COLORS.length]; }

function getBounds(points) {
  if (!points.length) return { minLat: -10, maxLat: 10, minLng: -10, maxLng: 10 };
  const lats = points.map(p => p.latitude);
  const lngs = points.map(p => p.longitude);
  const pad = 0.01;
  return {
    minLat: Math.min(...lats) - pad, maxLat: Math.max(...lats) + pad,
    minLng: Math.min(...lngs) - pad, maxLng: Math.max(...lngs) + pad,
  };
}

function project(lat, lng, bounds, W, H) {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * W;
  const y = H - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * H;
  return { x: isFinite(x) ? x : W/2, y: isFinite(y) ? y : H/2 };
}

export default function GpsMap({ locations = [], history = [], selectedDevice, onSelectDevice }) {
  const W = 900, H = 480;
  const allPoints = [...locations, ...history];
  const bounds = getBounds(allPoints);
  const deviceNames = [...new Set(locations.map(l => l.device_name))];
  const colorMap = Object.fromEntries(deviceNames.map((d, i) => [d, getColor(i)]));

  const historyPts = history.map(p => project(p.latitude, p.longitude, bounds, W, H));
  const trail = historyPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="space-y-4">
      <div className="relative bg-gray-900 rounded-xl border border-gray-800 overflow-hidden" style={{ height: 500 }}>
        {allPoints.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
            <MapPin className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No GPS data yet</p>
            <p className="text-sm">Add a point manually or POST via the API</p>
          </div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full"
            style={{ background: 'linear-gradient(160deg,#0a1628 0%,#111827 100%)' }}>
            {/* Grid */}
            {Array.from({ length: 10 }).map((_, i) => (
              <g key={i}>
                <line x1={i*(W/10)} y1={0} x2={i*(W/10)} y2={H} stroke="#1e3a5f" strokeWidth="0.4" />
                <line x1={0} y1={i*(H/10)} x2={W} y2={i*(H/10)} stroke="#1e3a5f" strokeWidth="0.4" />
              </g>
            ))}
            {/* Trail */}
            {history.length > 1 && (
              <path d={trail} fill="none" stroke={colorMap[selectedDevice] || '#22c55e'}
                strokeWidth="2" strokeDasharray="5 3" opacity="0.5" />
            )}
            {/* History ghost dots */}
            {historyPts.map((p, i) => (
              <circle key={`h${i}`} cx={p.x} cy={p.y} r="3"
                fill={colorMap[selectedDevice] || '#22c55e'} opacity="0.25" />
            ))}
            {/* Device markers */}
            {locations.map((loc, i) => {
              const { x, y } = project(loc.latitude, loc.longitude, bounds, W, H);
              const color = colorMap[loc.device_name] || '#22c55e';
              const sel = loc.device_name === selectedDevice;
              return (
                <g key={loc.id || i} onClick={() => onSelectDevice(sel ? null : loc.device_name)}
                  style={{ cursor: 'pointer' }}>
                  {sel && (
                    <circle cx={x} cy={y} r="20" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4">
                      <animate attributeName="r" values="14;28;14" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={x} cy={y} r={sel ? 9 : 7} fill={color} />
                  <circle cx={x} cy={y} r="3" fill="white" />
                  <rect x={x+12} y={y-13} width={loc.device_name.length * 7 + 10} height="19" rx="4"
                    fill="rgba(0,0,0,0.75)" />
                  <text x={x+16} y={y-0.5} fontSize="11" fill={color} fontFamily="monospace" fontWeight="bold">
                    {loc.device_name}
                  </text>
                  <text x={x+16} y={y+13} fontSize="9" fill="#94a3b8" fontFamily="monospace">
                    {loc.latitude.toFixed(4)},{loc.longitude.toFixed(4)}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
        {/* Legend */}
        {locations.length > 0 && (
          <div className="absolute top-3 right-3 bg-gray-950/85 backdrop-blur rounded-lg p-3 space-y-1">
            {locations.map((loc, i) => (
              <button key={i}
                onClick={() => onSelectDevice(loc.device_name === selectedDevice ? null : loc.device_name)}
                className="flex items-center gap-2 text-xs hover:opacity-80 w-full text-left">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: colorMap[loc.device_name] }} />
                <span className={loc.device_name === selectedDevice ? 'text-white font-semibold' : 'text-gray-400'}>
                  {loc.device_name}
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="absolute bottom-3 left-3 bg-gray-950/80 backdrop-blur rounded px-2 py-1 text-xs text-gray-500 font-mono">
          [{bounds.minLat.toFixed(3)},{bounds.minLng.toFixed(3)}] → [{bounds.maxLat.toFixed(3)},{bounds.maxLng.toFixed(3)}]
        </div>
      </div>

      {locations.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {locations.map((loc, i) => {
            const color = colorMap[loc.device_name];
            const sel = loc.device_name === selectedDevice;
            const age = loc.created_date
              ? Math.floor((Date.now() - new Date(loc.created_date)) / 1000) : null;
            return (
              <button key={i} onClick={() => onSelectDevice(sel ? null : loc.device_name)}
                className={`rounded-xl p-3 border text-left transition-all ${
                  sel ? 'border-green-500/50 bg-green-500/10' : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-sm font-medium text-white truncate">{loc.device_name}</span>
                </div>
                <div className="text-xs text-gray-400 font-mono space-y-0.5">
                  <div>Lat: {loc.latitude.toFixed(5)}</div>
                  <div>Lng: {loc.longitude.toFixed(5)}</div>
                  {loc.speed != null && <div>Speed: {(loc.speed * 3.6).toFixed(1)} km/h</div>}
                  {age != null && <div className="text-gray-600">{age < 60 ? `${age}s ago` : `${Math.floor(age/60)}m ago`}</div>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
