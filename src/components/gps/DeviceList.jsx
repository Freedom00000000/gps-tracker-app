import { Radio, MapPin, Clock, Zap, Activity } from 'lucide-react';

const DEVICE_COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];

export default function DeviceList({ devices = [], selectedDevice, onSelectDevice }) {
  if (!devices.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-600">
        <Radio className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-lg">No devices tracked yet</p>
        <p className="text-sm">Add a GPS point to register a device</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">{devices.length} Device{devices.length !== 1 ? 's' : ''} Online</h2>
        <div className="flex items-center gap-2 text-xs text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Live
        </div>
      </div>
      {devices.map((dev, i) => {
        const color = DEVICE_COLORS[i % DEVICE_COLORS.length];
        const isSelected = dev.device_name === selectedDevice;
        const age = dev.created_date ? Math.floor((Date.now() - new Date(dev.created_date)) / 1000) : null;
        const fresh = age !== null && age < 30;
        return (
          <button key={i} onClick={() => onSelectDevice(dev.device_name)}
            className={`w-full rounded-xl p-4 border text-left transition-all ${
              isSelected ? 'border-green-500/60 bg-green-500/10' : 'border-gray-800 bg-gray-900 hover:border-gray-600 hover:bg-gray-800/60'
            }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: `${color}22`, border: `1.5px solid ${color}` }}>
                  <Radio className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <div className="font-semibold text-white">{dev.device_name}</div>
                  <div className="text-xs text-gray-500 font-mono">
                    {dev.latitude.toFixed(5)}, {dev.longitude.toFixed(5)}
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className={`text-xs px-2 py-0.5 rounded-full ${
                  fresh ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                }`}>
                  {fresh ? 'Fresh' : age !== null ? (age < 60 ? `${age}s ago` : `${Math.floor(age/60)}m ago`) : 'Unknown'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
              {dev.speed != null && (
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-gray-500 mb-0.5">Speed</div>
                  <div className="text-white font-mono">{(dev.speed * 3.6).toFixed(1)} km/h</div>
                </div>
              )}
              {dev.altitude != null && (
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-gray-500 mb-0.5">Altitude</div>
                  <div className="text-white font-mono">{dev.altitude.toFixed(0)} m</div>
                </div>
              )}
              {dev.accuracy != null && (
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-gray-500 mb-0.5">Accuracy</div>
                  <div className="text-white font-mono">±{dev.accuracy.toFixed(0)} m</div>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
