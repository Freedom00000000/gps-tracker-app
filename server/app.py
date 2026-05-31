from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import os

app = Flask(__name__)
CORS(app)

# In-memory store (swap for SQLite/Postgres in prod)
trackers = {}  # { device_id: [{ lat, lng, timestamp, speed, accuracy }] }


@app.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'ok', 'time': datetime.utcnow().isoformat()})


@app.route('/api/location', methods=['POST'])
def update_location():
    """Device pushes its location here."""
    data = request.get_json()
    device_id = data.get('device_id', 'default')
    entry = {
        'lat': float(data['lat']),
        'lng': float(data['lng']),
        'timestamp': data.get('timestamp', datetime.utcnow().isoformat()),
        'speed': data.get('speed', 0),
        'accuracy': data.get('accuracy', 0),
    }
    if device_id not in trackers:
        trackers[device_id] = []
    trackers[device_id].append(entry)
    # Keep last 1000 points per device
    trackers[device_id] = trackers[device_id][-1000:]
    return jsonify({'status': 'ok', 'device_id': device_id})


@app.route('/api/location/<device_id>', methods=['GET'])
def get_location(device_id):
    """Get latest + history for a device."""
    history = trackers.get(device_id, [])
    if not history:
        return jsonify({'error': 'Device not found'}), 404
    return jsonify({
        'device_id': device_id,
        'latest': history[-1],
        'history': history,
        'total_points': len(history)
    })


@app.route('/api/devices', methods=['GET'])
def list_devices():
    """List all tracked devices."""
    result = []
    for device_id, history in trackers.items():
        if history:
            result.append({
                'device_id': device_id,
                'last_seen': history[-1]['timestamp'],
                'latest': history[-1],
                'point_count': len(history)
            })
    return jsonify(result)


@app.route('/api/location/<device_id>/clear', methods=['DELETE'])
def clear_history(device_id):
    """Clear history for a device."""
    trackers.pop(device_id, None)
    return jsonify({'status': 'cleared', 'device_id': device_id})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
