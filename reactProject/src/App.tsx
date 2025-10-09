import React, { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

type DataPoint = {
  time: string;
  high_alpha: number;
  low_alpha: number;
  high_beta: number;
  low_beta: number;
  high_gamma: number;
  low_gamma: number;
  theta: number;
  delta: number;
};

const SERIES_NAMES = [
  "time",
  "high_alpha",
  "low_alpha",
  "high_beta",
  "low_beta",
  "high_gamma",
  "low_gamma",
  "theta",
  "delta",
];

const lineColors: Record<string, string> = {
  high_alpha: "#ff6bdc",
  low_alpha: "#84ec5dff",
  high_beta: "#00e5ff",
  low_beta: "#fff236ff",
  high_gamma: "#ff1493",
  low_gamma: "#1cdaadff",
  theta: "#9370db",
  delta: "#4169e1",
};

const fetchCSV = async (url: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (result) => resolve(result.data),
      error: (err) => reject(err),
    });
  });
};

function CircularProgress({ label, value }: { label: string; value: number }) {
  const radius = 80;
  const stroke = 16;
  const normalized = Math.max(0, Math.min(100, value));
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" x2="1">
            <stop offset="0%" stopColor="#ff6bdc" />
            <stop offset="100%" stopColor="#6d5bff" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={radius} stroke="#222" strokeWidth={stroke} fill="none" />
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
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="24" fill="#fff">
          {Math.round(normalized)}%
        </text>
      </svg>
      <div className="text-sm text-zinc-300">{label}</div>
    </div>
  );
}

