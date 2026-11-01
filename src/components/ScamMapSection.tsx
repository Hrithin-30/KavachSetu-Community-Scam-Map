import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Filter,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Bell,
  Navigation,
  RefreshCw,
  Layers
} from 'lucide-react';
import { Language } from '../translations';
import { OFFICIAL_AREAS } from '../engine/normalizer';
import { MapCluster } from '../engine/trustEngine';
import { ZoneCrimeGrowthGraph } from './ZoneCrimeGrowthGraph';

interface ScamMapSectionProps {
  language: Language;
  onSelectAreaForAlerts: (pincode: string) => void;
}

export const ScamMapSection: React.FC<ScamMapSectionProps> = ({
  onSelectAreaForAlerts
}) => {
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [centerPincode, setCenterPincode] = useState<string>('');
  const [days, setDays] = useState<number>(7);
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [clusters, setClusters] = useState<MapCluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<MapCluster | null>(null);

  const cities = Array.from(
    new Set(Object.values(OFFICIAL_AREAS).map((a) => a.city))
  );

  const fetchMapData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (centerPincode.trim()) {
        params.set('area_pincode', centerPincode.trim());
      }
      params.set('days', String(days));
      params.set('radius_km', String(radiusKm));

      const res = await fetch(`/map?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.clusters) {
        let filtered: MapCluster[] = data.clusters;
        if (selectedCity !== 'ALL' && !centerPincode.trim()) {
          filtered = filtered.filter((c) => c.city === selectedCity);
        }
        setClusters(filtered);
        if (filtered.length > 0) {
          setSelectedCluster(filtered[0]);
        } else {
          setSelectedCluster(null);
        }
      }
    } catch (e) {
      console.error('Failed to fetch map clusters:', e);
    } finally {
      setLoading(false);
    }
  }, [centerPincode, days, radiusKm, selectedCity]);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  const getProjectedCoords = (cluster: MapCluster, idx: number, total: number) => {
    const angle = (idx / Math.max(1, total)) * Math.PI * 2 - Math.PI / 4;
    const radiusFactor =
      cluster.severity === 'CRIT' ? 70 : cluster.severity === 'HIGH' ? 120 : 165;
    const cx = 300 + Math.cos(angle) * radiusFactor;
    const cy = 210 + Math.sin(angle) * (radiusFactor * 0.72);
    return { x: cx, y: cy };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Filter & Control Bar */}
      <div className="bg-[#0D1322] border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
              Spatial Threat Intelligence
            </span>
            <span className="text-xs font-mono text-slate-400">
              Appendix B Geodesic Clustering
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-1">
            7-Day Neighborhood Scam Heatmap
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated by 6-digit Indian Postal PIN code. Fake/Sybil subnet bursts are automatically filtered out.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* City Filter */}
          <div className="flex items-center gap-1.5 bg-[#070B14] border border-slate-800 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setCenterPincode('');
              }}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none"
            >
              <option value="ALL" className="bg-slate-900">All Cities (India)</option>
              {cities.map((c) => (
                <option key={c} value={c} className="bg-slate-900">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Center Pincode Filter */}
          <div className="flex items-center gap-1.5 bg-[#070B14] border border-slate-800 rounded-xl px-3 py-2">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={centerPincode}
              onChange={(e) => setCenterPincode(e.target.value)}
              className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none"
            >
              <option value="" className="bg-slate-900">All PINs (No Radius Lock)</option>
              {Object.values(OFFICIAL_AREAS).map((area) => (
                <option key={area.pincode} value={area.pincode} className="bg-slate-900">
                  {area.pincode} — {area.area} ({area.city})
                </option>
              ))}
            </select>
          </div>

          {/* Radius Selector */}
          <div className="flex items-center gap-1.5 bg-[#070B14] border border-slate-800 rounded-xl px-3 py-2">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none"
            >
              <option value={2} className="bg-slate-900">Radius: 2 km</option>
              <option value={5} className="bg-slate-900">Radius: 5 km</option>
              <option value={15} className="bg-slate-900">Radius: 15 km</option>
              <option value={25} className="bg-slate-900">Radius: 25 km</option>
              <option value={3000} className="bg-slate-900">National (All India)</option>
            </select>
          </div>

          {/* Days Window */}
          <div className="flex items-center gap-1 bg-[#070B14] border border-slate-800 rounded-xl p-1">
            {[1, 7, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  days === d
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchMapData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Clusters"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Split View: Left Interactive Radar Map + Right Cluster Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#0D1322] border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Live Postal Cluster Radar ({clusters.length} Active Zones)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> CRIT (&ge;5)
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> HIGH (3–4)
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> MED (1–2)
              </span>
            </div>
          </div>

          {/* SVG Spatial Map Canvas */}
          <div className="relative w-full h-[380px] bg-[#070B14] rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
            <svg viewBox="0 0 600 420" className="w-full h-full">
              <defs>
                <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                  <stop offset="70%" stopColor="#0f172a" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#070B14" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="600" height="420" fill="url(#radarGlow)" />
              <line x1="0" y1="210" x2="600" y2="210" stroke="#1e293b" strokeDasharray="4 4" />
              <line x1="300" y1="0" x2="300" y2="420" stroke="#1e293b" strokeDasharray="4 4" />
              <circle cx="300" cy="210" r="65" fill="none" stroke="#1e293b" strokeWidth="1" />
              <circle cx="300" cy="210" r="125" fill="none" stroke="#1e293b" strokeWidth="1" />
              <circle cx="300" cy="210" r="185" fill="none" stroke="#1e293b" strokeWidth="1" />

              {clusters.map((cluster, idx) => {
                const { x, y } = getProjectedCoords(cluster, idx, clusters.length);
                const isSelected = selectedCluster?.area_pincode === cluster.area_pincode;
                const color =
                  cluster.severity === 'CRIT'
                    ? '#ef4444'
                    : cluster.severity === 'HIGH'
                    ? '#f59e0b'
                    : '#10b981';
                const radius = Math.min(34, 14 + cluster.report_count * 2.5);

                return (
                  <g
                    key={cluster.area_pincode}
                    onClick={() => setSelectedCluster(cluster)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={radius + (isSelected ? 8 : 4)}
                      fill={color}
                      fillOpacity={isSelected ? 0.28 : 0.14}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={radius}
                      fill={color}
                      fillOpacity={0.85}
                      stroke={isSelected ? '#ffffff' : color}
                      strokeWidth={isSelected ? 2.5 : 1}
                    />
                    <text
                      x={x}
                      y={y + 4}
                      textAnchor="middle"
                      fill="#020617"
                      fontSize="11"
                      fontWeight="800"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {cluster.report_count}
                    </text>
                    <text
                      x={x}
                      y={y + radius + 14}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="10"
                      fontWeight="700"
                    >
                      {cluster.area_name} ({cluster.area_pincode})
                    </text>
                  </g>
                );
              })}
            </svg>

            {clusters.length === 0 && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <ShieldAlert className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-300">
                  No Scam Clusters Found Within Selected Radius
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Try increasing the radius (e.g. 25 km or National) or clearing the PIN filter.
                </p>
              </div>
            )}
          </div>

          {selectedCluster && (
            <div className="mt-4 bg-[#070B14] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        PIN {selectedCluster.area_pincode}
                      </span>
                      <span className="text-sm font-extrabold text-white">
                        {selectedCluster.area_name}, {selectedCluster.city}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        ({selectedCluster.lat.toFixed(4)}°N, {selectedCluster.lng.toFixed(4)}°E)
                      </span>
                      {selectedCluster.blocked_report_count > 0 && (
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-extrabold">
                          {selectedCluster.blocked_report_count} Fake Blocked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Dominant Threat:{' '}
                      <strong className="text-slate-200">
                        {selectedCluster.top_scam_type.replace(/-/g, ' ').toUpperCase()}
                      </strong>{' '}
                      • {selectedCluster.distinct_reporters} distinct citizen reporters ({selectedCluster.report_count} verified / {selectedCluster.raw_report_count} raw)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectAreaForAlerts(selectedCluster.area_pincode)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    Inspect Area Alerts
                  </button>
                </div>
              )}
            </div>

            {/* Right 5 Cols: Ranked Postal Cluster List */}
            <div className="lg:col-span-5 bg-[#0D1322] border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Postal Code Breakdown ({days}-Day Window)
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Sorted by Verified Volume
                </span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[430px] pr-1 custom-scrollbar">
                {clusters.map((cluster) => {
                  const isSelected = selectedCluster?.area_pincode === cluster.area_pincode;
                  return (
                    <div
                      key={cluster.area_pincode}
                      onClick={() => setSelectedCluster(cluster)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900/90 border-emerald-500/50 shadow-md'
                          : 'bg-[#070B14]/80 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                                cluster.severity === 'CRIT'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : cluster.severity === 'HIGH'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {cluster.severity}
                            </span>
                            <h4 className="text-sm font-bold text-white">
                              {cluster.area_name}{' '}
                              <span className="font-mono text-xs text-slate-400">
                                ({cluster.area_pincode})
                              </span>
                            </h4>
                            {cluster.blocked_report_count > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold">
                                {cluster.blocked_report_count} fake blocked
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {cluster.city} • Top Pattern:{' '}
                            <span className="text-slate-200 font-semibold">
                              {cluster.top_scam_type}
                            </span>
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-lg font-mono font-extrabold text-white leading-none">
                            {cluster.report_count}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            verified{cluster.raw_report_count > cluster.report_count ? ` (${cluster.raw_report_count} raw)` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1">
                          {cluster.trend_pct >= 0 ? (
                            <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>
                            {cluster.trend_pct >= 0 ? `+${cluster.trend_pct}%` : `${cluster.trend_pct}%`} vs prior {days}d
                          </span>
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAreaForAlerts(cluster.area_pincode);
                          }}
                          className="text-emerald-400 hover:text-emerald-300 font-bold text-xs"
                        >
                          Check Spike Alerts →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Point-Arrow Graph: Growth of Reported Crime Rate in Selected Zone Origin */}
          <ZoneCrimeGrowthGraph
            selectedPincode={selectedCluster?.area_pincode || centerPincode || '560102'}
            onSelectZone={(pin) => {
              const found = clusters.find((c) => c.area_pincode === pin);
              if (found) setSelectedCluster(found);
            }}
            onDataMutated={fetchMapData}
          />
        </div>
      );
    };
