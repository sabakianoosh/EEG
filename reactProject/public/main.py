import serial
import csv
import time
from datetime import datetime

# ------------------ Configuration ------------------
PORT = '/dev/ttyACM1'   
BAUD_RATE = 57600       # TGAM usually outputs at 57600
TIMEOUT = 1

# CSV files
CSV_RAW = "raw_eeg.csv"
CSV_NOISE = "noise.csv"
CSV_ATTENTION = "attention.csv"
CSV_MEDITATION = "meditation.csv"
CSV_BRAINWAVES = "brainwaves.csv"

# ------------------ Helpers ------------------
def time():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def init_csv():
    """Create CSV files with headers if they don't exist"""
    with open(CSV_RAW, 'w', newline='') as f:
        csv.writer(f).writerow(["time", "Raw EEG"])
    with open(CSV_NOISE, 'w', newline='') as f:
        csv.writer(f).writerow(["time", "Poor Signal"])
    with open(CSV_ATTENTION, 'w', newline='') as f:
        csv.writer(f).writerow(["time", "attention"])
    with open(CSV_MEDITATION, 'w', newline='') as f:
        csv.writer(f).writerow(["time", "meditation"])
    with open(CSV_BRAINWAVES, 'w', newline='') as f:
        csv.writer(f).writerow(["time", "delta", "theta",
                                "low_alpha", "high_alpha",
                                "low_beta", "high_beta",
                                "low_gamma", "high_gamma"])

# ------------------ Packet Parser ------------------
def parse_payload(code, payload):
    ts = time()

    if code == 0x80:  # Raw EEG (2 bytes signed)
        raw_val = (payload[0] << 8) | payload[1]
        if raw_val >= 32768:  # signed conversion
            raw_val -= 65536
        with open(CSV_RAW, 'a', newline='') as f:
            csv.writer(f).writerow([ts, raw_val])

    elif code == 0x02:  # Poor Signal
        poor_signal = payload[0]
        with open(CSV_NOISE, 'a', newline='') as f:
            csv.writer(f).writerow([ts, poor_signal])

    elif code == 0x04:  # Attention
        attention = payload[0]
        with open(CSV_ATTENTION, 'a', newline='') as f:
            csv.writer(f).writerow([ts, attention])

    elif code == 0x05:  # Meditation
        meditation = payload[0]
        with open(CSV_MEDITATION, 'a', newline='') as f:
            csv.writer(f).writerow([ts, meditation])

    elif code == 0x83:  # EEG Power Bands (8 × 3 bytes = 24 bytes)
        values = []
        for i in range(0, 24, 3):
            val = (payload[i] << 16) | (payload[i+1] << 8) | payload[i+2]
            values.append(val)
        delta, theta, low_alpha, high_alpha, low_beta, high_beta, low_gamma, mid_gamma = values
        with open(CSV_BRAINWAVES, 'a', newline='') as f:
            csv.writer(f).writerow([ts, delta, theta,
                                    low_alpha, high_alpha,
                                    low_beta, high_beta,
                                    low_gamma, mid_gamma])

# ------------------ Main Loop ------------------
def run():
    init_csv()
    ser = serial.Serial(PORT, BAUD_RATE, timeout=TIMEOUT)

    # TGAM packets start with 0xAA 0xAA
    while True:
        try:
            if ser.read(1) == b'\xAA' and ser.read(1) == b'\xAA':
                pkt_len = ser.read(1)
                if not pkt_len:
                    continue
                pkt_len = ord(pkt_len)
                payload = ser.read(pkt_len)
                checksum = ser.read(1)  # (not used here)

                # Parse multi-byte payload
                i = 0
                while i < len(payload):
                    code = payload[i]
                    i += 1
                    if code >= 0x80:
                        vlen = payload[i]
                        i += 1
                        vdata = payload[i:i+vlen]
                        i += vlen
                        parse_payload(code, vdata)
                    else:
                        vlen = 1
                        vdata = payload[i:i+vlen]
                        i += vlen
                        parse_payload(code, vdata)

        except KeyboardInterrupt:
            print("Stopped by user")
            break
        except Exception as e:
            print("Error:", e)
            break

    ser.close()

# ------------------ Entry ------------------
if __name__ == "__main__":
    run()
