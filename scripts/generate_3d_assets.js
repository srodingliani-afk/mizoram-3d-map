import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

// Load terrain data
const raw = fs.readFileSync('public/mizoram_terrain_data.json', 'utf8');
const data = JSON.parse(raw);

const exportDir = 'public/export';
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

// Resolution for exported 3D model
// 128 cols x 256 rows is a sweet spot (~32,768 vertices, ~65,000 triangles) - super responsive in Godot while retaining all mountain ridges!
// We will also generate high-res options.
const NX = 128;
const NY = 256;

// Width in 3D units: let's make it 120 units wide (representing 120 km)
// Height in 3D units: 286 units tall (representing 286 km)
// Max elevation: ~2.1 km -> with 2.5x exaggeration for striking game mountain ranges: 2.1 * 2.5 = 5.25 units
const terrainWidth = 120;
const terrainHeight = 286;
const verticalExaggeration = 2.5; // realistic yet distinct ridges
const baseElevationScale = (terrainWidth / 120) * verticalExaggeration;

// Helper to sample elevation from the 256x512 grid
function getGridElevation(u, v) {
  const c = Math.max(0, Math.min(data.gridCols - 1, Math.round(u * (data.gridCols - 1))));
  const r = Math.max(0, Math.min(data.gridRows - 1, Math.round(v * (data.gridRows - 1))));
  const idx = r * data.gridCols + c;
  return data.elevations[idx] || 0;
}

function getGridMask(u, v) {
  const c = Math.max(0, Math.min(data.gridCols - 1, Math.round(u * (data.gridCols - 1))));
  const r = Math.max(0, Math.min(data.gridRows - 1, Math.round(v * (data.gridRows - 1))));
  const idx = r * data.gridCols + c;
  return data.mask[idx] || 0;
}

// Build vertex buffer: positions, normals, uvs, indices
const positions = [];
const uvs = [];
const indices = [];

for (let j = 0; j < NY; j++) {
  const v = j / (NY - 1);
  // in 3D: z goes from -terrainHeight/2 (North) to +terrainHeight/2 (South)
  const z = -terrainHeight / 2 + v * terrainHeight;
  for (let i = 0; i < NX; i++) {
    const u = i / (NX - 1);
    // x goes from -terrainWidth/2 (West) to +terrainWidth/2 (East)
    const x = -terrainWidth / 2 + u * terrainWidth;
    
    const elevM = getGridElevation(u, v);
    // Elevation in kilometers * exaggeration
    const y = (elevM / 1000) * baseElevationScale;

    positions.push(x, y, z);
    uvs.push(u, v);
  }
}

// Triangles
for (let j = 0; j < NY - 1; j++) {
  for (let i = 0; i < NX - 1; i++) {
    const p0 = j * NX + i;
    const p1 = j * NX + (i + 1);
    const p2 = (j + 1) * NX + i;
    const p3 = (j + 1) * NX + (i + 1);

    // Two triangles per quad (counter-clockwise for CCW front faces)
    indices.push(p0, p2, p1);
    indices.push(p1, p2, p3);
  }
}

// Compute vertex normals
const normals = new Float32Array(positions.length);
for (let i = 0; i < indices.length; i += 3) {
  const i0 = indices[i];
  const i1 = indices[i + 1];
  const i2 = indices[i + 2];

  const v0x = positions[i0 * 3], v0y = positions[i0 * 3 + 1], v0z = positions[i0 * 3 + 2];
  const v1x = positions[i1 * 3], v1y = positions[i1 * 3 + 1], v1z = positions[i1 * 3 + 2];
  const v2x = positions[i2 * 3], v2y = positions[i2 * 3 + 1], v2z = positions[i2 * 3 + 2];

  const ax = v1x - v0x, ay = v1y - v0y, az = v1z - v0z;
  const bx = v2x - v0x, by = v2y - v0y, bz = v2z - v0z;

  const nx = ay * bz - az * by;
  const ny = az * bx - ax * bz;
  const nz = ax * by - ay * bx;

  normals[i0 * 3] += nx; normals[i0 * 3 + 1] += ny; normals[i0 * 3 + 2] += nz;
  normals[i1 * 3] += nx; normals[i1 * 3 + 1] += ny; normals[i1 * 3 + 2] += nz;
  normals[i2 * 3] += nx; normals[i2 * 3 + 1] += ny; normals[i2 * 3 + 2] += nz;
}

// Normalize normals
for (let i = 0; i < positions.length / 3; i++) {
  const nx = normals[i * 3], ny = normals[i * 3 + 1], nz = normals[i * 3 + 2];
  const len = Math.hypot(nx, ny, nz) || 1;
  normals[i * 3] = nx / len;
  normals[i * 3 + 1] = ny / len;
  normals[i * 3 + 2] = nz / len;
}

