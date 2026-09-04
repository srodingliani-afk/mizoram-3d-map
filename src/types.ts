export interface GeoBounds {
  north: number;
  south: number;
  west: number;
  east: number;
}

export interface Landmark {
  name: string;
  lat: number;
  lon: number;
  elevation: number;
  type: 'peak' | 'city' | 'capital';
  district: string;
}

export interface DistrictInfo {
  name: string;
  color: string;
  hq: string;
  areaKm2: number;
  pop: number;
}

export interface TerrainData {
  bounds: GeoBounds;
  gridCols: number;
  gridRows: number;
  stats: {
    minElevation: number;
    maxElevation: number;
    avgElevation: number;
  };
  landmarks: Landmark[];
  districts: DistrictInfo[];
  elevations: number[];
  mask: number[];
}

export type TextureMode = 'district' | 'hypsometric' | 'hybrid' | 'solid';

export type MeshResolution = 'low' | 'medium' | 'high';

export interface ViewportSettings {
  exaggeration: number;
  resolution: MeshResolution;
  textureMode: TextureMode;
  wireframe: boolean;
  showLandmarks: boolean;
  showStateCutout: boolean;
  sunAngle: number; // 0..360
  sunElevation: number; // 10..90
  roughness: number;
}
