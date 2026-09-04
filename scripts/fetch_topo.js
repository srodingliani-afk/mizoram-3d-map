import fs from 'fs';

async function run() {
  const r = await fetch("https://en-in.topographic-map.com/?_path=api._js&files=templates.default%2Capps.map.home%2Cmodules.advertisement%2Cmodules.map%2Cmodules.breadcrumb&version=202608311320", {
    headers: {"User-Agent": "Mozilla/5.0"}
  });
  const js = await r.text();
  const tilePatterns = js.match(/https?:\/\/[^"'\s`]+\{[xyz]\}[^"'\s`]*/g) || [];
  console.log("Tile patterns:", tilePatterns);
  const m = js.match(/https?:\/\/[a-z0-9.-]+\/maps\/[a-z0-9/_-]+/g) || [];
  console.log("Map URLs:", Array.from(new Set(m)).slice(0, 10));
}
run();
