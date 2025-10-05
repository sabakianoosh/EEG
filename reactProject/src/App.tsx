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

type DataPoint = {
  time: number;
  alpha: number;
  beta: number;
  gamma: number;
  theta: number;
  delta: number;
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

  useEffect(() => {
    const t = setInterval(() => {
      setStream((s) => {
        const nextTime = s.length ? s[s.length - 1].time + 1 : 0;
        const newPoint: DataPoint = {
          time: nextTime,
          alpha: Math.random() * 100,
          beta: Math.random() * 100,
          gamma: Math.random() * 100,
          theta: Math.random() * 100,
          delta: Math.random() * 100,
        };
        return [...s.slice(-99), newPoint];
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setStream((s) => {
        const last10 = s.slice(-10);
        if (!last10.length) return s;

        const avgBeta = last10.reduce((a, p) => a + p.beta, 0) / last10.length;
        const avgGamma = last10.reduce((a, p) => a + p.gamma, 0) / last10.length;
        const avgAlpha = last10.reduce((a, p) => a + p.alpha, 0) / last10.length;
        const avgTheta = last10.reduce((a, p) => a + p.theta, 0) / last10.length;

        setAttention(Math.round(Math.min(100, (avgBeta + avgGamma) / 2)));
        setMeditation(Math.round(Math.min(100, (avgAlpha + avgTheta) / 2)));

        return s;
      });
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const chartData = useMemo(() => stream.slice(-30), [stream]);

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
                      <Line key={line} dataKey={line} stroke={color} dot={false} />
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
                  <div className="text-pink-300 font-medium truncate">{s.name}</div>
                  <div className="text-xs text-zinc-400">10–30 min · ambient</div>
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
