"""
GPS Tracker Client
Runs on any Python 3.x device (Raspberry Pi, laptop, etc.)
Sends GPS coords to the server every N seconds.

Install:
    pip install requests
    pip install gpsd-py3   # only for real hardware GPS

Usage:
    python tracker.py --server http://localhost:5000 --device my-pi --simulate
    python tracker.py --server http://YOUR_SERVER  --device my-pi
"""

import requests
import time
import argparse
import math
import random
from datetime import datetime


def get_simulated_location(step, base_lat=51.505, base_lng=-0.09):
    angle = step * 0.05
    lat = base_lat + 0.005 * math.sin(angle)
    lng = base_lng + 0.005 * math.cos(angle)
    speed = random.uniform(0.5, 3.0)
    accuracy = random.uniform(3, 15)
    return lat, lng, speed, accuracy


def get_real_location():
    try:
        import gpsd
        gpsd.connect()
        packet = gpsd.get_current()
        return packet.lat, packet.lon, packet.hspeed, packet.position_precision()[0]
    except Exception as e:
        print(f'[GPS ERROR] {e}')
        return None


def send_location(server, device_id, lat, lng, speed, accuracy):
    payload = {
        'device_id': device_id,
        'lat': lat,
        'lng': lng,
        'speed': speed,
        'accuracy': accuracy,
        'timestamp': datetime.utcnow().isoformat()
    }
    try:
        r = requests.post(f'{server}/api/location', json=payload, timeout=5)
        r.raise_for_status()
        print(f'[{datetime.now():%H:%M:%S}] Sent lat={lat:.5f} lng={lng:.5f} speed={speed:.1f}m/s')
    except Exception as e:
        print(f'[ERROR] {e}')


def main():
    parser = argparse.ArgumentParser(description='GPS Tracker Client')
    parser.add_argument('--server',   default='http://localhost:5000')
    parser.add_argument('--device',   default='device-001')
    parser.add_argument('--interval', type=int, default=5)
    parser.add_argument('--simulate', action='store_true')
    args = parser.parse_args()

    print(f'Server  : {args.server}')
    print(f'Device  : {args.device}')
    print(f'Interval: {args.interval}s')
    print(f'Mode    : {"SIMULATED" if args.simulate else "REAL GPS"}')

    step = 0
    while True:
        if args.simulate:
            data = get_simulated_location(step)
        else:
            data = get_real_location()
            if data is None:
                time.sleep(args.interval)
                continue
        send_location(args.server, args.device, *data)
        step += 1
        time.sleep(args.interval)


if __name__ == '__main__':
    main()
