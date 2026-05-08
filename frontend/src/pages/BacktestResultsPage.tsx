import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Zap } from 'lucide-react';
import { useSaveStrategy } from '../api/useAuth';
import { useStrategy } from '../contexts/StrategyContext';
import { useState, useRef, useEffect, useMemo } from 'react';
import { api } from '../api/index';
import {
  createChart,
  ColorType,
  AreaSeries,
  CandlestickSeries,
  createSeriesMarkers,
  type UTCTimestamp,
  type SeriesMarker,
} from 'lightweight-charts';

interface CandleData {
  index: number;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
}

interface PositionData {
  id: number;
  side: string;
  entry_index: number;
  exit_index: number;
  entry_time: string | null;
  exit_time: string | null;
  entry_price: number;
  exit_price: number;
  lot_size: number;
  pnl: number;
  return_pct: number;
  duration_bars: number;
  exit_reason?: string | null;
}

interface BacktestData {
  pnl: number;
  avg_returns: number;
  time_in_years: number;
  total_time_in_market_bars: number;
  total_time_in_market_years: number;
  cagr: number;
  max_drawdown: number;
  avg_drawdown: number;
  calmar: number;
  volatility: number;
  sharpe_ratio: number;
  annual_sharpe: number;
  downside_deviation: number;
  sortino: number;
  annual_sortino: number;
  number_of_trades: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  profit_factor: number;
  expectancy: number;
  avg_trade_duration: number;
  exposure: number;
  deployment_score?: number;
  dates?: string[] | null;
  equity_evolution: number[];
  positions?: string[];
  position_data?: PositionData[];
  candles?: CandleData[];
}

interface LocationState {
  results: BacktestData;
  strategy: {
    NAME: string;
    TICKER: string;
    TIMEFRAME: string;
    DIRECTION: string;
    ENTRY: string;
    EXIT: string;
    SIZE: string;
    SL: string;
    TP: string;
  };
}

