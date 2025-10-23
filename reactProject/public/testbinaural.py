import numpy as np
import sounddevice as sd
import time

def generate_binaural_tone(base_freq, beat_freq, duration_s=300, sample_rate=44100, amplitude=0.2):
    """
    Generate stereo signal with left = base_freq, right = base_freq + beat_freq
    """
    t = np.linspace(0, duration_s, int(sample_rate * duration_s), endpoint=False)
    left = amplitude * np.sin(2 * np.pi * base_freq * t)
    right = amplitude * np.sin(2 * np.pi * (base_freq + beat_freq) * t)
    stereo = np.column_stack((left, right))
    return stereo

def play_binaural(base_freq, beat_freq, duration_s=300):
    """
    Play one binaural tone for the given duration.
    """
    sr = 44100
    tone = generate_binaural_tone(base_freq, beat_freq, duration_s, sr)
    print(f"▶️ Playing {beat_freq} Hz beat ({duration_s/60:.0f} min)...")
    sd.play(tone, sr)
    sd.wait()
    sd.stop()
    print("✅ Done.\n")

if __name__ == "__main__":
    sessions = [
        ("Deep sleep / Delta", 3),   # 1–4 Hz
        ("Meditation / Theta", 6),   # 4–8 Hz
        ("Calm focus / Alpha", 10),  # 8–12 Hz
        ("Alert thinking / Beta", 20) # 13–30 Hz
    ]

    base_freq = 200   # carrier frequency for left ear
    duration_s = 300  # 5 minutes per session

    for name, beat in sessions:
        print(f"=== {name} ({beat} Hz) ===")
        play_binaural(base_freq, beat, duration_s)
        time.sleep(2)  # small pause between sessions


# systemctl --user restart pipewire pipewire-pulse
