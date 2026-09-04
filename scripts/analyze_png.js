import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('public/Districts_of_Mizoram_2021.png');
const png = PNG.sync.read(data);

console.log(`Dimensions: ${png.width} x ${png.height}`);

// Let's find non-white or colored pixels
// White is rgb > 250, 250, 250
let minX = png.width, maxX = 0, minY = png.height, maxY = 0;
let titlePixels = 0;
let footerPixels = 0;

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) << 2;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    const a = png.data[idx + 3];

    // Check if not white and not transparent
    const isNotWhite = a > 50 && !(r > 245 && g > 245 && b > 245);
    if (isNotWhite) {
      if (y < 80) {
        titlePixels++;
      } else if (y > 1400 && x < 500) {
        footerPixels++;
      } else {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
}

console.log(`Mizoram map bounding box: x in [${minX}, ${maxX}] (width: ${maxX - minX}), y in [${minY}, ${maxY}] (height: ${maxY - minY})`);
console.log(`Title pixels: ${titlePixels}, footer pixels: ${footerPixels}`);
