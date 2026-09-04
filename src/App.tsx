import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { TerrainData, ViewportSettings, Landmark } from './types';
import { TerrainViewer } from './components/TerrainViewer';
import { ExportPanel } from './components/ExportPanel';
import { GodotGuideModal } from './components/GodotGuideModal';
import { DistrictInspector } from './components/DistrictInspector';
import { TopographicAnalysis } from './components/TopographicAnalysis';
import {
  Mountain,
  Sliders,
  Sun,
  Layers,
  HelpCircle,
  Download,
  Eye,
  RotateCcw,
  Sparkles,
  Info,
  MapPin,
  Compass
} from 'lucide-react';

export default function App() {
  const [terrainData, setTerrainData] = useState<TerrainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [settings, setSettings] = useState<ViewportSettings>({
    exaggeration: 2.5,
    resolution: 'medium',
    textureMode: 'district',
    wireframe: false,
    showLandmarks: true,
    showStateCutout: false,
    sunAngle: 135,
    sunElevation: 45,
    roughness: 0.8
  });

  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [currentMesh, setCurrentMesh] = useState<THREE.Mesh | null>(null);
  const [isGodotGuideOpen, setIsGodotGuideOpen] = useState(false);

  // Load elevation and district dataset
  useEffect(() => {
    fetch('/mizoram_terrain_data.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data: TerrainData) => {
        setTerrainData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load terrain data:', err);
        setError('Failed to load Mizoram topographic dataset. Please refresh the page.');
        setLoading(false);
      });
  }, []);

  const handleUpdateSettings = (partial: Partial<ViewportSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleResetView = () => {
    setSettings({
      exaggeration: 2.5,
      resolution: 'medium',
      textureMode: 'district',
      wireframe: false,
      showLandmarks: true,
      showStateCutout: false,
      sunAngle: 135,
      sunElevation: 45,
      roughness: 0.8
    });
    setSelectedLandmark(null);
    setSelectedDistrict(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center animate-pulse">
              <Mountain className="w-8 h-8 text-indigo-400" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500" />
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Generating Mizoram 3D Topography</h2>
          <p className="text-xs text-slate-400">
            Sampling 30-meter elevation digital elevation model and aligning 2021 district texture coordinates...
          </p>
        </div>
      </div>
    );
  }

  if (error || !terrainData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
        <div className="p-6 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-center max-w-md space-y-3">
          <div className="text-rose-400 font-bold">Error Loading Dataset</div>
          <p className="text-xs text-slate-300">{error || 'Unknown error occurred.'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/30 shrink-0">
            <Mountain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Mizoram 3D Terrain & District Model Generator
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Godot Engine Asset
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Real-world SRTM elevation data with baked 2021 district boundaries & colors
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-nav-godot-guide"
            type="button"
            onClick={() => setIsGodotGuideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-indigo-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium transition-all shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Godot Guide</span>
          </button>

          <a
            id="btn-nav-download-glb"
            href="/export/mizoram_terrain.glb"
            download="mizoram_terrain.glb"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .GLB</span>
          </a>
        </div>
      </header>

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col gap-6">
        {/* Top 3D Viewport & Side Control Dock */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* 3D Canvas Viewport (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-[520px] sm:h-[600px] flex flex-col">
            <TerrainViewer
              data={terrainData}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              selectedLandmark={selectedLandmark}
              onSelectLandmark={setSelectedLandmark}
              onMeshReady={setCurrentMesh}
            />
          </div>

          {/* Interactive Terrain Controls Dock (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">Terrain Parameters</h2>
              </div>
              <button
                id="btn-reset-view-settings"
                type="button"
                onClick={handleResetView}
                title="Reset to defaults"
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Vertical Exaggeration Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Vertical Exaggeration</span>
                <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  {settings.exaggeration.toFixed(1)}x
                </span>
              </div>
              <input
                id="slider-exaggeration"
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={settings.exaggeration}
                onChange={(e) => handleUpdateSettings({ exaggeration: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <button
                  type="button"
                  onClick={() => handleUpdateSettings({ exaggeration: 1.0 })}
                  className="hover:text-white hover:underline"
                >
                  1.0x (Real-World)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateSettings({ exaggeration: 2.5 })}
                  className="hover:text-white hover:underline"
                >
                  2.5x (Standard Game)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateSettings({ exaggeration: 4.5 })}
                  className="hover:text-white hover:underline"
                >
                  4.5x (Sharp Ridges)
                </button>
              </div>
            </div>

            {/* Mesh Resolution */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">Mesh Resolution (LOD)</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['low', 'medium', 'high'] as const).map((r) => (
                  <button
                    key={r}
                    id={`btn-res-${r}`}
                    type="button"
                    onClick={() => handleUpdateSettings({ resolution: r })}
                    className={`py-2 px-1 rounded-xl text-center border font-medium capitalize transition-all ${
                      settings.resolution === r
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border-slate-700/80'
                    }`}
                  >
                    <div>{r}</div>
                    <div className="text-[10px] opacity-75 font-mono">
                      {r === 'low' ? '8k tris' : r === 'medium' ? '65k tris' : '160k tris'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* State Cutout Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Terrain Boundary Cutout</span>
                <button
                  id="btn-toggle-cutout"
                  type="button"
                  onClick={() => handleUpdateSettings({ showStateCutout: !settings.showStateCutout })}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                    settings.showStateCutout
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {settings.showStateCutout ? 'Mizoram Cutout' : 'Full Grid Sheet'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {settings.showStateCutout
                  ? 'Isolates the Mizoram state polygon with base pedestal.'
                  : 'Includes surrounding topography across neighboring border regions.'}
              </p>
            </div>

            {/* Sun & Shadow Lighting */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Sun Azimuth (Angle)
                </span>
                <span className="font-mono text-slate-400 text-[11px]">{settings.sunAngle}°</span>
              </div>
              <input
                id="slider-sun-angle"
                type="range"
                min="0"
                max="360"
                step="5"
                value={settings.sunAngle}
                onChange={(e) => handleUpdateSettings({ sunAngle: parseInt(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            {/* Quick Landmark Navigator */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Featured Peaks & Cities
              </div>
              <div className="flex flex-wrap gap-1.5">
                {terrainData.landmarks.slice(0, 6).map((lm) => (
                  <button
                    key={lm.name}
                    type="button"
                    onClick={() => setSelectedLandmark(lm)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
                      selectedLandmark?.name === lm.name
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {lm.name.split(' ')[0]} ({lm.elevation}m)
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Godot Engine Export Center */}
        <ExportPanel
          currentMesh={currentMesh}
          exaggeration={settings.exaggeration}
          resolution={settings.resolution}
          onOpenGodotGuide={() => setIsGodotGuideOpen(true)}
        />

        {/* Topographic & Elevation Analysis Card */}
        <TopographicAnalysis data={terrainData} />

        {/* District Inspector: 11 Districts of Mizoram */}
        <DistrictInspector
          districts={terrainData.districts}
          landmarks={terrainData.landmarks}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={setSelectedDistrict}
          onSelectLandmark={setSelectedLandmark}
        />
      </main>

      {/* Godot Guide Modal */}
      <GodotGuideModal isOpen={isGodotGuideOpen} onClose={() => setIsGodotGuideOpen(false)} />

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-800 bg-slate-900/60 py-5 text-center text-xs text-slate-400">
        <p>
          Generated from SRTM Digital Elevation Model & 2021 Official Districts of Mizoram. Ready for Godot 4.x & 3.x.
        </p>
      </footer>
    </div>
  );
}
