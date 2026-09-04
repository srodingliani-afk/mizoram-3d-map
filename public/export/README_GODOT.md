# Mizoram 3D Terrain Model for Godot Engine

This 3D terrain package contains the real-world topography of Mizoram, India, generated from high-resolution digital elevation data with the official 2021 District Boundaries and colors baked directly onto the 3D surface.

## Contents of this Package:
1. **mizoram_terrain.glb**: Complete, binary glTF 2.0 model with embedded 2048x1024 colorful district texture, UV coordinates, and vertex normals.
2. **mizoram_terrain.obj** & **mizoram_terrain.mtl**: Universal Wavefront OBJ model.
3. **mizoram_district_texture.png**: High-resolution 2048x1024 baked district texture.
4. **mizoram_heightmap.png**: 8/16-bit grayscale heightmap for Godot Terrain3D / Zylann heightmap plugins.
5. **MizoramTerrain.tscn**: Pre-configured Godot 4.x scene with directional lighting and collision.

## Quick Start in Godot 4 (Recommended):
1. Simply drag **mizoram_terrain.glb** into your Godot project's FileSystem panel (`res://`).
2. Double click the imported `mizoram_terrain.glb` to view it or drag it into any 3D Scene.
3. To generate physics collision in Godot 4:
   - Select the `Mizoram_Terrain` node in your Scene tree.
   - Click **Mesh** in the top 3D toolbar -> **Create Trimesh Static Body** (or **Create Simplified Convex Collision Sibling**).
   - Now your character or vehicle can climb and drive over the mountain ranges of Mizoram!

## Quick Start in Godot 3:
1. Copy **mizoram_terrain.obj**, **mizoram_terrain.mtl**, and **mizoram_district_texture.png** into your project directory.
2. Godot 3 will automatically import the OBJ mesh with the texture mapped on the material.

## Real-World Geographic Alignment:
- **West to East**: Longitude 92.26022° E to 93.43737° E (mapped to X axis: -60 to +60 units)
- **South to North**: Latitude 21.94005° N to 24.52313° N (mapped to Z axis: +143 to -143 units)
- **Elevation**: Min 23m, Avg 612m, Max 2,108m (Phawngpui / Blue Mountain)