export default function App() {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const uRef = useRef<uPlot | null>(null);

  // rawDataRef stores the raw numeric arrays (time in seconds, and series arrays).
  const rawDataRef = useRef<number[][]>([]);

  const [attention, setAttention] = useState<number>(0);
  const [meditation, setMeditation] = useState<number>(0);
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    high_alpha: true,
    low_alpha: true,
    high_beta: true,
    low_beta: true,
    high_gamma: true,
    low_gamma: true,
    theta: true,
    delta: true,
  });

  const MAX_POINTS = 200;

  // Initialize rawDataRef with empty arrays (one per series name)
  useEffect(() => {
    rawDataRef.current = SERIES_NAMES.map(() => []);
  }, []);

  const buildDisplayData = () => {
    // Build arrays where hidden series are replaced with NaN so uPlot will not draw them
    const display = rawDataRef.current.map((arr, idx) => {
      if (idx === 0) return arr; // x axis (time) always present
      const name = SERIES_NAMES[idx];
      if (name && !visibleLines[name]) {
        // return an array of NaNs with same length
        return arr.map(() => NaN);
      }
      return arr;
    });

    return display;
  };

  const ensureChart = () => {
    if (uRef.current || !chartRef.current) return;

    const series: any[] = [
      { label: "time" },
      { label: "high_alpha", stroke: lineColors.high_alpha, width: 2 },
      { label: "low_alpha", stroke: lineColors.low_alpha, width: 2 },
      { label: "high_beta", stroke: lineColors.high_beta, width: 2 },
      { label: "low_beta", stroke: lineColors.low_beta, width: 2 },
      { label: "high_gamma", stroke: lineColors.high_gamma, width: 2 },
      { label: "low_gamma", stroke: lineColors.low_gamma, width: 2 },
      { label: "theta", stroke: lineColors.theta, width: 2 },
      { label: "delta", stroke: lineColors.delta, width: 2 },
    ];

    const opts: any = {
      width: chartRef.current.clientWidth || 600,
      height: 320,
      scales: { x: { time: true } },
      series,
      axes: [
        {
          stroke: "#333",
          grid: { show: false },
          values: (self: any, ticks: number[]) => ticks.map((t) => new Date(t * 1000).toLocaleTimeString()),
        },
        { stroke: "#333" },
      ],
      hooks: {},
      legend: {
        show: false,
      },
    };

    // initial minimal data: one point so uPlot can instantiate safely
    const now = Date.now() / 1000;
    const initialDisplay = SERIES_NAMES.map((s, i) => (i === 0 ? [now] : [NaN]));

    uRef.current = new uPlot(opts, initialDisplay as any, chartRef.current);
  };

  // Call ensureChart once on mount
  useEffect(() => {
    ensureChart();
    // Re-create chart on resize to adjust width
    const onResize = () => {
      if (!uRef.current || !chartRef.current) return;
      uRef.current.setSize({ width: chartRef.current.clientWidth, height: 320 });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load and append streaming data (reads CSV repeatedly and appends new rows)
  const loadStreamData = async () => {
    const brainwaveData = await fetchCSV("brainwaves.csv");
    if (!brainwaveData || brainwaveData.length === 0) return;

    // Filter out empty rows
    const validData: DataPoint[] = brainwaveData.filter((row: any) => row.time && String(row.time).trim() !== "");

    // Find last timestamp we have in rawDataRef
    const lastTime = rawDataRef.current[0].length
      ? rawDataRef.current[0][rawDataRef.current[0].length - 1]
      : 0;

    const newPoints = validData
      .map((r: any) => ({
        time: new Date(r.time).getTime() / 1000, // uPlot uses seconds
        high_alpha: Number(r.high_alpha),
        low_alpha: Number(r.low_alpha),
        high_beta: Number(r.high_beta),
        low_beta: Number(r.low_beta),
        high_gamma: Number(r.high_gamma),
        low_gamma: Number(r.low_gamma),
        theta: Number(r.theta),
        delta: Number(r.delta),
      }))
      .filter((p: any) => p.time > lastTime);

    if (newPoints.length === 0) return;

    // Append into rawDataRef (time + series arrays). Keep raw values so toggling works.
    for (const p of newPoints) {
      // time
      rawDataRef.current[0].push(p.time);
      rawDataRef.current[1].push(p.high_alpha);
      rawDataRef.current[2].push(p.low_alpha);
      rawDataRef.current[3].push(p.high_beta);
      rawDataRef.current[4].push(p.low_beta);
      rawDataRef.current[5].push(p.high_gamma);
      rawDataRef.current[6].push(p.low_gamma);
      rawDataRef.current[7].push(p.theta);
      rawDataRef.current[8].push(p.delta);

      // trim to MAX_POINTS
      if (rawDataRef.current[0].length > MAX_POINTS) {
        rawDataRef.current.forEach((arr) => arr.shift());
      }
    }

    // Build displayed data (apply visible toggle -> NaN for hidden)
    const display = buildDisplayData();

    // Update uPlot in-place without recreating it
    if (uRef.current) {
      uRef.current.setData(display as any);
    }
  };

  const calculateEMA = (data: number[], N: number) => {
    if (!data || data.length === 0) return 0;
    const alpha = 2 / (N + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = data[i] * alpha + ema * (1 - alpha);
    }
    return ema;
  };

  const loadAttentionData = async () => {
    const attentionData = await fetchCSV("attention.csv");
    if (!attentionData || attentionData.length === 0) return;

    const lastFive = attentionData.slice(-6).slice(0, 4).map((r: any) => Number(r.attention));
    if (lastFive.length < 5) {
      const average = lastFive.reduce((s, v) => s + v, 0) / lastFive.length;
      setAttention(average || 0);
    } else {
      setAttention(calculateEMA(lastFive, 5));
    }
  };

  const loadMeditationData = async () => {
    const meditationData = await fetchCSV("meditation.csv");
    if (!meditationData || meditationData.length === 0) return;

    const lastFive = meditationData.slice(-6).slice(0, 4).map((r: any) => Number(r.meditation));
    if (lastFive.length < 5) {
      const average = lastFive.reduce((s, v) => s + v, 0) / lastFive.length;
      setMeditation(average || 0);
    } else {
      setMeditation(calculateEMA(lastFive, 5));
    }
  };

  useEffect(() => {
    // Initial loads
    loadStreamData();
    loadAttentionData();
    loadMeditationData();

    // Intervals
    const streamInterval = setInterval(() => loadStreamData(), 1000);
    const attentionInterval = setInterval(() => loadAttentionData(), 500);
    const meditationInterval = setInterval(() => loadMeditationData(), 500);

    return () => {
      clearInterval(streamInterval);
      clearInterval(attentionInterval);
      clearInterval(meditationInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleLine = (line: string) => {
    setVisibleLines((v) => {
      const next = { ...v, [line]: !v[line] };
      // Immediately update displayed uPlot data so the change is instant
      const display = rawDataRef.current.map((arr, idx) => {
        if (idx === 0) return arr;
        const name = SERIES_NAMES[idx];
        if (name && !next[name]) return arr.map(() => NaN);
        return arr;
      });
      if (uRef.current) uRef.current.setData(display as any);
      return next;
    });
  };

  const sounds = [
    { name: "Calm Focus", file: "/sounds/calm_focus.mp3" },
    { name: "Deep Sleep", file: "/sounds/deep_sleep.mp3" },
    { name: "Meditation", file: "/sounds/meditation.mp3" },
    { name: "Alert Thinking", file: "/sounds/alert_thinking.mp3" },
  ];

  const play = async (file: string) => {
    try {
      const a = new Audio(file);
      await a.play();
    } catch {}
  };

  return (
    <div className="min-h-screen w-screen bg-black text-white flex flex-col items-stretch justify-start px-2 py-4">
      <div className="w-full max-w-none mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl box-border">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-pink-400">Brainwave Dashboard</h1>

        <div className="flex flex-row items-start justify-center gap-12">
          {/* Chart */}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-center mb-4 text-purple-300">Brainwave Frequencies</h2>

            <div className="flex gap-2 flex-wrap mb-4 justify-center">
              {Object.keys(visibleLines).map((line) => (
                <button
                  key={line}
                  onClick={() => toggleLine(line)}
                  className="px-4 py-2 rounded-full text-sm font-medium border-2"
                  style={{
                    backgroundColor: visibleLines[line] ? lineColors[line] : "#374151",
                    borderColor: visibleLines[line] ? lineColors[line] : "#4b5563",
                    color: visibleLines[line] ? "#000" : "#9ca3af",
                  }}
                >
                  {line.charAt(0).toUpperCase() + line.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ width: "100%", height: 320 }}>
              {/* container for uPlot chart. uPlot will render directly into this div and will be updated in-place */}
              <div ref={chartRef} />
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
          <h3 className="text-xl font-semibold text-purple-400 mb-2 text-center">Sound Therapy</h3>
          <div className="grid grid-cols-2 gap-2 w-full">
            {sounds.map((s) => (
              <div key={s.name} className="flex items-center justify-between bg-zinc-800 p-4 rounded-2xl">
                <div className="min-w-0 pr-8">
                  <div className="text-pink-300 font-medium truncate">{s.name}</div>
                  <div className="text-xs text-zinc-400">10–30 min · ambient</div>
                </div>
                <button onClick={() => play(s.file)} className={`p-2 rounded-full border border-zinc-600 hover:bg-zinc-700 transition-colors`}>
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none"><path d="M5 3v18l15-9L5 3z" fill="currentColor"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
