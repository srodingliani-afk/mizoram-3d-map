import fs from 'fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const glbBuf = fs.readFileSync('public/export/mizoram_terrain.glb');
console.log(`GLB size: ${glbBuf.length} bytes`);

const loader = new GLTFLoader();
const arrayBuf = glbBuf.buffer.slice(glbBuf.byteOffset, glbBuf.byteOffset + glbBuf.byteLength);

loader.parse(arrayBuf, '', (gltf) => {
  console.log('SUCCESS: GLTF parsed without error!');
  console.log('Scenes count:', gltf.scenes.length);
  console.log('Mesh children:', gltf.scene.children.length);
  const mesh = gltf.scene.children[0];
  console.log('Mesh name:', mesh.name);
  console.log('Geometry vertices:', mesh.geometry.attributes.position.count);
  console.log('Geometry has normals:', !!mesh.geometry.attributes.normal);
  console.log('Geometry has UVs:', !!mesh.geometry.attributes.uv);
  console.log('Material name:', mesh.material.name);
}, (err) => {
  console.error('ERROR parsing GLTF:', err);
});
