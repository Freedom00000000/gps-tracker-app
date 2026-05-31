"""
GPS Tracker Client — Wired to JARVIS gpsReceiver
Sends GPS coords directly to Base44 backend every N seconds.

Install:
    pip install requests
    pip install gpsd-py3   # only for real hardware GPS

Usage (simulated):
    python tracker.py --device my-pc --simulate

Usage (real GPS hardware):
    python tracker.py --device my-pi
"""

import requests
import time
import argparse
import math
import random
from datetime import datetime

# ── JARVIS gpsReceiver endpoint ──────────────────────────────────────────────
JARVIS_GPS_URL = "https://api.base44.com/api/apps/684aa4c9d1f0e04e8e1e5d8e/functions/gpsReceiver"
GPS_API_KEY    = "jarvis-gps-2026"   # set GPS_API_KEY env var or edit here
# ─────────────────────────────────────────────────────────────────────────────

import os
API_KEY = os.environ.get("GPS_API_KEY", GPS_API_KEY)


def get_simulated_location(step, base_lat=51.505, base_lng=-0.09):
    """Simulates movement in a circle around London."""
    angle = step * 0.05
    lat   = base_lat + 0.005 * math.sin(angle)
    lng   = base_lng + 0.005 * math.cos(angle)
    speed    = random.uniform(0.5, 3.0)
    accuracy = random.uniform(3, 15)
    altitude = random.uniform(10, 50)
    return lat, lng, speed, accuracy, altitude


def get_real_location():
    try:
        import gpsd
        gpsd.connect()
        packet = gpsd.get_current()
        return (
            packet.lat,
            packet.lon,
            packet.hspeed,
            packet.position_precision()[0],
            packet.alt if hasattr(packet, 'alt') else None
        )
    except Exception as e:
        print(f'[GPS ERROR] {e}')
        return None


def send_location(device_name, lat, lng, speed, accuracy, altitude):
    payload = {
        "device_name": device_name,
        "latitude":    lat,
        "longitude":   lng,
        "speed":       round(speed, 3),
        "accuracy":    round(accuracy, 2),
        "altitude":    round(altitude, 2) if altitude else None,
    }
    headers = {
        "Content-Type":  "application/json",
        "x-api-key":     API_KEY,
    }
    try:
        r = requests.post(JARVIS_GPS_URL, json=payload, headers=headers, timeout=10)
        r.raise_for_status()
        print(f'[{datetime.now():%H:%M:%S}] ✅ Sent → lat={lat:.5f} lng={lng:.5f} speed={speed:.2f}m/s')
    except Exception as e:
        print(f'[{datetime.now():%H:%M:%S}] ❌ ERROR: {e}')


def main():
    parser = argparse.ArgumentParser(description='GPS Tracker → JARVIS')
    parser.add_argument('--device',   default='device-001', help='Device name')
    parser.add_argument('--interval', type=int, default=5,  help='Ping interval in seconds')
    parser.add_argument('--simulate', action='store_true',  help='Use simulated GPS data')
    args = parser.parse_args()

    print(f'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    print(f'  JARVIS GPS Tracker')
    print(f'  Device  : {args.device}')
    print(f'  Interval: {args.interval}s')
    print(f'  Mode    : {"SIMULATED" if args.simulate else "REAL GPS"}')
    print(f'  Endpoint: {JARVIS_GPS_URL}')
    print(f'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    step = 0
    while True:
        if args.simulate:
            data = get_simulated_location(step)
        else:
            data = get_real_location()
            if data is None:
                time.sleep(args.interval)
                continue

        send_location(args.device, *data)
        step += 1
        time.sleep(args.interval)


if __name__ == '__main__':
    main()
