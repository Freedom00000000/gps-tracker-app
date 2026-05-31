import { useState } from 'react';
import { MapPin, Send, Loader, Navigation, Crosshair } from 'lucide-react';

export default function ManualInput({ onSubmit, loading }) {
  const [form, setForm] = useState({ device_name: '', latitude: '', longitude: '', accuracy: '', altitude: '', speed: '' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [detecting, setDetecting] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const detectLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
          accuracy: pos.coords.accuracy?.toFixed(1) || '',
          altitude: pos.coords.altitude?.toFixed(1) || '',
          speed: pos.coords.speed?.toFixed(2) || '',
        }));
        setDetecting(false);
      },
      err => { setError(`GPS: ${err.message}`); setDetecting(false); }
    );
  };

  const handleSubmit = async e => {
    e.preventDefault(); setError('');
    if (!form.device_name.trim()) { setError('Device name required'); return; }
    const lat = parseFloat(form.latitude), lng = parseFloat(form.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) { setError('Invalid latitude'); return; }
    if (isNaN(lng) || lng < -180 || lng > 180) { setError('Invalid longitude'); return; }
    try {
      await onSubmit({
        device_name: form.device_name.trim(), latitude: lat, longitude: lng,
        accuracy: form.accuracy ? parseFloat(form.accuracy) : null,
        altitude: form.altitude ? parseFloat(form.altitude) : null,
        speed: form.speed ? parseFloat(form.speed) : null,
      });
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
      setForm(f => ({ ...f, latitude: '', longitude: '', accuracy: '', altitude: '', speed: '' }));
    } catch (err) { setError(err.message); }
  };

  const presets = [
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Add GPS Point</h2>
            <p className="text-sm text-gray-500">Inject a location into the tracker</p>
          </div>
        </div>
        <button type="button" onClick={detectLocation} disabled={detecting}
          className="flex items-center gap-2 px-4 py-2 mb-6 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white rounded-lg text-sm font-medium transition-colors">
          {detecting ? <Loader className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
          {detecting ? 'Detecting...' : 'Use My Location'}
        </button>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Device Name *</label>
            <input type="text" value={form.device_name} onChange={e => set('device_name', e.target.value)}
              placeholder="phone-01, truck-A, drone-1"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Latitude *</label>
              <input type="number" step="any" value={form.latitude} onChange={e => set('latitude', e.target.value)}
                placeholder="-90 to 90" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Longitude *</label>
              <input type="number" step="any" value={form.longitude} onChange={e => set('longitude', e.target.value)}
                placeholder="-180 to 180" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['accuracy','altitude','speed'].map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-400 mb-1 capitalize">{field} {field==='accuracy'?'(m)':field==='altitude'?'(m)':'(m/s)'}</label>
                <input type="number" step="any" value={form[field]} onChange={e => set(field, e.target.value)}
                  placeholder="Optional" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none" />
              </div>
            ))}
          </div>
          {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
          {success && <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">✓ Location added!</div>}
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-green-900 text-white rounded-lg py-2.5 font-medium transition-colors">
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Saving...' : 'Add Location'}
          </button>
        </form>
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Quick City Presets</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {presets.map(p => (
            <button key={p.name} onClick={() => setForm(f => ({ ...f, latitude: p.lat.toString(), longitude: p.lng.toString() }))}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors text-left">
              <Navigation className="w-3 h-3 text-green-400 flex-shrink-0" />
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