console.log(`Generated mesh: ${positions.length / 3} vertices, ${indices.length / 3} triangles`);

// 1. Generate OBJ & MTL
let objStr = `# Mizoram 3D Terrain Model for Godot Engine\n`;
objStr += `# Real-world SRTM Topography + Baked District Boundaries\n`;
objStr += `mtllib mizoram_terrain.mtl\n`;
objStr += `o Mizoram_Terrain\n`;

for (let i = 0; i < positions.length; i += 3) {
  objStr += `v ${positions[i].toFixed(4)} ${positions[i+1].toFixed(4)} ${positions[i+2].toFixed(4)}\n`;
}
for (let i = 0; i < uvs.length; i += 2) {
  // In OBJ, V=0 is bottom, so invert V
  objStr += `vt ${uvs[i].toFixed(4)} ${(1 - uvs[i+1]).toFixed(4)}\n`;
}
for (let i = 0; i < normals.length; i += 3) {
  objStr += `vn ${normals[i].toFixed(4)} ${normals[i+1].toFixed(4)} ${normals[i+2].toFixed(4)}\n`;
}
objStr += `usemtl Mizoram_District_Material\ns 1\n`;
for (let i = 0; i < indices.length; i += 3) {
  const i0 = indices[i] + 1;
  const i1 = indices[i + 1] + 1;
  const i2 = indices[i + 2] + 1;
  objStr += `f ${i0}/${i0}/${i0} ${i1}/${i1}/${i1} ${i2}/${i2}/${i2}\n`;
}

fs.writeFileSync(path.join(exportDir, 'mizoram_terrain.obj'), objStr);
console.log('Saved public/export/mizoram_terrain.obj');

const mtlStr = `# Material for Mizoram 3D Terrain
newmtl Mizoram_District_Material
Ka 1.0 1.0 1.0
Kd 1.0 1.0 1.0
Ks 0.1 0.1 0.1
Ns 10.0
d 1.0
illum 2
map_Kd mizoram_district_texture.png
`;
fs.writeFileSync(path.join(exportDir, 'mizoram_terrain.mtl'), mtlStr);
console.log('Saved public/export/mizoram_terrain.mtl');

// Copy texture into exportDir as well
fs.copyFileSync('public/mizoram_district_texture.png', path.join(exportDir, 'mizoram_district_texture.png'));

// 2. Generate Binary glTF (.glb)
// A complete self-contained GLB 2.0 file with embedded PNG texture
const texturePngBuffer = fs.readFileSync('public/mizoram_district_texture.png');

// Buffer layout:
// 1. indices (Uint32 or Uint16): indices.length * 4 (since > 65535 vertices might happen in high-res, Uint32 is safe)
// 2. positions (Float32): positions.length * 4
// 3. normals (Float32): normals.length * 4
// 4. uvs (Float32): uvs.length * 4
// 5. image buffer (PNG bytes)
const indexBuf = Buffer.from(new Uint32Array(indices).buffer);
const posBuf = Buffer.from(new Float32Array(positions).buffer);
const normBuf = Buffer.from(normals.buffer);
const uvBuf = Buffer.from(new Float32Array(uvs).buffer);

// Pad buffers to 4-byte boundaries
function pad4(buf) {
  const rem = buf.length % 4;
  if (rem === 0) return buf;
  return Buffer.concat([buf, Buffer.alloc(4 - rem)]);
}

const pIndexBuf = pad4(indexBuf);
const pPosBuf = pad4(posBuf);
const pNormBuf = pad4(normBuf);
const pUvBuf = pad4(uvBuf);
const pTexBuf = pad4(texturePngBuffer);

const binBuffer = Buffer.concat([pIndexBuf, pPosBuf, pNormBuf, pUvBuf, pTexBuf]);

// Calculate min and max for positions
let minX = Infinity, minY = Infinity, minZ = Infinity;
let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
for (let i = 0; i < positions.length; i += 3) {
  minX = Math.min(minX, positions[i]); maxX = Math.max(maxX, positions[i]);
  minY = Math.min(minY, positions[i+1]); maxY = Math.max(maxY, positions[i+1]);
  minZ = Math.min(minZ, positions[i+2]); maxZ = Math.max(maxZ, positions[i+2]);
}

const offsetIndices = 0;
const lengthIndices = pIndexBuf.length;

const offsetPositions = offsetIndices + lengthIndices;
const lengthPositions = pPosBuf.length;

const offsetNormals = offsetPositions + lengthPositions;
const lengthNormals = pNormBuf.length;

