import numpy as np
import sounddevice as sd

def generate_binaural_tone(freq_left, freq_right, duration_s=10, sample_rate=44100, amplitude=0.2):
    """
    Returns a stereo NumPy array (shape: [samples, 2]) with left and right sine waves.
    """
    t = np.linspace(0, duration_s, int(sample_rate * duration_s), endpoint=False)
    left = amplitude * np.sin(2 * np.pi * freq_left * t)
    right = amplitude * np.sin(2 * np.pi * freq_right * t)
    stereo = np.vstack((left, right)).T  # shape (N, 2)
    return stereo

def play_binaural(freq_left, freq_right, duration_s=10):
    sr = 44100
    tone = generate_binaural_tone(freq_left, freq_right, duration_s, sr)
    sd.play(tone, sr)
    sd.wait()   # ✅ wait until playback finishes
    sd.stop()   # ✅ ensure device is released

if __name__ == "__main__":
    # Example: 200 Hz to left ear, 210 Hz to right ear, 30 seconds
    play_binaural(200, 210, duration_s=300)  # ⬅️ reduced from 300 for testing
