import React, { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Papa from "papaparse";

type DataPoint = {
  time: number;
  alpha: number;
  beta: number;
  gamma: number;
  theta: number;
  delta: number;
};

type AttentionData = {
  time: number;
  attention: number;
};

type MeditationData = {
  time: number;
  meditation: number;
};

type BrainwaveData = {
  time: number;
  alpha: number;
  beta: number;
  gamma: number;
  theta: number;
  delta: number;
};

const mockAttentionCSV: AttentionData[] = [
  { time: 0, attention: 60 },
  { time: 1, attention: 62 },
  { time: 2, attention: 64 },
  { time: 3, attention: 66 },
  { time: 4, attention: 68 },
  { time: 5, attention: 70 },
  { time: 6, attention: 72 },
  { time: 7, attention: 74 },
  { time: 8, attention: 76 },
  { time: 9, attention: 78 },
  { time: 10, attention: 80 },
];

const mockMeditationCSV: MeditationData[] = [
  { time: 0, meditation: 45 },
  { time: 1, meditation: 47 },
  { time: 2, meditation: 49 },
  { time: 3, meditation: 51 },
  { time: 4, meditation: 53 },
  { time: 5, meditation: 55 },
  { time: 6, meditation: 57 },
  { time: 7, meditation: 59 },
  { time: 8, meditation: 61 },
  { time: 9, meditation: 63 },
  { time: 10, meditation: 65 },
];

const mockBrainwavesCSV: BrainwaveData[] = [
  { time: 0, alpha: 25, beta: 30, gamma: 20, theta: 18, delta: 15 },
  { time: 1, alpha: 27, beta: 32, gamma: 21, theta: 20, delta: 16 },
  { time: 2, alpha: 26, beta: 31, gamma: 22, theta: 19, delta: 17 },
  { time: 3, alpha: 28, beta: 34, gamma: 23, theta: 21, delta: 18 },
  { time: 4, alpha: 30, beta: 36, gamma: 24, theta: 22, delta: 19 },
  { time: 5, alpha: 32, beta: 38, gamma: 25, theta: 23, delta: 20 },
  { time: 6, alpha: 31, beta: 40, gamma: 26, theta: 24, delta: 21 },
  { time: 7, alpha: 33, beta: 42, gamma: 27, theta: 25, delta: 22 },
  { time: 8, alpha: 35, beta: 44, gamma: 28, theta: 26, delta: 23 },
  { time: 9, alpha: 37, beta: 46, gamma: 29, theta: 27, delta: 24 },
  { time: 10, alpha: 39, beta: 48, gamma: 30, theta: 28, delta: 25 },
];

const calculateEMA = (data: number[], N: number) => {
  const alpha = 2 / (N + 1);
  let ema = data[0];

  for (let i = 1; i < data.length; i++) {
    ema = data[i] * alpha + ema * (1 - alpha);
  }

  return ema;
};

function CircularProgress({ label, value }: { label: string; value: number }) {
  // *** Increased size so it's clearly larger now ***
  const radius = 80; // was 60
  const stroke = 16; // was 12
  const normalized = Math.max(0, Math.min(100, value));
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* increased svg viewport so the circle is larger on screen */}
      <svg width="200" height="200" viewBox="0 0 200 200">
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" x2="1">
            <stop offset="0%" stopColor="#ff6bdc" />
            <stop offset="100%" stopColor="#6d5bff" />
          </linearGradient>
        </defs>
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="#222"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke={`url(#grad-${label})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="24" // was 20
          fill="#fff"
        >
          {Math.round(normalized)}%
        </text>
      </svg>
      <div className="text-sm text-zinc-300">{label}</div>
    </div>
  );
}

export default function App() {
  const [stream, setStream] = useState<DataPoint[]>(() =>
    Array.from({ length: 30 }, (_, i) => ({
      time: i,
      alpha: Math.random() * 80,
      beta: Math.random() * 80,
      gamma: Math.random() * 80,
      theta: Math.random() * 80,
      delta: Math.random() * 80,
    }))
  );

  const [attention, setAttention] = useState<number>(60);
  const [meditation, setMeditation] = useState<number>(45);
  const [playing, setPlaying] = useState<number | null>(null);

  const lineColors: Record<string, string> = {
    alpha: "#ff6bdc",
    beta: "#00e5ff",
    gamma: "#ff1493",
    theta: "#9370db",
    delta: "#4169e1",
  };

  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    alpha: true,
    beta: true,
    gamma: true,
    theta: true,
    delta: true,
  });

  // const fetchCSV = async (url: string) => {
  //   return new Promise<any[]>((resolve, reject) => {
  //     Papa.parse(url, {
  //       download: true,
  //       complete: (result) => {
  //         resolve(result.data);
  //       },
  //       error: reject,
  //     });
  //   });
  // };
  // Replace fetchCSV with mock data for testing purposes

  const fetchCSV = (url: string): Promise<AttentionData[] | MeditationData[] | BrainwaveData[] | undefined> => {
  console.log(url)
  if (url === "attention.csv") return Promise.resolve(mockAttentionCSV);
  if (url === "meditation.csv") return Promise.resolve(mockMeditationCSV);
  if (url === "brainwaves.csv") return Promise.resolve(mockBrainwavesCSV);
  return Promise.resolve(undefined);
  };

  const loadStreamData = async () => {
    const brainwaveData = await fetchCSV("brainwaves.csv");

    // Assuming brainwaves.csv has columns: time, alpha, beta, gamma, theta, delta
    const newStream: DataPoint[] = brainwaveData!.map((row: any) => ({
      time: row.time,
      alpha: row.alpha,
      beta: row.beta,
      gamma: row.gamma,
      theta: row.theta,
      delta: row.delta,
    }));

    setStream((prevStream) => [...prevStream.slice(-99), ...newStream]);
  };

  const loadAttentionData = async () => {
    const attentionData = await fetchCSV("attention.csv");

    // Get the last 5 data points for attention
    const lastFiveAttention = attentionData!
      .slice(-5)
      .map((row: any) => row.attention);

    // If there are fewer than 5 data points, calculate the average
    if (lastFiveAttention.length < 5) {
      const averageAttention =
        lastFiveAttention.reduce((sum, val) => sum + val, 0) /
        lastFiveAttention.length;
      setAttention(averageAttention); // Set the average value
    } else {
      // Otherwise, calculate the EMA
      const ema = calculateEMA(lastFiveAttention, 5);
      setAttention(ema); // Set the EMA value
    }
  };

  const loadMeditationData = async () => {
    const meditationData = await fetchCSV("meditation.csv");

    // Get the last 5 data points for meditation
    const lastFiveMeditation = meditationData!
      .slice(-5)
      .map((row: any) => row.meditation);

    // If there are fewer than 5 data points, calculate the average
    if (lastFiveMeditation.length < 5) {
      const averageMeditation =
        lastFiveMeditation.reduce((sum, val) => sum + val, 0) /
        lastFiveMeditation.length;
      setMeditation(averageMeditation); // Set the average value
    } else {
      // Otherwise, calculate the EMA
      const ema = calculateEMA(lastFiveMeditation, 5);
      setMeditation(ema); // Set the EMA value
    }
  };

  // useEffect(() => {
  //   const t = setInterval(() => {
  //     setStream((s) => {
  //       const nextTime = s.length ? s[s.length - 1].time + 1 : 0;
  //       const newPoint: DataPoint = {
  //         time: nextTime,
  //         alpha: Math.random() * 100,
  //         beta: Math.random() * 100,
  //         gamma: Math.random() * 100,
  //         theta: Math.random() * 100,
  //         delta: Math.random() * 100,
  //       };
  //       return [...s.slice(-99), newPoint];
  //     });
  //   }, 1000);
  //   return () => clearInterval(t);
  // }, []);

  // useEffect(() => {
  //   const id = setInterval(() => {
  //     setStream((s) => {
  //       const last10 = s.slice(-10);
  //       if (!last10.length) return s;

  //       const avgBeta = last10.reduce((a, p) => a + p.beta, 0) / last10.length;
  //       const avgGamma = last10.reduce((a, p) => a + p.gamma, 0) / last10.length;
  //       const avgAlpha = last10.reduce((a, p) => a + p.alpha, 0) / last10.length;
  //       const avgTheta = last10.reduce((a, p) => a + p.theta, 0) / last10.length;

  //       setAttention(Math.round(Math.min(100, (avgBeta + avgGamma) / 2)));
  //       setMeditation(Math.round(Math.min(100, (avgAlpha + avgTheta) / 2)));

  //       return s;
  //     });
  //   }, 10000);
  //   return () => clearInterval(id);
  // }, []);
  useEffect(() => {
    // Initial data load
    loadStreamData();
    loadAttentionData();
    loadMeditationData();

    // Set interval to update stream every second
    const streamInterval = setInterval(() => {
      loadStreamData();
    }, 1000); // 1 second interval for stream data

    // Set interval to update attention and meditation every 2 seconds
    const attentionInterval = setInterval(() => {
      loadAttentionData();
    }, 2000); // 2 seconds interval for attention data

    const meditationInterval = setInterval(() => {
      loadMeditationData();
    }, 2000); // 2 seconds interval for meditation data

    // Cleanup on component unmount
    return () => {
      clearInterval(streamInterval);
      clearInterval(attentionInterval);
      clearInterval(meditationInterval);
    };
  }, []); // Empty array ensures this effect runs once when the component mounts

  const chartData = stream.slice(-30);
  // const chartData = useMemo(() => stream.slice(-30), [stream]);

  const sounds = [
    { name: "Calm Focus", file: "/sounds/calm_focus.mp3" },
    { name: "Deep Sleep", file: "/sounds/deep_sleep.mp3" },
    { name: "Meditation", file: "/sounds/meditation.mp3" },
    { name: "Alert Thinking", file: "/sounds/alert_thinking.mp3" },
  ];

  const play = async (idx: number, file: string) => {
    try {
      setPlaying(idx);
      const a = new Audio(file);
      await a.play();
      a.onended = () => setPlaying(null);
    } catch {
      setPlaying(null);
    }
  };

  const toggleLine = (line: string) => {
    setVisibleLines((v) => ({ ...v, [line]: !v[line] }));
  };

  return (
    /* 
      Minimal, targeted changes:
        - kept the overall layout and structure intact
        - increased circle size (above)
        - added right padding on the sound text block so the icon sits farther right (pr-8)
    */
    <div className="min-h-screen w-screen bg-black text-white flex flex-col items-stretch justify-start px-2 py-4">
      <div className="w-full max-w-none mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl box-border">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-pink-400">
          Brainwave Dashboard
        </h1>

        <div className="flex flex-row items-start justify-center gap-12">
          {/* Chart */}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-center mb-4 text-purple-300">
              Brainwave Frequencies
            </h2>

            <div className="flex gap-2 flex-wrap mb-4 justify-center">
              {Object.keys(visibleLines).map((line) => (
                <button
                  key={line}
                  onClick={() => toggleLine(line)}
                  className="px-4 py-2 rounded-full text-sm font-medium border-2"
                  style={{
                    backgroundColor: visibleLines[line]
                      ? lineColors[line]
                      : "#374151",
                    borderColor: visibleLines[line]
                      ? lineColors[line]
                      : "#4b5563",
                    color: visibleLines[line] ? "#000" : "#9ca3af",
                  }}
                >
                  {line.charAt(0).toUpperCase() + line.slice(1)}
                </button>
              ))}
            </div>

            {/* chart height kept smaller to avoid forcing scroll */}
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                  <XAxis dataKey="time" stroke="#888" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  {Object.entries(lineColors).map(([line, color]) =>
                    visibleLines[line] ? (
                      <Line
                        key={line}
                        dataKey={line}
                        stroke={color}
                        dot={false}
                      />
                    ) : null
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Circles */}
          <div className="flex flex-col gap-8 justify-center items-center">
            <CircularProgress label="Attention" value={attention} />
            <CircularProgress label="Meditation" value={meditation} />
          </div>
        </div>

        {/* Sounds */}
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto mt-12">
          <h3 className="text-xl font-semibold text-purple-400 mb-2 text-center">
            Sound Therapy
          </h3>
          <div className="grid grid-cols-2 gap-2 w-full">
            {sounds.map((s, i) => (
              <div
                key={s.name}
                className="flex items-center justify-between bg-zinc-800 p-4 rounded-2xl"
              >
                {/* Added pr-8 so the icon is farther from the text (only change here) */}
                <div className="min-w-0 pr-8">
                  <div className="text-pink-300 font-medium truncate">
                    {s.name}
                  </div>
                  <div className="text-xs text-zinc-400">
                    10–30 min · ambient
                  </div>
                </div>
                <button
                  onClick={() => play(i, s.file)}
                  className={`p-2 rounded-full border border-zinc-600 hover:bg-zinc-700 transition-colors ${
                    playing === i ? "bg-purple-600" : ""
                  }`}
                >
                  <Play className="w-5 h-5 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
