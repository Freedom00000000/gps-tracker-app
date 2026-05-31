import { useState, useEffect, useRef, useCallback } from 'react';
import { GpsLocation } from '../entities/GpsLocation';
import GpsMap from '../components/gps/GpsMap';
import DeviceList from '../components/gps/DeviceList';
import LocationHistory from '../components/gps/LocationHistory';
import ManualInput from '../components/gps/ManualInput';
import ApiDocs from '../components/gps/ApiDocs';
import { Satellite, Radio, MapPin, List, Plus, Code, RefreshCw, Wifi, WifiOff } from 'lucide-react';

export default function GpsTracker() {
  const [locations, setLocations] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [isLive, setIsLive] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const fetchLocations = useCallback(async () => {
    try {
      const data = await GpsLocation.list('-created_date', 200);
      setLocations(data || []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Fetch error:', e);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(fetchLocations, 5000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isLive, fetchLocations]);

  // Group latest location per device
  const latestPerDevice = Object.values(
    locations.reduce((acc, loc) => {
      if (!acc[loc.device_name] || new Date(loc.created_date) > new Date(acc[loc.device_name].created_date)) {
        acc[loc.device_name] = loc;
      }
      return acc;
    }, {})
  );

  const selectedHistory = selectedDevice
    ? locations.filter(l => l.device_name === selectedDevice).slice(0, 50)
    : [];

  const handleManualSubmit = async (entry) => {
    setLoading(true);
    try {
      await GpsLocation.create(entry);
      await fetchLocations();
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'map', label: 'Live Map', icon: MapPin },
    { id: 'devices', label: 'Devices', icon: Radio },
    { id: 'history', label: 'History', icon: List },
    { id: 'input', label: 'Add Point', icon: Plus },
    { id: 'api', label: 'API Docs', icon: Code },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Satellite className="w-6 h-6 text-gray-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">GPS Tracker</h1>
              <p className="text-xs text-gray-400">Real-time location monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lastRefresh && (
              <span className="text-xs text-gray-500">
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => setIsLive(v => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isLive
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              {isLive ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isLive ? 'Live' : 'Paused'}
            </button>
            <button
              onClick={fetchLocations}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-gray-900/50 border-b border-gray-800 px-6 py-2">
        <div className="flex gap-6 max-w-7xl mx-auto text-sm">
          <span className="text-gray-400">Devices: <span className="text-white font-medium">{latestPerDevice.length}</span></span>
          <span className="text-gray-400">Total Points: <span className="text-white font-medium">{locations.length}</span></span>
          {selectedDevice && (
            <span className="text-gray-400">Tracking: <span className="text-green-400 font-medium">{selectedDevice}</span></span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-1 max-w-7xl mx-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'map' && (
          <GpsMap
            locations={latestPerDevice}
            history={selectedHistory}
            selectedDevice={selectedDevice}
            onSelectDevice={setSelectedDevice}
          />
        )}
        {activeTab === 'devices' && (
          <DeviceList
            devices={latestPerDevice}
            selectedDevice={selectedDevice}
            onSelectDevice={(name) => { setSelectedDevice(name); setActiveTab('map'); }}
          />
        )}
        {activeTab === 'history' && (
          <LocationHistory
            locations={locations}
            selectedDevice={selectedDevice}
            onSelectDevice={setSelectedDevice}
          />
        )}
        {activeTab === 'input' && (
          <ManualInput onSubmit={handleManualSubmit} loading={loading} />
        )}
        {activeTab === 'api' && (
          <ApiDocs />
        )}
      </main>
    </div>
  );
}
