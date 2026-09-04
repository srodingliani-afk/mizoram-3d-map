import fs from 'fs';
import { PNG } from 'pngjs';

const png = PNG.sync.read(fs.readFileSync('public/Districts_of_Mizoram_2021.png'));

// Check bounds of state again
const minX = 348;
const maxX = 891;
const minY = 90;
const maxY = 1389;

console.log(`Image: ${png.width}x${png.height}`);
console.log(`State width: ${maxX - minX + 1}, height: ${maxY - minY + 1}`);

// Check whether we can create a cropped texture map of just the state
// Or create a square/aspect-ratio power-of-two texture (e.g. 1024x2048 or 2048x2048)
// with UV coordinates [0..1] x [0..1] exactly corresponding to Mizoram's geographic bounding box!
