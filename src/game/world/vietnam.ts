import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import type { Scene } from '@babylonjs/core/scene';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { mat } from './temple';
import { terrainHeight } from './terrain';
import { createTrongMai } from './trongMai';
import { naturalSurface } from './surface';
import { CoastMaterial } from './coastMaterial';
import { foliageSource } from './foliage';
import { coastalSky } from './sky';

export function buildVietnam(scene: Scene, shadows: ShadowGenerator) {
  createTrongMai(scene);
  coastalSky(scene);
  scene.clearColor = new Color4(0.58, 0.8, 0.9, 1);
  scene.fogColor = new Color3(0.72, 0.85, 0.88); scene.fogDensity = 0.0015;
  const land = MeshBuilder.CreateGround('Vietnam coastal island', { width: 170, height: 170, subdivisions: 160 }, scene);
  const positions = land.getVerticesData(VertexBuffer.PositionKind)!;
  const colors: number[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], z = positions[i + 2]; positions[i + 1] = terrainHeight(x, z) - 0.02;
    const radius = Math.hypot(x / 1.08, z - 15);
    const noise = (Math.sin(x * 1.7 + z * 2.3) + 1) * 0.025;
    const sandy = radius > 45;
    colors.push(sandy ? 1 : 0.7 + noise, sandy ? 0.97 : 0.85 + noise, sandy ? 0.85 : 0.6 + noise, 1);
  }
  land.setVerticesData(VertexBuffer.PositionKind, positions);
  const normals: number[] = []; VertexData.ComputeNormals(positions, land.getIndices()!, normals); land.setVerticesData(VertexBuffer.NormalKind, normals); land.setVerticesData(VertexBuffer.ColorKind, colors);
  const groundMaterial=naturalSurface(scene,'forest_ground_04',40);
  new CoastMaterial(groundMaterial,scene);
  land.material=groundMaterial;land.useVertexColors=false;land.receiveShadows=true;
  const ocean = MeshBuilder.CreateGround('turquoise sea', { width: 1600, height: 1600, subdivisions: 1 }, scene); ocean.position.y = -2.1;
  const water = new ShaderMaterial('sunlit wave shader', scene, {
    vertexSource: 'precision highp float; attribute vec3 position; uniform mat4 worldViewProjection; varying vec3 v; void main(){v=position;gl_Position=worldViewProjection*vec4(position,1.);}',
    fragmentSource: 'precision highp float; varying vec3 v; uniform float time; void main(){float w=sin(v.x*.18+time*.75+sin(v.z*.12))*sin(v.z*.24-time*.4);float d=clamp(length(v.xz)/200.,0.,1.);vec3 c=mix(vec3(.1,.67,.68),vec3(.12,.43,.57),d);float spark=pow(max(0.,sin(v.x*.8+v.z*.6+time)*sin(v.z*.85-time*.8)),22.);c+=w*.026+spark*vec3(.32,.32,.22);gl_FragColor=vec4(c,1.);}',
  }, { attributes: ['position'], uniforms: ['worldViewProjection', 'time'] }); ocean.material = water;
  const rock = naturalSurface(scene, 'rock_face_03', 4);
  const leaf = mat(scene, 'tropical leaf', '#37633d', 0, 0.88); leaf.backFaceCulling = false;
  const leafLight = mat(scene, 'sunlit canopy', '#587c3c', 0, 0.94);
  const bark = mat(scene, 'palm bark', '#78644a', 0, 0.93);
  // Distant limestone formations, each with irregular silhouette and a forest cap.
  for (let i = 0; i < 18; i++) {
    const angle = i * 2.399, radius = 175 + i % 5 * 45;
    const x = Math.sin(angle) * radius, z = Math.cos(angle) * radius;
    if(Math.abs(x)<35 && z>0)continue;
    const h = 22 + (i * 13 % 45), width = 12 + i % 5 * 4;
    for (let j = 0; j < 3; j++) {
      const shape=Array.from({length:13},(_,k)=>{const y=k/12;return new Vector3(width*(.5+Math.sin(y*Math.PI)*.25)*(1-Math.pow(y,6))*(1+Math.sin(k*1.7+j)*.12),y*h*(1-j*.12),0);});
      const cliff = MeshBuilder.CreateLathe('Ha Long limestone ridge', { shape, tessellation:22, cap:Mesh.CAP_ALL }, scene);
      const vertices=cliff.getVerticesData(VertexBuffer.PositionKind)!;
      for(let n=0;n<vertices.length;n+=3){const rough=1+Math.sin(vertices[n]*1.1+vertices[n+2]*.8+vertices[n+1]*.25)*.065;vertices[n]*=rough;vertices[n+2]*=rough;}
      cliff.setVerticesData(VertexBuffer.PositionKind,vertices);const ns:number[]=[];VertexData.ComputeNormals(vertices,cliff.getIndices()!,ns);cliff.setVerticesData(VertexBuffer.NormalKind,ns);
      cliff.position.set(x+j*width*.7,-4,z+j*4);cliff.scaling.z=.7;cliff.rotation.y=angle+j;cliff.material=rock;cliff.freezeWorldMatrix();
      for(let k=0;k<6;k++){const forest = MeshBuilder.CreateIcoSphere('distant jungle crown', { radius: 1, subdivisions: 2, flat: false }, scene); forest.scaling.set(width*.24,h*.07,width*.2);forest.position.set(cliff.position.x+Math.sin(k*2.4)*width*.26,h*(.77-j*.1)+Math.cos(k*2)*h*.03,cliff.position.z+Math.cos(k*2.4)*width*.2);forest.material=k%2?leafLight:leaf;forest.freezeWorldMatrix();}
    }
  }
  // Shared geometry instances keep a substantial forest affordable.
  const canopySource = foliageSource(scene);
  const trunkSource = MeshBuilder.CreateCylinder('tree trunk source', { height: 1, diameterTop: 0.7, diameterBottom: 1, tessellation: 7 }, scene); trunkSource.material = bark; trunkSource.setEnabled(false);
  const palms: Mesh[] = [];
  for (let i = 0; i < 80; i++) {
    const angle = i * 2.399, radius = 22 + (i * 7 % 33);
    const x = Math.sin(angle) * radius, z = Math.cos(angle) * radius + 13;
    if (Math.hypot(x, z) < 18 || (Math.abs(x) < 9 && z > 25)) continue;
    const y = terrainHeight(x, z), h = 4 + i % 4;
    const trunk = trunkSource.createInstance('coastal tree'); trunk.position.set(x, y + h / 2, z); trunk.scaling.set(0.35, h, 0.35); trunk.freezeWorldMatrix();
    if (i % 3) {
      for (let j = 0; j < 2; j++) { const crown = canopySource.createInstance('forest canopy'); crown.position.set(x + Math.sin(j * 2) * 1.1, y + h + j * 0.5, z + Math.cos(j * 2) * 1.1); crown.scaling.set(1.8, 1.5, 1.8); crown.rotation.y=i; crown.freezeWorldMatrix(); }
    } else {
      const fronds: Mesh[] = [];
      for (let j = 0; j < 7; j++) {
        const a = j / 7 * Math.PI * 2;
        const path = Array.from({ length: 8 }, (_, k) => new Vector3(x + Math.sin(a) * k * 0.45, y + h + Math.sin(k / 7 * Math.PI) * 0.8 - k * 0.1, z + Math.cos(a) * k * 0.45));
        const blade = MeshBuilder.CreateRibbon('palm frond', { pathArray: [path.map((p, k) => p.add(new Vector3(Math.cos(a) * Math.sin(k / 7 * Math.PI) * 0.45, 0, -Math.sin(a) * Math.sin(k / 7 * Math.PI) * 0.45))), path.map((p, k) => p.add(new Vector3(-Math.cos(a) * Math.sin(k / 7 * Math.PI) * 0.45, 0, Math.sin(a) * Math.sin(k / 7 * Math.PI) * 0.45)))], sideOrientation: Mesh.DOUBLESIDE }, scene); blade.material = leafLight; fronds.push(blade);
      }
      const merged = Mesh.MergeMeshes(fronds, true, true); if (merged) palms.push(merged);
    }
  }
  const foamMat = mat(scene, 'white surf foam', '#e5fcf2', 0, 1, 0.15); foamMat.alpha = 0.55;
  const surf = Array.from({ length: 3 }, (_, i) => {
    const points = Array.from({ length: 129 }, (_, n) => { const t = n / 128 * Math.PI * 2; return new Vector3(Math.sin(t) * (66 + i) * 1.08, -2.05, Math.cos(t) * (66 + i) + 15); });
    const ring = MeshBuilder.CreateTube('shoreline foam', { path: points, radius: 0.12, tessellation: 4 }, scene); ring.material = foamMat; return ring;
  });
  void shadows;
  return { update(time: number, reduced: boolean) { const clock = reduced ? 0 : time; water.setFloat('time', clock); surf.forEach((ring, i) => { ring.visibility = 0.25 + Math.sin(clock * 0.8 + i) * 0.15; }); } };
}
