import fs from 'fs';
import { PNG } from 'pngjs';

// Coordinates of Mizoram
const BOUNDS = {
  north: 24.52313,
  south: 21.94005,
  west: 92.26022,
  east: 93.43737
};

// State pixel bounds in Districts_of_Mizoram_(2021).png (1240 x 1476)
const IMG_CROP = {
  minX: 348,
  maxX: 891,
  minY: 90,
  maxY: 1389
};

const srcPng = PNG.sync.read(fs.readFileSync('public/Districts_of_Mizoram_2021.png'));

// 1. Create cropped district texture (1024 x 2048 for GPU / Godot optimal power of two)
const texWidth = 1024;
const texHeight = 2048;
const dstPng = new PNG({ width: texWidth, height: texHeight });

// Function to sample srcPng with bilinear filtering
function sampleSrc(u, v) {
  const srcX = IMG_CROP.minX + u * (IMG_CROP.maxX - IMG_CROP.minX);
  const srcY = IMG_CROP.minY + v * (IMG_CROP.maxY - IMG_CROP.minY);
  
  const x0 = Math.max(0, Math.min(srcPng.width - 1, Math.floor(srcX)));
  const x1 = Math.max(0, Math.min(srcPng.width - 1, Math.ceil(srcX)));
  const y0 = Math.max(0, Math.min(srcPng.height - 1, Math.floor(srcY)));
  const y1 = Math.max(0, Math.min(srcPng.height - 1, Math.ceil(srcY)));
  
  const fx = srcX - x0;
  const fy = srcY - y0;

  function getPixel(x, y) {
    const idx = (srcPng.width * y + x) << 2;
    return [srcPng.data[idx], srcPng.data[idx + 1], srcPng.data[idx + 2], srcPng.data[idx + 3]];
  }

  const p00 = getPixel(x0, y0);
  const p10 = getPixel(x1, y0);
  const p01 = getPixel(x0, y1);
  const p11 = getPixel(x1, y1);

  const r = (1 - fx) * (1 - fy) * p00[0] + fx * (1 - fy) * p10[0] + (1 - fx) * fy * p01[0] + fx * fy * p11[0];
  const g = (1 - fx) * (1 - fy) * p00[1] + fx * (1 - fy) * p10[1] + (1 - fx) * fy * p01[1] + fx * fy * p11[1];
  const b = (1 - fx) * (1 - fy) * p00[2] + fx * (1 - fy) * p10[2] + (1 - fx) * fy * p01[2] + fx * fy * p11[2];
  const a = (1 - fx) * (1 - fy) * p00[3] + fx * (1 - fy) * p10[3] + (1 - fx) * fy * p01[3] + fx * fy * p11[3];

  return [Math.round(r), Math.round(g), Math.round(b), Math.round(a)];
}

for (let y = 0; y < texHeight; y++) {
  const v = y / (texHeight - 1);
  for (let x = 0; x < texWidth; x++) {
    const u = x / (texWidth - 1);
    const [r, g, b, a] = sampleSrc(u, v);
    const dstIdx = (texWidth * y + x) << 2;
    
    // Check if background white (outside state)
    const isOutside = (r > 248 && g > 248 && b > 248);
    dstPng.data[dstIdx] = r;
    dstPng.data[dstIdx + 1] = g;
    dstPng.data[dstIdx + 2] = b;
    dstPng.data[dstIdx + 3] = isOutside ? 0 : 255;
  }
}

fs.writeFileSync('public/mizoram_district_texture.png', PNG.sync.write(dstPng));
console.log('Saved public/mizoram_district_texture.png (1024x2048)');

// Also make a version with solid white or subtle background for engines that prefer RGB without alpha cutout
const solidPng = new PNG({ width: texWidth, height: texHeight });
for (let y = 0; y < texHeight; y++) {
  const v = y / (texHeight - 1);
  for (let x = 0; x < texWidth; x++) {
    const u = x / (texWidth - 1);
    const [r, g, b] = sampleSrc(u, v);
    const dstIdx = (texWidth * y + x) << 2;
    solidPng.data[dstIdx] = r;
    solidPng.data[dstIdx + 1] = g;
    solidPng.data[dstIdx + 2] = b;
    solidPng.data[dstIdx + 3] = 255;
  }
}
fs.writeFileSync('public/mizoram_district_texture_solid.png', PNG.sync.write(solidPng));
console.log('Saved public/mizoram_district_texture_solid.png');