const StatCard = ({ label, value, color = 'blue' }: { label: string; value: string | number; color?: 'green' | 'red' | 'blue' | 'amber' }) => {
  const colorClass = {
    green: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    red: 'bg-red-500/10 border-red-500/30 text-red-300',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-300'
  }[color];

  return (
    <div className={`p-4 rounded-lg border ${colorClass}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

type ParsedPosition = {
  side: string;
  openDateRaw: string;
  exitDateRaw: string;
  openPrice: number;
  exitPrice: number;
  pnl: number;
};

type ChartPosition = {
  id: number;
  side: string;
  entryIndex: number | null;
  exitIndex: number | null;
  entryTimeRaw: string | null;
  exitTimeRaw: string | null;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  returnPct?: number;
  durationBars?: number;
  exitReason?: string | null;
};

type HoverInfo = {
  x: number;
  y: number;
  time: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  value?: number;
};

const parsePositionString = (position: string): ParsedPosition | null => {
  const match = position.match(
    /^Position\(([^)]+)\)\s*\|\s*Open:\s*(.*?)\s*@\s*([\d.-]+)\s*\|\s*Exit:\s*(.*?)\s*@\s*([\d.-]+)\s*\|\s*PNL:\s*([\d.-]+)/
  );
  if (!match) return null;
  const side = match[1].trim();
  const openDateRaw = match[2].trim();
  const openPrice = Number.parseFloat(match[3]);
  const exitDateRaw = match[4].trim();
  const exitPrice = Number.parseFloat(match[5]);
  const pnl = Number.parseFloat(match[6]);
  if (!Number.isFinite(openPrice) || !Number.isFinite(exitPrice) || !Number.isFinite(pnl)) return null;
  return { side, openDateRaw, exitDateRaw, openPrice, exitPrice, pnl };
};

const normalizePositions = (
  positionData: PositionData[] | undefined,
  legacyPositions: string[] | undefined
): ChartPosition[] => {
  if (positionData && positionData.length > 0) {
    return positionData.map((position) => ({
      id: position.id,
      side: position.side,
      entryIndex: position.entry_index,
      exitIndex: position.exit_index,
      entryTimeRaw: position.entry_time,
      exitTimeRaw: position.exit_time,
      entryPrice: position.entry_price,
      exitPrice: position.exit_price,
      pnl: position.pnl,
      returnPct: position.return_pct,
      durationBars: position.duration_bars,
      exitReason: position.exit_reason,
    }));
  }

  return (legacyPositions ?? [])
    .map((position, index) => {
      const parsed = parsePositionString(position);
      if (!parsed) return null;
      return {
        id: index + 1,
        side: parsed.side,
        entryIndex: null,
        exitIndex: null,
        entryTimeRaw: parsed.openDateRaw,
        exitTimeRaw: parsed.exitDateRaw,
        entryPrice: parsed.openPrice,
        exitPrice: parsed.exitPrice,
        pnl: parsed.pnl,
      };
    })
    .filter(Boolean) as ChartPosition[];
};

const normalizeDateStringForJS = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'N/A') return null;
  // Pandas often returns "YYYY-MM-DD HH:MM:SS"; JS Date parses ISO more reliably.
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(trimmed)) {
    return trimmed.replace(' ', 'T');
  }
  return trimmed;
};

const toUtcTimestamp = (rawDate: string): UTCTimestamp | null => {
  const normalized = normalizeDateStringForJS(rawDate);
  if (!normalized) return null;
  const ms = Date.parse(normalized);
  if (!Number.isFinite(ms)) return null;
  return Math.floor(ms / 1000) as UTCTimestamp;
};

const timeframeToSeconds = (timeframe: string | undefined): number => {
  const tf = (timeframe ?? '').trim().toLowerCase();
  const match = tf.match(/^(\d+)(m|h|d|w)$/);
  if (!match) return 86400;
  const n = Number.parseInt(match[1], 10);
  const unit = match[2];
  if (!Number.isFinite(n) || n <= 0) return 86400;
  switch (unit) {
    case 'm':
      return n * 60;
    case 'h':
      return n * 60 * 60;
    case 'd':
      return n * 60 * 60 * 24;
    case 'w':
      return n * 60 * 60 * 24 * 7;
    default:
      return 86400;
  }
};

const nearestTime = (target: UTCTimestamp, times: UTCTimestamp[]): UTCTimestamp => {
  if (times.length === 0) return target;
  let best = times[0];
  let bestDist = Math.abs((best as unknown as number) - (target as unknown as number));
  for (let i = 1; i < times.length; i++) {
    const dist = Math.abs((times[i] as unknown as number) - (target as unknown as number));
    if (dist < bestDist) {
      bestDist = dist;
      best = times[i];
    }
  }
  return best;
};

const getIndexedTime = (
  index: number | null,
  rawTime: string | null,
  times: UTCTimestamp[]
): UTCTimestamp | null => {
  if (index !== null && index >= 0 && index < times.length) {
    return times[index];
  }

  if (rawTime) {
    const timestamp = toUtcTimestamp(rawTime);
    return timestamp ? nearestTime(timestamp, times) : null;
  }

  return null;
};

const exitReasonLabel = (reason: string | null | undefined) => reason || 'Exit';

const exitReasonClass = (reason: string | null | undefined) => {
  const normalized = (reason ?? '').toLowerCase();
  if (normalized.includes('take profit')) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
  if (normalized.includes('stop loss')) return 'bg-red-500/10 border-red-500/30 text-red-300';
  if (normalized.includes('signal')) return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
  return 'bg-slate-500/10 border-slate-500/30 text-slate-300';
};

const exitMarkerColor = (reason: string | null | undefined, isWin: boolean) => {
  const normalized = (reason ?? '').toLowerCase();
  if (normalized.includes('take profit')) return '#22c55e';
  if (normalized.includes('stop loss')) return '#ef4444';
  if (normalized.includes('signal')) return '#60a5fa';
  return isWin ? '#34d399' : '#f87171';
};

const TradingViewBacktestChart = ({
  equity,
  dates,
  positions,
  positionData,
  candles,
  timeframe,
}: {
  equity: number[];
  dates: string[] | null | undefined;
  positions: string[] | undefined;
  positionData: PositionData[] | undefined;
  candles: CandleData[] | undefined;
  timeframe: string | undefined;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<any>(null);
  const markersRef = useRef<ReturnType<typeof createSeriesMarkers> | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const { seriesData, seriesTimes, markers, isPriceChart } = useMemo(() => {
    const validCandles = (candles ?? []).filter((c) => (
      Number.isFinite(c.open) &&
      Number.isFinite(c.high) &&
      Number.isFinite(c.low) &&
      Number.isFinite(c.close)
    ));

    if (validCandles.length > 0) {
      const times: UTCTimestamp[] = [];
      const data = validCandles.map((c, index) => {
        const parsedTime = toUtcTimestamp(c.time);
        const fallbackBase = Math.floor(Date.now() / 1000) - (validCandles.length - 1) * timeframeToSeconds(timeframe);
        const time = parsedTime ?? (fallbackBase + index * timeframeToSeconds(timeframe)) as UTCTimestamp;
        times.push(time);
        return {
          time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        };
      });

      const normalizedPositions = normalizePositions(positionData, positions);
      const m: SeriesMarker<UTCTimestamp>[] = [];

      normalizedPositions.forEach((p) => {
        const entryTime = getIndexedTime(p.entryIndex, p.entryTimeRaw, times);
        const exitTime = getIndexedTime(p.exitIndex, p.exitTimeRaw, times);
        const isLong = p.side.toUpperCase() === 'LONG';
        const isWin = p.pnl >= 0;
        const pnlText = `${isWin ? '+' : ''}${p.pnl.toFixed(2)}`;

        if (entryTime) {
          m.push({
            time: entryTime,
            position: isLong ? 'belowBar' : 'aboveBar',
            shape: isLong ? 'arrowUp' : 'arrowDown',
            color: isLong ? '#22c55e' : '#ef4444',
            text: `${p.side.toUpperCase()} entry @ ${p.entryPrice.toFixed(2)}`,
          });
        }

        if (exitTime) {
          const reason = exitReasonLabel(p.exitReason);
          m.push({
            time: exitTime,
            position: isLong ? 'aboveBar' : 'belowBar',
            shape: 'circle',
            color: exitMarkerColor(p.exitReason, isWin),
            text: `${reason} @ ${p.exitPrice.toFixed(2)} (${pnlText})`,
          });
        }
      });

      return { seriesData: data, seriesTimes: times, markers: m, isPriceChart: true };
    }

    const values = (equity ?? []).filter(v => v !== null && v !== undefined) as number[];
    const stepSeconds = timeframeToSeconds(timeframe);

    const times: UTCTimestamp[] = [];
    const data = values.map((value, index) => {
      let time: UTCTimestamp | null = null;
      if (Array.isArray(dates) && dates.length === values.length) {
        time = toUtcTimestamp(dates[index]);
      }
      if (!time) {
        const base = Math.floor(Date.now() / 1000) - (values.length - 1) * stepSeconds;
        time = (base + index * stepSeconds) as UTCTimestamp;
      }
      times.push(time);
      return { time, value };
    });

    const parsed = normalizePositions(positionData, positions);
    const m: SeriesMarker<UTCTimestamp>[] = [];

    parsed.forEach((p, idx) => {
      const fallbackIndex = Math.min(times.length - 1, Math.max(0, Math.floor(((idx + 1) / (parsed.length + 1)) * times.length)));
      const entryTime = getIndexedTime(p.entryIndex, p.entryTimeRaw, times) ?? times[fallbackIndex];
      const exitTime = getIndexedTime(p.exitIndex, p.exitTimeRaw, times) ?? times[Math.min(times.length - 1, fallbackIndex + 1)];

      const isLong = p.side.toUpperCase() === 'LONG';
      const isWin = p.pnl >= 0;

      m.push({
        time: entryTime,
        position: isLong ? 'belowBar' : 'aboveBar',
        shape: isLong ? 'arrowUp' : 'arrowDown',
        color: '#60a5fa',
        text: `Entry ${p.side.toUpperCase()} @ ${p.entryPrice.toFixed(2)}`,
      });

      m.push({
        time: exitTime,
        position: 'aboveBar',
        shape: 'circle',
        color: exitMarkerColor(p.exitReason, isWin),
        text: `${exitReasonLabel(p.exitReason)} @ ${p.exitPrice.toFixed(2)} (${isWin ? '+' : ''}${p.pnl.toFixed(2)})`,
      });
    });

    return { seriesData: data, seriesTimes: times, markers: m, isPriceChart: false };
  }, [equity, dates, positions, positionData, candles, timeframe]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create chart once
    if (!chartRef.current) {
      const chart = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: '#0b0f19' },
          textColor: '#cbd5e1',
        },
        grid: {
          vertLines: { color: 'rgba(148, 163, 184, 0.08)' },
          horzLines: { color: 'rgba(148, 163, 184, 0.08)' },
        },
        rightPriceScale: {
          visible: true,
          borderVisible: true,
          ticksVisible: true,
          borderColor: 'rgba(148, 163, 184, 0.32)',
          textColor: '#e2e8f0',
          entireTextOnly: false,
        },
        localization: {
          priceFormatter: (price: number) => price.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        },
        timeScale: {
          borderColor: 'rgba(148, 163, 184, 0.15)',
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          vertLine: {
            color: 'rgba(148, 163, 184, 0.55)',
            labelVisible: true,
          },
          horzLine: {
            color: 'rgba(148, 163, 184, 0.55)',
            labelVisible: true,
          },
        },
        autoSize: true,
      });

      const series = chart.addSeries(
        isPriceChart ? CandlestickSeries : AreaSeries,
        isPriceChart
          ? {
              upColor: '#22c55e',
              downColor: '#ef4444',
              borderUpColor: '#22c55e',
              borderDownColor: '#ef4444',
              wickUpColor: '#86efac',
              wickDownColor: '#fca5a5',
            }
          : {
              lineColor: '#60a5fa',
              topColor: 'rgba(96, 165, 250, 0.35)',
              bottomColor: 'rgba(96, 165, 250, 0.00)',
              lineWidth: 2,
            }
      );

      const seriesMarkers = createSeriesMarkers(series as any);

      chartRef.current = chart;
      seriesRef.current = series as any;
      markersRef.current = seriesMarkers;

      const ro = new ResizeObserver(() => {
        // autoSize handles it, but ResizeObserver keeps some browsers honest.
        chart.timeScale().fitContent();
      });
      ro.observe(container);

      return () => {
        ro.disconnect();
        seriesMarkers.detach();
        chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
        markersRef.current = null;
      };
    }
  }, [isPriceChart]);

  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const seriesMarkers = markersRef.current;
    if (!chart || !series || !seriesMarkers) return;

    // Update data/markers
    series.setData(seriesData as any);
    seriesMarkers.setMarkers(markers as unknown as SeriesMarker<any>[]);
    chart.timeScale().fitContent();
  }, [seriesData, markers, seriesTimes]);

  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const handleCrosshairMove = (param: any) => {
      if (!param.point || param.point.x < 0 || param.point.y < 0 || !param.time) {
        setHoverInfo(null);
        return;
      }

      const datum = param.seriesData.get(series);
      const price = series.coordinateToPrice(param.point.y);

      if (!datum || typeof price !== 'number' || !Number.isFinite(price)) {
        setHoverInfo(null);
        return;
      }

      const time = typeof param.time === 'object'
        ? `${param.time.year}-${String(param.time.month).padStart(2, '0')}-${String(param.time.day).padStart(2, '0')}`
        : new Date(param.time * 1000).toLocaleString();

      setHoverInfo({
        x: param.point.x,
        y: param.point.y,
        time,
        price,
        open: datum.open,
        high: datum.high,
        low: datum.low,
        close: datum.close,
        value: datum.value,
      });
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);
    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
    };
  }, [seriesData, isPriceChart]);

  return (
    <div className="w-full space-y-3">
      <div className="relative">
        <div ref={containerRef} className="w-full h-[450px] border border-slate-700 rounded-lg overflow-hidden" />
        {hoverInfo && (
          <>
            <div
              className="pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 text-xs text-slate-200 shadow-xl backdrop-blur"
              style={{ transform: hoverInfo.x < 180 ? 'translateX(150px)' : undefined }}
            >
              <div className="mb-1 font-semibold text-white">{hoverInfo.time}</div>
              {isPriceChart ? (
                <div className="grid grid-cols-4 gap-3 font-mono">
                  <span>O <b className="text-slate-50">{hoverInfo.open?.toFixed(2)}</b></span>
                  <span>H <b className="text-emerald-300">{hoverInfo.high?.toFixed(2)}</b></span>
                  <span>L <b className="text-red-300">{hoverInfo.low?.toFixed(2)}</b></span>
                  <span>C <b className="text-blue-300">{hoverInfo.close?.toFixed(2)}</b></span>
                </div>
              ) : (
                <div className="font-mono">Equity <b className="text-blue-300">{hoverInfo.value?.toLocaleString('en-US', { maximumFractionDigits: 2 })}</b></div>
              )}
            </div>
            <div
              className="pointer-events-none absolute right-0 z-10 rounded-l-md border border-r-0 border-blue-400/50 bg-blue-500 px-2 py-1 font-mono text-xs font-bold text-white shadow-lg"
              style={{ top: Math.max(8, Math.min(418, hoverInfo.y - 12)) }}
            >
              {hoverInfo.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </>
        )}
      </div>
      <div className="flex items-center justify-center gap-6 text-xs text-slate-400 px-4 flex-wrap">
        <span>Drag/scroll to pan & zoom</span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          {normalizePositions(positionData, positions).length} Trades
        </span>
      </div>
    </div>
  );
};

const EquityCurve = ({
  data,
  dates,
  positions,
  positionData,
  candles,
  timeframe,
}: {
  data: number[];
  dates: string[] | null | undefined;
  positions: string[] | undefined;
  positionData: PositionData[] | undefined;
  candles: CandleData[] | undefined;
  timeframe: string | undefined;
}) => {
  if ((!data || data.length === 0) && (!candles || candles.length === 0)) {
    return (
      <div className="w-full h-96 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center text-slate-400">
        No chart data available
      </div>
    );
  }

  return (
    <TradingViewBacktestChart
      equity={data}
      dates={dates}
      positions={positions}
      positionData={positionData}
      candles={candles}
      timeframe={timeframe}
    />
  );
};

const TradesOverlay = ({
  positions,
  positionData,
}: {
  positions: string[] | undefined;
  positionData: PositionData[] | undefined;
}) => {
  const trades = normalizePositions(positionData, positions);
  if (trades.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/70">Positions</h3>
        <span className="text-xs text-base-content/50">{trades.length} total</span>
      </div>
      <div className="max-h-80 overflow-y-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trades.map((trade, index) => {
            const entryDate = trade.entryTimeRaw ?? 'N/A';
            const exitDate = trade.exitTimeRaw ?? 'N/A';
            const entry = trade.entryPrice;
            const exit = trade.exitPrice;
            const pnl = trade.pnl;
            const isWin = pnl >= 0;
            
            return (
              <div key={index} className={`p-3 rounded-lg border ${isWin ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-xs text-base-content/70">Trade {index + 1}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[11px] uppercase tracking-wide text-base-content/50">{trade.side} • {trade.durationBars ?? 0} bars</p>
                      <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${exitReasonClass(trade.exitReason)}`}>
                        {exitReasonLabel(trade.exitReason)}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-xs text-base-content/50">Entry</p>
                        <p className="font-mono text-blue-300">${entry.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                        <p className="text-[11px] text-base-content/60 mt-1">{entryDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/50">Exit</p>
                        <p className="font-mono text-blue-300">${exit.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                        <p className="text-[11px] text-base-content/60 mt-1">{exitDate}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isWin ? '✓' : '✗'}
                    </p>
                    <p className={`font-mono text-sm font-semibold ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isWin ? '+' : ''}{pnl.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </p>
                    {trade.returnPct !== undefined && (
                      <p className={`text-xs ${isWin ? 'text-emerald-300' : 'text-red-300'}`}>
                        {isWin ? '+' : ''}{trade.returnPct.toFixed(2)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function BacktestResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setRules } = useStrategy();
  const state = location.state as LocationState | null;
  const { mutate: saveStrategy, isPending: isSaving } = useSaveStrategy();
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'duplicate'; text: string } | null>(null);
  const [savingDeployment, setSavingDeployment] = useState(false);
  const [deploymentMessage, setDeploymentMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveStrategy = () => {
    if (!state) return;
    
    saveStrategy(
      {
        name: state.strategy.NAME,
        entry_rule: state.strategy.ENTRY,
        exit_rule: state.strategy.EXIT,
        is_published: false
      },
      {
        onSuccess: (response: any) => {
          if (response.message) {
            setSaveMessage({
              type: 'duplicate',
              text: response.message
            });
          } else {
            setSaveMessage({
              type: 'success',
              text: 'Strategy saved successfully!'
            });
          }
          setTimeout(() => setSaveMessage(null), 4000);
        }
      }
    );
  };

  const handleSaveDeployment = async () => {
    if (!state) return;
    
    setSavingDeployment(true);
    try {
      const deploymentPayload = {
        strategy: state.strategy,
        backtest: {
          trp: state.results.cagr,
          sr: state.results.sharpe_ratio,
          maxdd: state.results.max_drawdown,
          wr: state.results.win_rate,
          tt: state.results.number_of_trades,
          fc: state.results.equity_evolution?.at(-1) ?? 0,
          score: state.results.deployment_score ?? 0,
          deployment_score: state.results.deployment_score
        }
      };
      
      const response = await api.deployStrategy(deploymentPayload);
      console.log('Deployment response:', response);
      
      const messageText = response?.message || 'Deployment saved successfully!';
      setDeploymentMessage({
        type: 'success',
        text: messageText
      });
      setTimeout(() => setDeploymentMessage(null), 4000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save deployment';
      setDeploymentMessage({
        type: 'error',
        text: message
      });
      setTimeout(() => setDeploymentMessage(null), 4000);
    } finally {
      setSavingDeployment(false);
    }
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-black text-base-content p-8">
        <div className="text-center py-12">
          <p className="text-xl text-base-content/70">No results found. Run a backtest first.</p>
        </div>
      </div>
    );
  }

  const { results, strategy } = state;
  const isProfitable = results.pnl >= 0;
  const hasTrades = results.number_of_trades > 0;

  const formatNumber = (num: number, decimals = 2) => {
    if (typeof num !== 'number') return num;
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    });
  };

  const formatCurrency = (num: number) => {
    return '$' + num.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    });
  };

  return (
    <div className="min-h-screen bg-black text-base-content p-4 md:p-8 lg:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-4">
            Backtest Results
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            {strategy.NAME}
          </h1>
          <p className="text-base-content/70 text-lg">
            {strategy.TICKER} • {strategy.TIMEFRAME} • {strategy.DIRECTION}
          </p>
        </header>

        {/* Strategy Rules */}
        <div className="bg-base-100/50 border border-base-300 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Strategy Rules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-base-content/70 mb-2">Entry Rule</p>
              <p className="font-mono text-blue-300 bg-base-200/50 p-3 rounded">{strategy.ENTRY}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/70 mb-2">Exit Rule</p>
              <p className="font-mono text-blue-300 bg-base-200/50 p-3 rounded">{strategy.EXIT}</p>
            </div>
          </div>
        </div>

        {!hasTrades ? (
          <div className="bg-base-100/50 border border-base-300 rounded-xl p-10 text-center">
            <p className="text-2xl font-bold text-white">No trades were opened.</p>
          </div>
        ) : (
          <>
            {/* Equity Curve */}
            <div className="bg-base-100/50 border border-base-300 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                {results.candles && results.candles.length > 0 ? 'Price Chart' : 'Equity Curve'}
              </h2>
              <EquityCurve
                data={results.equity_evolution}
                dates={results.dates}
                positions={results.positions}
                positionData={results.position_data}
                candles={results.candles}
                timeframe={strategy.TIMEFRAME}
              />
              <TradesOverlay positions={results.positions} positionData={results.position_data} />
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard 
                label="Total P&L" 
                value={formatCurrency(results.pnl)} 
                color={isProfitable ? 'green' : 'red'}
              />
              <StatCard 
                label="CAGR" 
                value={`${formatNumber(results.cagr * 100, 2)}%`}
                color={results.cagr >= 0 ? 'green' : 'red'}
              />
              <StatCard 
                label="Sharpe Ratio" 
                value={formatNumber(results.sharpe_ratio, 2)}
                color="blue"
              />
              <StatCard 
                label="BackRank Score" 
                value={results.deployment_score ? `${formatNumber(results.deployment_score, 1)}/100` : 'N/A'}
                color={results.deployment_score && results.deployment_score >= 70 ? 'green' : results.deployment_score && results.deployment_score >= 50 ? 'amber' : 'red'}
              />
            </div>

            {/* Risk Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard label="Max Drawdown" value={`${formatNumber(results.max_drawdown * 100, 2)}%`} color="red" />
              <StatCard label="Win Rate" value={`${formatNumber(results.win_rate, 1)}%`} color="blue" />
              <StatCard label="Volatility" value={`${formatNumber(results.volatility * 100, 2)}%`} color="amber" />
              <StatCard label="Sortino Ratio" value={formatNumber(results.sortino, 2)} color="blue" />
              <StatCard label="Profit Factor" value={formatNumber(results.profit_factor, 2)} color="green" />
              <StatCard label="Calmar Ratio" value={formatNumber(results.calmar, 2)} color="blue" />
            </div>

            {/* Trade Statistics */}
            <div className="bg-base-100/50 border border-base-300 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <BarChart3 size={24} className="text-blue-400" /> Trade Statistics
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-base-content/70">Number of Trades</p>
                  <p className="text-3xl font-bold text-white">{results.number_of_trades}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-base-content/70">Avg Trade Duration</p>
                  <p className="text-3xl font-bold text-white">{formatNumber(results.avg_trade_duration, 1)} bars</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-base-content/70">Average Win</p>
                  <p className="text-3xl font-bold text-emerald-400">{formatCurrency(results.avg_win)}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-base-content/70">Average Loss</p>
                  <p className="text-3xl font-bold text-red-400">{formatCurrency(results.avg_loss)}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-base-content/70">Expectancy</p>
                  <p className={`text-3xl font-bold ${results.expectancy >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(results.expectancy)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-base-content/70">Exposure</p>
                  <p className="text-3xl font-bold text-blue-400">{formatNumber(results.exposure, 1)}%</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-base-content/70">Time in Market (Years)</p>
                  <p className="text-3xl font-bold text-blue-400">{formatNumber(results.total_time_in_market_years, 3)}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-base-content/70">Time in Market (Bars)</p>
                  <p className="text-3xl font-bold text-blue-400">{results.total_time_in_market_bars}</p>
                </div>
              </div>
            </div>

            {/* Returns & Volatility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-base-100/50 border border-base-300 rounded-xl p-6 space-y-4">
                <h3 className="text-xl font-semibold text-white">Returns</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Average Daily Return</span>
                    <span className={`font-semibold ${results.avg_returns >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatNumber(results.avg_returns * 100, 3)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Annual Return</span>
                    <span className={`font-semibold ${results.cagr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatNumber(results.cagr * 100, 2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Total Time Period (Years)</span>
                    <span className="font-semibold text-blue-300">{formatNumber(results.time_in_years, 2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-base-100/50 border border-base-300 rounded-xl p-6 space-y-4">
                <h3 className="text-xl font-semibold text-white">Risk Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Volatility (Std Dev)</span>
                    <span className="font-semibold text-amber-400">{formatNumber(results.volatility * 100, 2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Max Drawdown</span>
                    <span className="font-semibold text-red-400">{formatNumber(results.max_drawdown * 100, 2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Avg Drawdown</span>
                    <span className="font-semibold text-red-400">{formatNumber(results.avg_drawdown * 100, 2)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 pt-4">
          {(saveMessage || deploymentMessage) && (
            <div className="flex gap-4 justify-end flex-wrap">
              {saveMessage && (
                <div className={`px-4 py-3 rounded-lg border font-medium ${
                  saveMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                }`}>
                  {saveMessage.text}
                </div>
              )}
              {deploymentMessage && (
                <div className={`px-4 py-3 rounded-lg border font-medium ${
                  deploymentMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  {deploymentMessage.text}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-4 justify-end flex-wrap">
            <button
              onClick={() => {
                if (state) {
                  setRules(state.strategy.NAME, state.strategy.ENTRY, state.strategy.EXIT);
                }
                navigate('/strategy/edit');
              }}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium"
            >
              Edit Conditions
            </button>
            {hasTrades && (
              <button
                onClick={handleSaveDeployment}
                disabled={savingDeployment}
                className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors font-medium disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Zap size={18} />
                {savingDeployment ? 'Saving...' : 'Save Deployment'}
              </button>
            )}
            <button
              onClick={handleSaveStrategy}
              disabled={isSaving}
              className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors font-medium disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Strategy to Profile'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
