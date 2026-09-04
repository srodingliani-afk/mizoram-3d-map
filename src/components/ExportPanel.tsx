import React, { useState } from 'react';
import * as THREE from 'three';
import { exportMeshToGLB, exportMeshToOBJ } from '../utils/terrainBuilder';
import {
  Download,
  Package,
  FileBox,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  Sliders,
  HelpCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface ExportPanelProps {
  currentMesh: THREE.Mesh | null;
  exaggeration: number;
  resolution: string;
  onOpenGodotGuide: () => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  currentMesh,
  exaggeration,
  resolution,
  onOpenGodotGuide
}) => {
  const [exportingGlb, setExportingGlb] = useState(false);
  const [exportingObj, setExportingObj] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleCustomGLBExport = async () => {
    if (!currentMesh) return;
    try {
      setExportingGlb(true);
      const blob = await exportMeshToGLB(currentMesh);
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `mizoram_terrain_${exaggeration.toFixed(1)}x.glb`);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error('Failed to export custom GLB:', err);
    } finally {
      setExportingGlb(false);
    }
  };

  const handleCustomOBJExport = () => {
    if (!currentMesh) return;
    try {
      setExportingObj(true);
      const objText = exportMeshToOBJ(currentMesh);
      const blob = new Blob([objText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `mizoram_terrain_${exaggeration.toFixed(1)}x.obj`);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error('Failed to export custom OBJ:', err);
    } finally {
      setExportingObj(false);
    }
  };

  return (
    <div id="godot-export-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" />
              Godot Engine 3D Model Export
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
              Godot 4 & 3 Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Download 3D terrain models with baked 2021 district boundaries and realistic Patkai mountain ranges.
          </p>
        </div>

        <button
          id="btn-open-godot-guide"
          type="button"
          onClick={onOpenGodotGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-indigo-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium transition-all shadow-sm"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Import Guide
        </button>
      </div>

      {downloadSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Downloaded <strong>{downloadSuccess}</strong>. Ready to import into Godot!</span>
        </div>
      )}

      {/* Featured Primary Download Box: GLB */}
      <div className="p-4 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400 shrink-0 mt-0.5">
              <FileBox className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">mizoram_terrain.glb</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 rounded font-mono">
                  2.1 MB • Self-Contained
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Standard Binary glTF 2.0 with embedded 2048x1024 colorful district texture, UV coords, and normal vectors.
              </p>
            </div>
          </div>

          <button
            id="btn-download-glb-primary"
            type="button"
            onClick={() => triggerDownload('/export/mizoram_terrain.glb', 'mizoram_terrain.glb')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            Download .GLB for Godot
          </button>
        </div>
      </div>

      {/* Complete Package & Individual Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Full ZIP Package */}
        <div className="flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">mizoram_godot_package.zip</div>
              <div className="text-[11px] text-slate-400">All formats (.glb, .obj, .mtl, .tscn, texture, guide)</div>
            </div>
          </div>
          <button
            id="btn-download-zip"
            type="button"
            onClick={() => triggerDownload('/export/mizoram_godot_package.zip', 'mizoram_godot_package.zip')}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
          >
            Download ZIP
          </button>
        </div>

        {/* Wavefront OBJ + MTL */}
        <div className="flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">mizoram_terrain.obj + .mtl</div>
              <div className="text-[11px] text-slate-400">Wavefront 3D mesh for Blender & Godot 3/4</div>
            </div>
          </div>
          <button
            id="btn-download-obj"
            type="button"
            onClick={() => triggerDownload('/export/mizoram_terrain.obj', 'mizoram_terrain.obj')}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Download OBJ
          </button>
        </div>

        {/* High-res Baked District Texture */}
        <div className="flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">mizoram_district_texture.png</div>
              <div className="text-[11px] text-slate-400">2048x1024 PNG texture with district boundaries</div>
            </div>
          </div>
          <button
            id="btn-download-texture"
            type="button"
            onClick={() => triggerDownload('/mizoram_district_texture.png', 'mizoram_district_texture.png')}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Download PNG
          </button>
        </div>

        {/* Godot 4 Scene (.tscn) */}
        <div className="flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all">
          <div className="flex items-center gap-2.5">
            <FileBox className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">MizoramTerrain.tscn</div>
              <div className="text-[11px] text-slate-400">Ready-to-use Godot 4 Scene with collision & sun</div>
            </div>
          </div>
          <button
            id="btn-download-tscn"
            type="button"
            onClick={() => triggerDownload('/export/MizoramTerrain.tscn', 'MizoramTerrain.tscn')}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Download TSCN
          </button>
        </div>
      </div>

      {/* Dynamic Live Exporter */}
      <div className="pt-3 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>
              Live Custom View: <strong>{exaggeration.toFixed(1)}x</strong> vertical scale •{' '}
              <strong className="capitalize">{resolution}</strong> resolution mesh
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-export-custom-glb"
              type="button"
              disabled={exportingGlb || !currentMesh}
              onClick={handleCustomGLBExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {exportingGlb ? 'Generating...' : 'Export Current Live .GLB'}
            </button>
            <button
              id="btn-export-custom-obj"
              type="button"
              disabled={exportingObj || !currentMesh}
              onClick={handleCustomOBJExport}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
            >
              {exportingObj ? 'Generating...' : 'Export Live .OBJ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
