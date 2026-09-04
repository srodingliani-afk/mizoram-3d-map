import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { TerrainData, MeshResolution } from '../types';

export const TERRAIN_WIDTH = 120; // 3D units corresponding to ~120 km width
export const TERRAIN_HEIGHT = 286; // 3D units corresponding to ~286 km height

export function getResolutionDims(res: MeshResolution): { nx: number; ny: number } {
  switch (res) {
    case 'low':
      return { nx: 64, ny: 128 };
    case 'medium':
      return { nx: 128, ny: 256 };
    case 'high':
      return { nx: 200, ny: 400 };
  }
}

export function sampleElevation(data: TerrainData, u: number, v: number): number {
  const c = Math.max(0, Math.min(data.gridCols - 1, Math.round(u * (data.gridCols - 1))));
  const r = Math.max(0, Math.min(data.gridRows - 1, Math.round(v * (data.gridRows - 1))));
  const idx = r * data.gridCols + c;
  return data.elevations[idx] ?? 0;
}

export function sampleMask(data: TerrainData, u: number, v: number): number {
  const c = Math.max(0, Math.min(data.gridCols - 1, Math.round(u * (data.gridCols - 1))));
  const r = Math.max(0, Math.min(data.gridRows - 1, Math.round(v * (data.gridRows - 1))));
  const idx = r * data.gridCols + c;
  return data.mask[idx] ?? 0;
}

export function latLonTo3D(
  lat: number,
  lon: number,
  elevationM: number,
  data: TerrainData,
  exaggeration: number
): THREE.Vector3 {
  const u = (lon - data.bounds.west) / (data.bounds.east - data.bounds.west);
  const v = (data.bounds.north - lat) / (data.bounds.north - data.bounds.south);
  
  const x = -TERRAIN_WIDTH / 2 + u * TERRAIN_WIDTH;
  const z = -TERRAIN_HEIGHT / 2 + v * TERRAIN_HEIGHT;
  const y = (elevationM / 1000) * exaggeration;
  
  return new THREE.Vector3(x, y, z);
}

export function buildTerrainGeometry(
  data: TerrainData,
  res: MeshResolution,
  exaggeration: number,
  cutout = false
): THREE.BufferGeometry {
  const { nx, ny } = getResolutionDims(res);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const baseElevationScale = exaggeration;

  for (let j = 0; j < ny; j++) {
    const v = j / (ny - 1);
    const z = -TERRAIN_HEIGHT / 2 + v * TERRAIN_HEIGHT;
    for (let i = 0; i < nx; i++) {
      const u = i / (nx - 1);
      const x = -TERRAIN_WIDTH / 2 + u * TERRAIN_WIDTH;
      
      const elevM = sampleElevation(data, u, v);
      const isInside = sampleMask(data, u, v);

      let y = (elevM / 1000) * baseElevationScale;
      if (cutout && !isInside) {
        // Drop outside terrain to base level
        y = -0.5;
      }

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const p0 = j * nx + i;
      const p1 = j * nx + (i + 1);
      const p2 = (j + 1) * nx + i;
      const p3 = (j + 1) * nx + (i + 1);

      indices.push(p0, p2, p1);
      indices.push(p1, p2, p3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function createHypsometricCanvas(data: TerrainData, width = 512, height = 1024): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imgData = ctx.createImageData(width, height);
  const { minElevation, maxElevation } = data.stats;
  const range = (maxElevation - minElevation) || 1;

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      const elev = sampleElevation(data, u, v);
      const isInside = sampleMask(data, u, v);

      const t = Math.max(0, Math.min(1, (elev - minElevation) / range));
      let r = 0, g = 0, b = 0;

      if (!isInside) {
        // Muted gray-green for surrounding areas
        r = 180; g = 190; b = 185;
      } else {
        // Natural topographic hypsometric color ramp
        if (t < 0.15) {
          // Low valleys (< 350m): Deep forest green
          const s = t / 0.15;
          r = Math.round(35 + s * 45);
          g = Math.round(110 + s * 30);
          b = Math.round(45 + s * 20);
        } else if (t < 0.35) {
          // Foothills (350m - 750m): Olive yellow-green
          const s = (t - 0.15) / 0.2;
          r = Math.round(80 + s * 95);
          g = Math.round(140 + s * 40);
          b = Math.round(65 - s * 25);
        } else if (t < 0.6) {
          // Mid ridges (750m - 1300m): Ochre / amber
          const s = (t - 0.35) / 0.25;
          r = Math.round(175 + s * 45);
          g = Math.round(180 - s * 60);
          b = Math.round(40 + s * 10);
        } else if (t < 0.85) {
          // High Patkai ranges (1300m - 1800m): Terra cotta / reddish brown
          const s = (t - 0.6) / 0.25;
          r = Math.round(220 - s * 40);
          g = Math.round(120 - s * 55);
          b = Math.round(50 + s * 30);
        } else {
          // Phawngpui Blue Mountain & high peaks (> 1800m): Cool mountain purple/crest
          const s = (t - 0.85) / 0.15;
          r = Math.round(180 + s * 55);
          g = Math.round(65 + s * 165);
          b = Math.round(80 + s * 160);
        }

        // Add subtle contour lines every ~100m
        if (Math.abs(elev % 100) < 6) {
          r = Math.round(r * 0.82);
          g = Math.round(g * 0.82);
          b = Math.round(b * 0.82);
        }
      }

      const idx = (y * width + x) * 4;
      imgData.data[idx] = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function exportMeshToGLB(mesh: THREE.Mesh): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      mesh,
      (gltf) => {
        if (gltf instanceof ArrayBuffer) {
          resolve(new Blob([gltf], { type: 'model/gltf-binary' }));
        } else {
          const output = JSON.stringify(gltf, null, 2);
          resolve(new Blob([output], { type: 'application/json' }));
        }
      },
      (error) => reject(error),
      { binary: true }
    );
  });
}

export function exportMeshToOBJ(mesh: THREE.Mesh): string {
  const exporter = new OBJExporter();
  return exporter.parse(mesh);
}
