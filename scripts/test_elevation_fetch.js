import fs from 'fs';
import { PNG } from 'pngjs';

function lon2tile(lon, zoom) {
  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}
function lat2tile(lat, zoom) {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
}
function tile2lon(x, z) {
  return x / Math.pow(2, z) * 360 - 180;
}
function tile2lat(y, z) {
  const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

async function fetchTile(z, x, y) {
  const cachePath = `public/assets/tile_${z}_${x}_${y}.png`;
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath);
  }
  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
  console.log("Fetching", url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(cachePath, buf);
  return buf;
}

async function run() {
  const zoom = 8;
  const minX = lon2tile(92.26022, zoom);
  const maxX = lon2tile(93.43737, zoom);
  const minY = lat2tile(24.52313, zoom);
  const maxY = lat2tile(21.94005, zoom);

  console.log(`Tiles to fetch: X[${minX}..${maxX}], Y[${minY}..${maxY}]`);
  
  let minElev = Infinity, maxElev = -Infinity;
  const tiles = {};

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const buf = await fetchTile(zoom, x, y);
      const png = PNG.sync.read(buf);
      tiles[`${x}_${y}`] = png;
      for (let i = 0; i < png.data.length; i += 4) {
        const r = png.data[i];
        const g = png.data[i + 1];
        const b = png.data[i + 2];
        const elev = (r * 256 + g + b / 256) - 32768;
        if (elev < minElev) minElev = elev;
        if (elev > maxElev) maxElev = elev;
      }
    }
  }

  console.log(`Elevation range across tiles: min = ${minElev.toFixed(1)}m, max = ${maxElev.toFixed(1)}m`);
}

run().catch(console.error);