const offsetUvs = offsetNormals + lengthNormals;
const lengthUvs = pUvBuf.length;

const offsetTex = offsetUvs + lengthUvs;
const lengthTex = texturePngBuffer.length; // exact length for image

const gltfDoc = {
  asset: {
    generator: "Mizoram 3D Terrain Topography Generator",
    version: "2.0"
  },
  scene: 0,
  scenes: [
    { name: "MizoramScene", nodes: [0] }
  ],
  nodes: [
    { name: "Mizoram_Terrain", mesh: 0 }
  ],
  meshes: [
    {
      name: "Mizoram_Mesh",
      primitives: [
        {
          attributes: {
            POSITION: 1,
            NORMAL: 2,
            TEXCOORD_0: 3
          },
          indices: 0,
          material: 0,
          mode: 4 // TRIANGLES
        }
      ]
    }
  ],
  materials: [
    {
      name: "Mizoram_District_Material",
      pbrMetallicRoughness: {
        baseColorTexture: {
          index: 0
        },
        metallicFactor: 0.05,
        roughnessFactor: 0.85
      },
      doubleSided: true
    }
  ],
  textures: [
    {
      sampler: 0,
      source: 0
    }
  ],
  images: [
    {
      bufferView: 4,
      mimeType: "image/png",
      name: "mizoram_district_texture"
    }
  ],
  samplers: [
    {
      magFilter: 9729, // LINEAR
      minFilter: 9987, // LINEAR_MIPMAP_LINEAR
      wrapS: 33071, // CLAMP_TO_EDGE
      wrapT: 33071
    }
  ],
  buffers: [
    {
      byteLength: binBuffer.length
    }
  ],
  bufferViews: [
    {
      buffer: 0,
      byteOffset: offsetIndices,
      byteLength: indexBuf.length,
      target: 34963 // ELEMENT_ARRAY_BUFFER
    },
    {
      buffer: 0,
      byteOffset: offsetPositions,
      byteLength: posBuf.length,
      target: 34962 // ARRAY_BUFFER
    },
    {
      buffer: 0,
      byteOffset: offsetNormals,
      byteLength: normBuf.length,
      target: 34962
    },
    {
      buffer: 0,
      byteOffset: offsetUvs,
      byteLength: uvBuf.length,
      target: 34962
    },
    {
      buffer: 0,
      byteOffset: offsetTex,
      byteLength: lengthTex
    }
  ],
  accessors: [
    {
      bufferView: 0,
      byteOffset: 0,
      componentType: 5125, // UNSIGNED_INT
      count: indices.length,
      type: "SCALAR"
    },
    {
      bufferView: 1,
      byteOffset: 0,
      componentType: 5126, // FLOAT
      count: positions.length / 3,
      type: "VEC3",
      max: [maxX, maxY, maxZ],
      min: [minX, minY, minZ]
    },
    {
      bufferView: 2,
      byteOffset: 0,
      componentType: 5126, // FLOAT
      count: normals.length / 3,
      type: "VEC3"
    },
    {
      bufferView: 3,
      byteOffset: 0,
      componentType: 5126, // FLOAT
      count: uvs.length / 2,
      type: "VEC2"
    }
  ]
};

// Assemble GLB
const jsonStr = JSON.stringify(gltfDoc);
let jsonBuf = Buffer.from(jsonStr, 'utf8');
// Pad json to 4-byte boundary with spaces (0x20)
const jsonPadding = (4 - (jsonBuf.length % 4)) % 4;
if (jsonPadding > 0) {
  jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(jsonPadding, 0x20)]);
}

// GLB Header: 12 bytes
// magic: 0x46546C67 ("glTF")
// version: 2
// length: total length
const totalGlbLength = 12 + (8 + jsonBuf.length) + (8 + binBuffer.length);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546C67, 0); // magic
header.writeUInt32LE(2, 4); // version
header.writeUInt32LE(totalGlbLength, 8); // total length

// JSON chunk header
const jsonChunkHeader = Buffer.alloc(8);
jsonChunkHeader.writeUInt32LE(jsonBuf.length, 0);
jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4); // "JSON"

// BIN chunk header
const binChunkHeader = Buffer.alloc(8);
binChunkHeader.writeUInt32LE(binBuffer.length, 0);
binChunkHeader.writeUInt32LE(0x004E4942, 4); // "BIN\0"

const glbBuffer = Buffer.concat([
  header,
  jsonChunkHeader,
  jsonBuf,
  binChunkHeader,
  binBuffer
]);

