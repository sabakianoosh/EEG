import pandas as pd
import matplotlib.pyplot as plt

# File paths
CSV_NOISE = "noise.csv"
CSV_ATTENTION = "attention.csv"
CSV_MEDITATION = "meditation.csv"
CSV_BRAINWAVES = "brainwaves.csv"

# ------------------ Plot Helpers ------------------
def plot_attention_meditation(att_file, med_file):
    df_att = pd.read_csv(att_file)
    df_med = pd.read_csv(med_file)

    plt.figure(figsize=(10, 4))
    plt.plot(df_att["time"], df_att["attention"], label="Attention", color="blue")
    plt.plot(df_med["time"], df_med["meditation"], label="Meditation", color="green")
    plt.title("Attention vs Meditation")
    plt.xlabel("Time")
    plt.ylabel("Level")
    plt.xticks(rotation=45)
    plt.legend()
    plt.tight_layout()
    plt.show()

def plot_noise(filename):
    df = pd.read_csv(filename)
    plt.figure(figsize=(10, 4))
    plt.plot(df["time"], df["Poor Signal"], label="Noise", color="red")
    plt.title("Poor Signal Quality")
    plt.xlabel("Time")
    plt.ylabel("Noise Level")
    plt.xticks(rotation=45)
    plt.legend()
    plt.tight_layout()
    plt.show()

def plot_brainwaves(filename):
    df = pd.read_csv(filename)
    plt.figure(figsize=(12, 6))
    for col in df.columns[1:]:  # skip Timestamp
        plt.plot(df["time"], df[col], label=col)
    plt.title("EEG Power Bands")
    plt.xlabel("Time")
    plt.ylabel("Value")
    plt.xticks(rotation=45)
    plt.legend()
    plt.tight_layout()
    plt.show()

# ------------------ Main ------------------
if __name__ == "__main__":
    plot_attention_meditation(CSV_ATTENTION, CSV_MEDITATION)
    plot_noise(CSV_NOISE)
    plot_brainwaves(CSV_BRAINWAVES)
