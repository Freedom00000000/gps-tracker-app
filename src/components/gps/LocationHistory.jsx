import { useState } from 'react';
import { List, Filter, Download, Trash2 } from 'lucide-react';

export default function LocationHistory({ locations = [], selectedDevice, onSelectDevice }) {
  const [filterDevice, setFilterDevice] = useState(selectedDevice || '');
  const [limit, setLimit] = useState(50);

  const deviceNames = [...new Set(locations.map(l => l.device_name))];
  const filtered = filterDevice
    ? locations.filter(l => l.device_name === filterDevice)
    : locations;
  const shown = filtered.slice(0, limit);

  const exportCsv = () => {
    const headers = 'device_name,latitude,longitude,accuracy,altitude,speed,timestamp';
    const rows = filtered.map(l =>
      `${l.device_name},${l.latitude},${l.longitude},${l.accuracy||''},${l.altitude||''},${l.speed||''},${l.created_date||''}`
    );
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'gps-history.csv'; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Location History <span className="text-gray-500 text-sm font-normal">({filtered.length} points)</span>
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={filterDevice}
            onChange={e => { setFilterDevice(e.target.value); onSelectDevice(e.target.value || null); }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500"
          >
            <option value="">All Devices</option>
            {deviceNames.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <List className="w-12 h-12 mb-4 opacity-30" />
          <p>No location data</p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/80">
                  {['Device','Latitude','Longitude','Accuracy','Altitude','Speed','Time'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((loc, i) => {
                  const age = loc.created_date
                    ? Math.floor((Date.now() - new Date(loc.created_date)) / 1000) : null;
                  return (
                    <tr key={loc.id || i}
                      onClick={() => onSelectDevice(loc.device_name)}
                      className="border-b border-gray-800/50 hover:bg-gray-800/40 cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-medium text-green-400">{loc.device_name}</td>
                      <td className="px-4 py-3 font-mono text-gray-300">{loc.latitude.toFixed(6)}</td>
                      <td className="px-4 py-3 font-mono text-gray-300">{loc.longitude.toFixed(6)}</td>
                      <td className="px-4 py-3 text-gray-400">{loc.accuracy != null ? `±${loc.accuracy.toFixed(0)}m` : '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{loc.altitude != null ? `${loc.altitude.toFixed(0)}m` : '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{loc.speed != null ? `${(loc.speed*3.6).toFixed(1)} km/h` : '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {age != null ? (age < 60 ? `${age}s ago` : age < 3600 ? `${Math.floor(age/60)}m ago` : `${Math.floor(age/3600)}h ago`) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > limit && (
            <div className="text-center py-3 border-t border-gray-800">
              <button onClick={() => setLimit(l => l + 50)}
                className="text-sm text-green-400 hover:text-green-300 transition-colors">
                Load more ({filtered.length - limit} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
