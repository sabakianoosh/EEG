import csv
import os
import time
import random
import threading
from datetime import datetime

# File paths
FILES = {
    "attention": "attention.csv",
    "brainwaves": "brainwaves.csv",
    "meditation": "meditation.csv"
}

# Create CSV files with headers if not exist
if not os.path.exists(FILES["attention"]):
    with open(FILES["attention"], "w", newline="") as f:
        csv.writer(f).writerow(["time", "attention"])

if not os.path.exists(FILES["brainwaves"]):
    with open(FILES["brainwaves"], "w", newline="") as f:
        csv.writer(f).writerow(["time", "delta", "theta", "low_alpha", "high_alpha", "low_beta", "high_beta", "low_gamma", "high_gamma"])

if not os.path.exists(FILES["meditation"]):
    with open(FILES["meditation"], "w", newline="") as f:
        csv.writer(f).writerow(["time", "meditation"])


def write_attention(period=0.3):
    while True:
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        attention_value = random.randint(0, 100)
        with open(FILES["attention"], "a", newline="") as f:
            csv.writer(f).writerow([now, attention_value])
        time.sleep(period)


def write_brainwaves(period=0.5):
    while True:
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        brainwave_values = [random.randint(1000, 1000000) for _ in range(8)]
        with open(FILES["brainwaves"], "a", newline="") as f:
            csv.writer(f).writerow([now] + brainwave_values)
        time.sleep(period)


def write_meditation(period=0.5):
    while True:
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        meditation_value = random.randint(0, 100)
        with open(FILES["meditation"], "a", newline="") as f:
            csv.writer(f).writerow([now, meditation_value])
        time.sleep(period)


# Create and start threads
t1 = threading.Thread(target=write_attention, args=(0.6,), daemon=True)
t2 = threading.Thread(target=write_brainwaves, args=(0.9,), daemon=True)
t3 = threading.Thread(target=write_meditation, args=(0.9,), daemon=True)

t1.start()
t2.start()
t3.start()

print("Writing random data in 3 threads... (Press Ctrl+C to stop)")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\nStopped writing data.")
