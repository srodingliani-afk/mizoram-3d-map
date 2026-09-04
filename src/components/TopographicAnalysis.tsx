import React, { useState } from 'react';
import { TerrainData } from '../types';
import { Mountain, Compass, Map, Layers, ExternalLink, Info, CheckCircle2 } from 'lucide-react';

interface TopographicAnalysisProps {
  data: TerrainData;
}

export const TopographicAnalysis: React.FC<TopographicAnalysisProps> = ({ data }) => {
  const [showOriginalMap, setShowOriginalMap] = useState(false);

  return (
    <div id="topographic-analysis-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Mountain className="w-4 h-4 text-emerald-400" />
            Topographic & Elevation Analysis
          </h3>
          <p className="text-[11px] text-slate-400">
            Real-world SRTM elevation data aligned with the 2021 district map boundaries
          </p>
        </div>

        <a
          href="https://en-in.topographic-map.com/map-lxs14/Mizoram/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
        >
          <span>Source: topographic-map.com/Mizoram</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Metric Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Highest Summit</div>
          <div className="text-base font-bold text-amber-400 mt-0.5">Phawngpui</div>
          <div className="text-[11px] text-slate-300 font-mono">2,157 m (7,077 ft)</div>
        </div>

        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Valley Floor</div>
          <div className="text-base font-bold text-emerald-400 mt-0.5">Tlawng Basin</div>
          <div className="text-[11px] text-slate-300 font-mono">23 m (75 ft)</div>
        </div>

        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Average Altitude</div>
          <div className="text-base font-bold text-indigo-300 mt-0.5">Statewide Mean</div>
          <div className="text-[11px] text-slate-300 font-mono">612 m (2,008 ft)</div>
        </div>

        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Mountain Range</div>
          <div className="text-base font-bold text-white mt-0.5">Patkai / Lushai</div>
          <div className="text-[11px] text-slate-300">Parallel N-S Ridges</div>
        </div>
      </div>

      {/* Analysis Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
        <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2">
          <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Geomorphology: The Parallel Ridges of Mizoram
          </h4>
          <p className="text-slate-400 text-[11px]">
            Mizoram is renowned for its distinctive corrugated topography composed of tightly folded anticlines (high razorback ridges) separated by deep synclinal valleys (fluvial gorges). The ridges run almost strictly north-to-south, created by the compressive collision between the Indian Plate and the Burma Arc.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono text-slate-300">
              Coverage: 21.94°N–24.52°N, 92.26°E–93.44°E
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2">
          <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            District Texture Alignment & Baking
          </h4>
          <p className="text-slate-400 text-[11px]">
            The uploaded 2021 map was precisely cropped from pixel bounding box [348, 90] to [891, 1389] and resampled onto a 2048x1024 power-of-two GPU texture. UV coordinates map 1:1 with geographic latitude and longitude, ensuring the white district boundaries trace cleanly across the mountains in Godot.
          </p>
          <button
            type="button"
            onClick={() => setShowOriginalMap(!showOriginalMap)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2"
          >
            {showOriginalMap ? 'Hide Uploaded Map Comparison' : 'View Uploaded 2D Map vs 3D Texture'}
          </button>
        </div>
      </div>

      {/* Comparison Drawer */}
      {showOriginalMap && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <span>Uploaded Map & Baked Texture Comparison</span>
            <button
              type="button"
              onClick={() => setShowOriginalMap(false)}
              className="text-slate-400 hover:text-white text-[11px]"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Original Uploaded Map (Datawrapper 2021)</div>
              <div className="h-64 bg-slate-900 rounded-lg p-2 flex items-center justify-center border border-slate-800 overflow-hidden">
                <img
                  src="/Districts_of_Mizoram_2021.png"
                  alt="Original District Map of Mizoram"
                  className="max-h-full object-contain"
                />
              </div>
            </div>

            <div className="text-center space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Baked 3D Albedo Texture (Godot glTF Ready)</div>
              <div className="h-64 bg-slate-900 rounded-lg p-2 flex items-center justify-center border border-slate-800 overflow-hidden">
                <img
                  src="/mizoram_district_texture.png"
                  alt="Baked 3D District Texture"
                  className="max-h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
