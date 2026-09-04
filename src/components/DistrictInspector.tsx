import React from 'react';
import { DistrictInfo, Landmark, TerrainData } from '../types';
import { MapPin, Mountain, ChevronRight, Compass } from 'lucide-react';

interface DistrictInspectorProps {
  districts: DistrictInfo[];
  landmarks: Landmark[];
  selectedDistrict: string | null;
  onSelectDistrict: (districtName: string | null) => void;
  onSelectLandmark: (landmark: Landmark) => void;
}

export const DistrictInspector: React.FC<DistrictInspectorProps> = ({
  districts,
  landmarks,
  selectedDistrict,
  onSelectDistrict,
  onSelectLandmark
}) => {
  return (
    <div id="district-inspector" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            Districts of Mizoram (2021 Map)
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click any district to inspect its peaks and fly the 3D camera.
          </p>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 rounded-full border border-slate-700">
          11 Districts
        </span>
      </div>

      {/* District Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
        {districts.map((dist) => {
          const isSelected = selectedDistrict === dist.name;
          const districtPeaks = landmarks.filter(
            (lm) => lm.type === 'peak' && lm.district.toLowerCase().includes(dist.name.toLowerCase().split(' ')[0])
          );
          const districtCapital = landmarks.find(
            (lm) => lm.name.toLowerCase().includes(dist.hq.toLowerCase())
          );

          return (
            <div
              key={dist.name}
              id={`district-card-${dist.name.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => {
                onSelectDistrict(isSelected ? null : dist.name);
                if (districtCapital) {
                  onSelectLandmark(districtCapital);
                } else if (districtPeaks[0]) {
                  onSelectLandmark(districtPeaks[0]);
                }
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                  : 'bg-slate-800/40 hover:bg-slate-800/70 border-slate-700/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-md shadow-sm border border-black/20 shrink-0"
                    style={{ backgroundColor: dist.color }}
                  />
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">{dist.name}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90 text-indigo-400' : 'text-slate-500'}`} />
              </div>

              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 font-mono">
                <div>
                  <span className="text-slate-400">HQ:</span>{' '}
                  <span className="text-slate-200">{dist.hq}</span>
                </div>
                <div>
                  <span className="text-slate-400">Area:</span>{' '}
                  <span className="text-slate-200">{dist.areaKm2.toLocaleString()} km²</span>
                </div>
              </div>

              {districtPeaks.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                  <Mountain className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">{districtPeaks[0].name} ({districtPeaks[0].elevation}m)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
