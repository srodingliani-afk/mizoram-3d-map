import React, { useState } from 'react';
import { X, Check, Copy, Terminal, Layers, Play, CheckCircle } from 'lucide-react';

interface GodotGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GodotGuideModal: React.FC<GodotGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const gdscriptSample = `extends CharacterBody3D
# Mizoram 3D Terrain Character Controller & District Query (Godot 4.x)

@export var speed: float = 15.0
@export var jump_velocity: float = 8.0
var gravity = ProjectSettings.get_setting("physics/3d/default_gravity")

# Geographic bounds corresponding to the 3D model
const TERRAIN_WIDTH = 120.0
const TERRAIN_HEIGHT = 286.0
const WEST_LON = 92.26022
const EAST_LON = 93.43737
const NORTH_LAT = 24.52313
const SOUTH_LAT = 21.94005

func _physics_process(delta):
	# Apply standard gravity
	if not is_on_floor():
		velocity.y -= gravity * delta

	# Basic movement across Mizoram's mountain ranges
	var input_dir = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	var direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	if direction:
		velocity.x = direction.x * speed
		velocity.z = direction.z * speed
	else:
		velocity.x = move_toward(velocity.x, 0, speed)
		velocity.z = move_toward(velocity.z, 0, speed)

	move_and_slide()
	
	# Optional: Query real-world GPS coordinates from 3D position
	var gps = get_gps_coordinates(global_position)
	# print("Current Location: Lat %0.4f, Lon %0.4f" % [gps.lat, gps.lon])

func get_gps_coordinates(pos: Vector3) -> Dictionary:
	var u = clamp((pos.x + TERRAIN_WIDTH * 0.5) / TERRAIN_WIDTH, 0.0, 1.0)
	var v = clamp((pos.z + TERRAIN_HEIGHT * 0.5) / TERRAIN_HEIGHT, 0.0, 1.0)
	var lon = WEST_LON + u * (EAST_LON - WEST_LON)
	var lat = NORTH_LAT - v * (NORTH_LAT - SOUTH_LAT)
	return {"lat": lat, "lon": lon}
`;

  const copyCode = () => {
    navigator.clipboard.writeText(gdscriptSample);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              G
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Godot Engine 4.x & 3.x Import Guide</h3>
              <p className="text-xs text-slate-400">Step-by-step setup for bringing the Mizoram 3D asset into Godot</p>
            </div>
          </div>

          <button
            id="btn-close-godot-guide"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-xs leading-relaxed">
          {/* 4 Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">1</span>
                <span>Drag .GLB into Godot</span>
              </div>
              <p className="text-slate-400">
                Download <strong>mizoram_terrain.glb</strong> and drag it directly into your Godot project's FileSystem dock (<code className="bg-slate-900 px-1 py-0.5 rounded text-slate-200">res://</code>). Godot will automatically import the geometry and embedded 2048x1024 district texture.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">2</span>
                <span>Instance in 3D Scene</span>
              </div>
              <p className="text-slate-400">
                Create a new 3D Scene (Node3D). Drag <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-200">mizoram_terrain.glb</code> from the FileSystem into your Scene Tree. You will instantly see the mountain ranges with district lines visible.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">3</span>
                <span>1-Click Collision Shape</span>
              </div>
              <p className="text-slate-400">
                Select the mesh node in Godot. In the top 3D toolbar, click <strong>Mesh</strong> &rarr; <strong>Create Trimesh Static Body</strong>. Godot will automatically generate exact concave polygon physics collisions matching every valley and peak!
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">4</span>
                <span>Lighting & Camera</span>
              </div>
              <p className="text-slate-400">
                Add a <strong>DirectionalLight3D</strong> to cast realistic ridge shadows across the V-shaped valleys, and a <strong>Camera3D</strong> or character body to explore. You can also use our pre-built <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-200">MizoramTerrain.tscn</code>!
              </p>
            </div>
          </div>

          {/* GDScript Code Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Sample GDScript (Character Movement & GPS Coordinate Mapping)</span>
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto text-[11px] font-mono text-slate-300 leading-relaxed max-h-56">
              {gdscriptSample}
            </pre>
          </div>

          {/* District Color & Geographic reference */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
            <h4 className="font-bold text-white text-xs">Geographic & Scale Parameters in Godot:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px] text-slate-300">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">Mesh Width (X)</div>
                <div className="font-bold text-white">120 units (~120 km)</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">Mesh Height (Z)</div>
                <div className="font-bold text-white">286 units (~286 km)</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">Phawngpui Summit</div>
                <div className="font-bold text-amber-400">2,157m (5.4 units)</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">Texture UV</div>
                <div className="font-bold text-emerald-400">2048 x 1024 Baked</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow transition-colors"
          >
            Got it, Let's Build!
          </button>
        </div>
      </div>
    </div>
  );
};