fs.writeFileSync(path.join(exportDir, 'mizoram_terrain.glb'), glbBuffer);
console.log(`Saved public/export/mizoram_terrain.glb (${(glbBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

// 3. Generate Godot Scene (.tscn)
const tscnContent = `[gd_scene load_steps=4 format=3 uid="uid://mizoram_terrain_scene"]

[ext_resource type="PackedScene" uid="uid://mizoram_glb" path="res://mizoram_terrain.glb" id="1_terrain"]

[sub_resource type="BoxShape3D" id="BoxShape3D_ground"]
size = Vector3(120, 1, 286)

[node name="MizoramWorld" type="Node3D"]

[node name="DirectionalLight3D" type="DirectionalLight3D" parent="."]
transform = Transform3D(0.866025, -0.353553, 0.353553, 0, 0.707107, 0.707107, -0.5, -0.612372, 0.612372, 0, 50, 0)
shadow_enabled = true

[node name="MizoramTerrain" parent="." instance=ExtResource("1_terrain")]

[node name="StaticBody3D" type="StaticBody3D" parent="MizoramTerrain"]

[node name="CollisionShape3D" type="CollisionShape3D" parent="MizoramTerrain/StaticBody3D"]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, -0.5, 0)
shape = SubResource("BoxShape3D_ground")

[node name="Camera3D" type="Camera3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 0.819152, 0.573576, 0, -0.573576, 0.819152, 0, 120, 220)
current = true
`;
fs.writeFileSync(path.join(exportDir, 'MizoramTerrain.tscn'), tscnContent);
console.log('Saved public/export/MizoramTerrain.tscn');

// 4. Generate README for Godot
const godotReadme = `# Mizoram 3D Terrain Model for Godot Engine

This 3D terrain package contains the real-world topography of Mizoram, India, generated from high-resolution digital elevation data with the official 2021 District Boundaries and colors baked directly onto the 3D surface.

## Contents of this Package:
1. **mizoram_terrain.glb**: Complete, binary glTF 2.0 model with embedded 2048x1024 colorful district texture, UV coordinates, and vertex normals.
2. **mizoram_terrain.obj** & **mizoram_terrain.mtl**: Universal Wavefront OBJ model.
3. **mizoram_district_texture.png**: High-resolution 2048x1024 baked district texture.
4. **mizoram_heightmap.png**: 8/16-bit grayscale heightmap for Godot Terrain3D / Zylann heightmap plugins.
5. **MizoramTerrain.tscn**: Pre-configured Godot 4.x scene with directional lighting and collision.

## Quick Start in Godot 4 (Recommended):
1. Simply drag **mizoram_terrain.glb** into your Godot project's FileSystem panel (\`res://\`).
2. Double click the imported \`mizoram_terrain.glb\` to view it or drag it into any 3D Scene.
3. To generate physics collision in Godot 4:
   - Select the \`Mizoram_Terrain\` node in your Scene tree.
   - Click **Mesh** in the top 3D toolbar -> **Create Trimesh Static Body** (or **Create Simplified Convex Collision Sibling**).
   - Now your character or vehicle can climb and drive over the mountain ranges of Mizoram!

## Quick Start in Godot 3:
1. Copy **mizoram_terrain.obj**, **mizoram_terrain.mtl**, and **mizoram_district_texture.png** into your project directory.
2. Godot 3 will automatically import the OBJ mesh with the texture mapped on the material.

## Real-World Geographic Alignment:
- **West to East**: Longitude 92.26022° E to 93.43737° E (mapped to X axis: -60 to +60 units)
- **South to North**: Latitude 21.94005° N to 24.52313° N (mapped to Z axis: +143 to -143 units)
- **Elevation**: Min 23m, Avg 612m, Max 2,108m (Phawngpui / Blue Mountain)
`;
fs.writeFileSync(path.join(exportDir, 'README_GODOT.md'), godotReadme);
console.log('Saved public/export/README_GODOT.md');

// 5. Create ZIP package
async function makeZip() {
  const zip = new JSZip();
  zip.file('mizoram_terrain.glb', glbBuffer);
  zip.file('mizoram_terrain.obj', objStr);
  zip.file('mizoram_terrain.mtl', mtlStr);
  zip.file('mizoram_district_texture.png', texturePngBuffer);
  zip.file('mizoram_heightmap.png', fs.readFileSync('public/mizoram_heightmap.png'));
  zip.file('MizoramTerrain.tscn', tscnContent);
  zip.file('README_GODOT.md', godotReadme);

  const zipBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(path.join(exportDir, 'mizoram_godot_package.zip'), zipBuf);
  console.log(`Saved public/export/mizoram_godot_package.zip (${(zipBuf.length / 1024 / 1024).toFixed(2)} MB)`);
}

makeZip().catch(console.error);