// 2. Load Elevation tiles and construct elevation grid
const zoom = 9;
const tileCache = {};
for (let x = 387; x <= 388; x++) {
  for (let y = 220; y <= 224; y++) {
    const file = `public/assets/tile_${zoom}_${x}_${y}.png`;
    tileCache[`${x}_${y}`] = PNG.sync.read(fs.readFileSync(file));
  }
}

function lon2tileFloat(lon, zoom) {
  return (lon + 180) / 360 * Math.pow(2, zoom);
}
function lat2tileFloat(lat, zoom) {
  return (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
}

function getElevation(lat, lon) {
  const xf = lon2tileFloat(lon, zoom);
  const yf = lat2tileFloat(lat, zoom);
  const tileX = Math.floor(xf);
  const tileY = Math.floor(yf);
  const tile = tileCache[`${tileX}_${tileY}`];
  if (!tile) return 0;
  const px = Math.min(255, Math.max(0, Math.floor((xf - tileX) * 256)));
  const py = Math.min(255, Math.max(0, Math.floor((yf - tileY) * 256)));
  const idx = (tile.width * py + px) << 2;
  const r = tile.data[idx];
  const g = tile.data[idx + 1];
  const b = tile.data[idx + 2];
  return (r * 256 + g + b / 256) - 32768;
}

// Check mask (is point inside state) based on whether sampled texture is not white
function isInsideState(u, v) {
  const [r, g, b] = sampleSrc(u, v);
  return !(r > 248 && g > 248 && b > 248);
}

// Generate high resolution grid: 256 cols (E-W) x 512 rows (N-S)
const gridCols = 256;
const gridRows = 512;
const elevations = new Float32Array(gridCols * gridRows);
const mask = new Uint8Array(gridCols * gridRows);

let minE = Infinity, maxE = -Infinity, sumE = 0, countE = 0;

for (let r = 0; r < gridRows; r++) {
  const v = r / (gridRows - 1);
  const lat = BOUNDS.north - v * (BOUNDS.north - BOUNDS.south);
  for (let c = 0; c < gridCols; c++) {
    const u = c / (gridCols - 1);
    const lon = BOUNDS.west + u * (BOUNDS.east - BOUNDS.west);
    const elev = getElevation(lat, lon);
    const inside = isInsideState(u, v) ? 1 : 0;
    
    const idx = r * gridCols + c;
    elevations[idx] = Math.round(elev * 10) / 10;
    mask[idx] = inside;

    if (inside) {
      if (elev < minE) minE = elev;
      if (elev > maxE) maxE = elev;
      sumE += elev;
      countE++;
    }
  }
}

console.log(`Grid generated: ${gridCols} x ${gridRows}`);
console.log(`Inside Mizoram elevation: min = ${minE.toFixed(1)}m, max = ${maxE.toFixed(1)}m, avg = ${(sumE/countE).toFixed(1)}m`);

// Create 16-bit Heightmap PNG
const heightPng = new PNG({ width: gridCols, height: gridRows, colorType: 0, inputColorType: 0, bitDepth: 8 });
// For 8-bit heightmap png preview:
for (let r = 0; r < gridRows; r++) {
  for (let c = 0; c < gridCols; c++) {
    const idx = r * gridCols + c;
    const elev = elevations[idx];
    const norm = Math.max(0, Math.min(255, Math.floor(((elev - 0) / 2500) * 255)));
    const pIdx = (gridCols * r + c) << 2;
    heightPng.data[pIdx] = norm;
    heightPng.data[pIdx + 1] = norm;
    heightPng.data[pIdx + 2] = norm;
    heightPng.data[pIdx + 3] = 255;
  }
}
fs.writeFileSync('public/mizoram_heightmap.png', PNG.sync.write(heightPng));
console.log('Saved public/mizoram_heightmap.png');

// Save JSON dataset
const landmarks = [
  { name: "Phawngpui (Blue Mountain)", lat: 22.6317, lon: 93.0489, elevation: 2157, type: "peak", district: "Lawngtlai" },
  { name: "Lengteng Peak", lat: 23.5936, lon: 93.2167, elevation: 2141, type: "peak", district: "Champhai" },
  { name: "Lurh Peak", lat: 23.6333, lon: 93.3000, elevation: 2112, type: "peak", district: "Champhai" },
  { name: "Reiek Tlang", lat: 23.6872, lon: 92.5978, elevation: 1548, type: "peak", district: "Mamit" },
  { name: "Hmuifang Tlang", lat: 23.4539, lon: 92.7522, elevation: 1619, type: "peak", district: "Aizawl" },
  { name: "Aizawl (Capital)", lat: 23.7271, lon: 92.7176, elevation: 1132, type: "capital", district: "Aizawl" },
  { name: "Lunglei", lat: 22.8872, lon: 92.7441, elevation: 722, type: "city", district: "Lunglei" },
  { name: "Champhai", lat: 23.4757, lon: 93.3276, elevation: 1350, type: "city", district: "Champhai" },
  { name: "Kolasib", lat: 24.2246, lon: 92.6784, elevation: 600, type: "city", district: "Kolasib" },
  { name: "Saiha (Siaha)", lat: 22.4897, lon: 92.9793, elevation: 729, type: "city", district: "Saiha" },
  { name: "Lawngtlai", lat: 22.5283, lon: 92.8986, elevation: 840, type: "city", district: "Lawngtlai" },
  { name: "Mamit", lat: 23.9294, lon: 92.4906, elevation: 718, type: "city", district: "Mamit" },
  { name: "Serchhip", lat: 23.3411, lon: 92.8500, elevation: 882, type: "city", district: "Serchhip" },
  { name: "Saitual", lat: 23.9700, lon: 92.9800, elevation: 1200, type: "city", district: "Saitual" },
  { name: "Khawzawl", lat: 23.5350, lon: 93.1850, elevation: 1190, type: "city", district: "Khawzawl" },
  { name: "Hnahthial", lat: 22.9667, lon: 92.9333, elevation: 900, type: "city", district: "Hnahthial" }
];

const districts = [
  { name: "Aizawl", color: "#F5C800", hq: "Aizawl", areaKm2: 3576, pop: 400309 },
  { name: "Lunglei", color: "#2B4C7E", hq: "Lunglei", areaKm2: 4536, pop: 161428 },
  { name: "Champhai", color: "#0D869D", hq: "Champhai", areaKm2: 3185, pop: 125745 },
  { name: "Mamit (MA)", color: "#78B4F2", hq: "Mamit", areaKm2: 3025, pop: 86364 },
  { name: "Kolasib", color: "#A83636", hq: "Kolasib", areaKm2: 1282, pop: 83954 },
  { name: "Lawngtlai", color: "#E86F28", hq: "Lawngtlai", areaKm2: 2557, pop: 117894 },
  { name: "Saiha (Siaha)", color: "#89E6BE", hq: "Saiha", areaKm2: 1399, pop: 56574 },
  { name: "Serchhip", color: "#E2E2E2", hq: "Serchhip", areaKm2: 1421, pop: 64937 },
  { name: "Saitual", color: "#F7DE42", hq: "Saitual", areaKm2: 1494, pop: 50575 },
  { name: "Khawzawl", color: "#B8B508", hq: "Khawzawl", areaKm2: 805, pop: 33482 },
  { name: "Hnahthial", color: "#00C4B4", hq: "Hnahthial", areaKm2: 1922, pop: 28468 }
];

// Pack heights to base64 or array
const terrainData = {
  bounds: BOUNDS,
  gridCols,
  gridRows,
  stats: {
    minElevation: Math.round(minE),
    maxElevation: Math.round(maxE),
    avgElevation: Math.round(sumE / countE)
  },
  landmarks,
  districts,
  // We can serialize elevations and mask efficiently
  elevations: Array.from(elevations),
  mask: Array.from(mask)
};

fs.writeFileSync('public/mizoram_terrain_data.json', JSON.stringify(terrainData));
console.log('Saved public/mizoram_terrain_data.json (' + (fs.statSync('public/mizoram_terrain_data.json').size / 1024 / 1024).toFixed(2) + ' MB)');
