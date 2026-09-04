function lon2tile(lon, zoom) {
  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}
function lat2tile(lat, zoom) {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
}

const zoom = 8;
const minX = lon2tile(92.26022, zoom);
const maxX = lon2tile(93.43737, zoom);
const minY = lat2tile(24.52313, zoom);
const maxY = lat2tile(21.94005, zoom);

console.log(`Zoom ${zoom}: X range [${minX}..${maxX}], Y range [${minY}..${maxY}]`);

async function testTile() {
  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${zoom}/${minX}/${minY}.png`;
  console.log("Testing:", url);
  try {
    const res = await fetch(url);
    console.log("Status:", res.status, "Length:", res.headers.get("content-length"));
  } catch (err) {
    console.error("Fetch err:", err);
  }
}
testTile();
