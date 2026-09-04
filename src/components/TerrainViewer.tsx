import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TerrainData, ViewportSettings, Landmark } from '../types';
import {
  buildTerrainGeometry,
  createHypsometricCanvas,
  latLonTo3D,
  TERRAIN_WIDTH,
  TERRAIN_HEIGHT
} from '../utils/terrainBuilder';
import {
  Eye,
  Layers,
  Sun,
  Maximize2,
  Minimize2,
  Compass,
  Mountain,
  MapPin,
  RotateCcw
} from 'lucide-react';

interface TerrainViewerProps {
  data: TerrainData;
  settings: ViewportSettings;
  onUpdateSettings: (settings: Partial<ViewportSettings>) => void;
  selectedLandmark: Landmark | null;
  onSelectLandmark: (landmark: Landmark | null) => void;
  onMeshReady?: (mesh: THREE.Mesh) => void;
}

export const TerrainViewer: React.FC<TerrainViewerProps> = ({
  data,
  settings,
  onUpdateSettings,
  selectedLandmark,
  onSelectLandmark,
  onMeshReady
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Cached textures
  const districtTextureRef = useRef<THREE.Texture | null>(null);
  const solidTextureRef = useRef<THREE.Texture | null>(null);
  const hypsometricTextureRef = useRef<THREE.CanvasTexture | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('iso');
  const [screenCoords, setScreenCoords] = useState<{ [name: string]: { x: number; y: number; visible: boolean } }>({});

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Deep slate neutral for high contrast
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 2000);
    camera.position.set(-90, 160, 240);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, canvasRef.current);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 600;
    controls.minDistance = 20;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go below horizon
    controls.target.set(0, 10, 0);
    controlsRef.current = controls;

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Directional Sun Light
    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    sunLight.position.set(100, 150, 80);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 600;
    const d = 180;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Subtle Grid Base Plane
    const grid = new THREE.GridHelper(400, 40, 0x334155, 0x1e293b);
    grid.position.y = -1;
    scene.add(grid);

    // Load District Textures
    const texLoader = new THREE.TextureLoader();
    texLoader.load('/mizoram_district_texture.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      districtTextureRef.current = tex;
      if (meshRef.current && settings.textureMode === 'district') {
        (meshRef.current.material as THREE.MeshStandardMaterial).map = tex;
        (meshRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
      }
    });

    texLoader.load('/mizoram_district_texture_solid.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      solidTextureRef.current = tex;
    });

    // Create Hypsometric texture
    const hypoCanvas = createHypsometricCanvas(data);
    const hypoTex = new THREE.CanvasTexture(hypoCanvas);
    hypoTex.colorSpace = THREE.SRGBColorSpace;
    hypsometricTextureRef.current = hypoTex;

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);

      // Update projected screen positions for landmarks
      if (cameraRef.current && containerRef.current && meshRef.current) {
        const tempV = new THREE.Vector3();
        const coords: { [name: string]: { x: number; y: number; visible: boolean } } = {};
        const cWidth = containerRef.current.clientWidth;
        const cHeight = containerRef.current.clientHeight;

        for (const lm of data.landmarks) {
          const pt = latLonTo3D(lm.lat, lm.lon, lm.elevation, data, settings.exaggeration);
          tempV.copy(pt);
          tempV.y += 2; // Elevate slightly above terrain
          tempV.project(cameraRef.current);

          const isBehind = tempV.z > 1;
          const x = (tempV.x * 0.5 + 0.5) * cWidth;
          const y = (-tempV.y * 0.5 + 0.5) * cHeight;
          const inside = x >= 0 && x <= cWidth && y >= 0 && y <= cHeight;

          coords[lm.name] = { x, y, visible: !isBehind && inside };
        }
        setScreenCoords(coords);
      }
    };
    animate();

    // Resize Observer
    const ro = new ResizeObserver(() => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    ro.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
      controls.dispose();
    };
  }, [data]);

  // Update Sun Lighting
  useEffect(() => {
    if (!sunLightRef.current) return;
    const rad = (settings.sunAngle * Math.PI) / 180;
    const elevRad = (settings.sunElevation * Math.PI) / 180;
    const dist = 220;
    const x = dist * Math.cos(rad) * Math.cos(elevRad);
    const z = dist * Math.sin(rad) * Math.cos(elevRad);
    const y = dist * Math.sin(elevRad);
    sunLightRef.current.position.set(x, y, z);
  }, [settings.sunAngle, settings.sunElevation]);

  // Update Geometry and Material when resolution, exaggeration, cutout, or textureMode changes
  useEffect(() => {
    if (!sceneRef.current) return;

    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      (meshRef.current.material as THREE.Material).dispose();
      meshRef.current = null;
    }

    const geometry = buildTerrainGeometry(
      data,
      settings.resolution,
      settings.exaggeration,
      settings.showStateCutout
    );

    let activeTex: THREE.Texture | null = null;
    if (settings.textureMode === 'district') {
      activeTex = districtTextureRef.current;
    } else if (settings.textureMode === 'hypsometric') {
      activeTex = hypsometricTextureRef.current;
    } else if (settings.textureMode === 'solid') {
      activeTex = solidTextureRef.current;
    }

    const material = new THREE.MeshStandardMaterial({
      map: activeTex,
      wireframe: settings.wireframe,
      roughness: settings.roughness,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'Mizoram_Terrain';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sceneRef.current.add(mesh);
    meshRef.current = mesh;

    if (onMeshReady) {
      onMeshReady(mesh);
    }
  }, [data, settings.resolution, settings.exaggeration, settings.showStateCutout, settings.wireframe, settings.textureMode, settings.roughness, onMeshReady]);

  // Animate Camera to Selected Landmark
  useEffect(() => {
    if (!selectedLandmark || !controlsRef.current || !cameraRef.current) return;
    const pt = latLonTo3D(
      selectedLandmark.lat,
      selectedLandmark.lon,
      selectedLandmark.elevation,
      data,
      settings.exaggeration
    );

    const targetPos = pt.clone();
    const camTarget = pt.clone().add(new THREE.Vector3(25, 35, 45));

    let start = performance.now();
    const duration = 800;
    const initialCamPos = cameraRef.current.position.clone();
    const initialTarget = controlsRef.current.target.clone();

    const fly = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const ease = 0.5 - 0.5 * Math.cos(Math.PI * p);

      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerpVectors(initialCamPos, camTarget, ease);
        controlsRef.current.target.lerpVectors(initialTarget, targetPos, ease);
      }

      if (p < 1) {
        requestAnimationFrame(fly);
      }
    };
    requestAnimationFrame(fly);
  }, [selectedLandmark, data, settings.exaggeration]);

  // Camera presets
  const setCameraPreset = useCallback(
    (preset: 'iso' | 'top' | 'south' | 'ridges') => {
      if (!cameraRef.current || !controlsRef.current) return;
      setActivePreset(preset);
      const target = new THREE.Vector3(0, 10, 0);

      switch (preset) {
        case 'iso':
          cameraRef.current.position.set(-90, 150, 210);
          break;
        case 'top':
          cameraRef.current.position.set(0, 260, 0.01);
          break;
        case 'south':
          // Viewing from south towards north along the Patkai ridges
          cameraRef.current.position.set(0, 70, 220);
          break;
        case 'ridges':
          // Low grazing angle showing razorback mountain crests
          cameraRef.current.position.set(-110, 45, 60);
          break;
      }
      controlsRef.current.target.copy(target);
    },
    []
  );

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <div
      ref={containerRef}
      id="terrain-viewer-container"
      className="relative w-full h-full min-h-[500px] overflow-hidden bg-slate-950 select-none"
    >
      <canvas ref={canvasRef} id="terrain-canvas" className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Top Floating Viewport Control Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Viewport Presets */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl pointer-events-auto">
          <button
            id="btn-preset-iso"
            type="button"
            onClick={() => setCameraPreset('iso')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activePreset === 'iso' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Perspective 3D
          </button>
          <button
            id="btn-preset-top"
            type="button"
            onClick={() => setCameraPreset('top')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activePreset === 'top' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Top-Down Map
          </button>
          <button
            id="btn-preset-south"
            type="button"
            onClick={() => setCameraPreset('south')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activePreset === 'south' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            South Patkai View
          </button>
          <button
            id="btn-preset-ridges"
            type="button"
            onClick={() => setCameraPreset('ridges')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activePreset === 'ridges' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Parallel Ridges
          </button>
        </div>

        {/* Right: Display Mode Toggles */}
        <div className="flex items-center gap-2 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl pointer-events-auto">
          {/* Texture selector */}
          <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5">
            <button
              id="btn-tex-district"
              type="button"
              onClick={() => onUpdateSettings({ textureMode: 'district' })}
              title="Baked District Map (User's Map with Colors and Lines)"
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                settings.textureMode === 'district' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              District Map
            </button>
            <button
              id="btn-tex-hypo"
              type="button"
              onClick={() => onUpdateSettings({ textureMode: 'hypsometric' })}
              title="Topographic Elevation Hypsometric Tints"
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                settings.textureMode === 'hypsometric' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Elevation Topo
            </button>
          </div>

          {/* Wireframe Toggle */}
          <button
            id="btn-toggle-wireframe"
            type="button"
            onClick={() => onUpdateSettings({ wireframe: !settings.wireframe })}
            title="Toggle Wireframe Triangles"
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              settings.wireframe ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Landmarks Toggle */}
          <button
            id="btn-toggle-landmarks"
            type="button"
            onClick={() => onUpdateSettings({ showLandmarks: !settings.showLandmarks })}
            title="Toggle Peak & District Labels in 3D"
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              settings.showLandmarks ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            id="btn-toggle-fullscreen"
            type="button"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3D Projected Interactive Landmark Badges */}
      {settings.showLandmarks &&
        data.landmarks.map((lm) => {
          const coord = screenCoords[lm.name];
          if (!coord || !coord.visible) return null;

          const isSelected = selectedLandmark?.name === lm.name;
          const isPeak = lm.type === 'peak';

          return (
            <div
              key={lm.name}
              id={`landmark-marker-${lm.name.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => onSelectLandmark(isSelected ? null : lm)}
              style={{
                left: `${coord.x}px`,
                top: `${coord.y}px`,
                transform: 'translate(-50%, -100%)'
              }}
              className={`absolute cursor-pointer transition-transform pointer-events-auto group z-20 ${
                isSelected ? 'scale-110' : 'hover:scale-105'
              }`}
            >
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-tight shadow-lg border backdrop-blur-md ${
                  isPeak
                    ? isSelected
                      ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50'
                      : 'bg-slate-900/90 text-amber-300 border-amber-500/60'
                    : isSelected
                    ? 'bg-indigo-500 text-white border-indigo-300 ring-2 ring-indigo-400/50'
                    : 'bg-slate-900/90 text-slate-200 border-slate-700'
                }`}
              >
                {isPeak ? <Mountain className="w-3 h-3 text-amber-400 shrink-0" /> : <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />}
                <span className="truncate max-w-[130px]">{lm.name.split(' ')[0]}</span>
                <span className="text-[10px] opacity-75 font-mono">{lm.elevation}m</span>
              </div>
              {/* Pin point anchor */}
              <div className="w-1.5 h-1.5 mx-auto bg-amber-400 rotate-45 -mt-0.5 rounded-[1px] shadow" />
            </div>
          );
        })}

      {/* Bottom Floating Stats & Quick Hint Overlay */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl text-xs text-slate-300 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Topography:</span>
            <span>SRTM 30m Real-world DEM</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div>
            <span className="text-slate-400">Peak:</span>{' '}
            <span className="font-bold text-amber-400">Phawngpui 2,157m</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div>
            <span className="text-slate-400">Exaggeration:</span>{' '}
            <span className="font-bold text-indigo-300">{settings.exaggeration.toFixed(1)}x</span>
          </div>
        </div>
      </div>

      {/* Orbit Navigation Hint */}
      <div className="absolute bottom-4 right-4 text-[11px] text-slate-400/90 bg-slate-900/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-800/80 pointer-events-none">
        Left-click + Drag to Orbit • Right-click to Pan • Scroll to Zoom
      </div>
    </div>
  );
};
