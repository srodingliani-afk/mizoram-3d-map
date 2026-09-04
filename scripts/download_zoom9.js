import fs from 'fs';
import { PNG } from 'pngjs';

function lon2tile(lon, zoom) {
  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}
function lat2tile(lat, zoom) {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
}

async function fetchTile(z, x, y) {
  const cachePath = `public/assets/tile_${z}_${x}_${y}.png`;
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath);
  }
  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(cachePath, buf);
  return buf;
}

async function run() {
  const zoom = 9;
  const minX = lon2tile(92.26022, zoom);
  const maxX = lon2tile(93.43737, zoom);
  const minY = lat2tile(24.52313, zoom);
  const maxY = lat2tile(21.94005, zoom);

  console.log(`Zoom 9 tiles: X[${minX}..${maxX}], Y[${minY}..${maxY}] (${(maxX-minX+1)*(maxY-minY+1)} tiles)`);
  
  const promises = [];
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      promises.push(fetchTile(zoom, x, y));
    }
  }
  await Promise.all(promises);
  console.log("All Zoom 9 elevation tiles downloaded!");
}

run().catch(console.error);
