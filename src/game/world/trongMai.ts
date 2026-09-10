import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type { Scene } from '@babylonjs/core/scene';
import { mat } from './temple';
import { naturalSurface } from './surface';

/** Original procedural interpretation, not a scan of the protected landmark. */
export function createTrongMai(scene: Scene) {
  const limestone = naturalSurface(scene, 'rock_face_03', 1, true);
  const foliage = mat(scene, 'Trống Mái sparse shrubs', '#4d6639', 0, 1);
  // Tall asymmetrical heads, a visible gap, and wave-eroded narrow feet.
  const profiles = [
    [{y:0,r:1.7,c:0},{y:1.5,r:1.1,c:0.4},{y:3.5,r:1.55,c:0.6},{y:5.5,r:2.5,c:0.65},{y:8,r:3.1,c:1.1},{y:10.5,r:2.1,c:1.7},{y:12.2,r:1.15,c:1.9},{y:12.8,r:0.15,c:1.5}],
    [{y:0,r:1.7,c:0},{y:1.5,r:1,c:-0.25},{y:3.5,r:1.8,c:-0.6},{y:6,r:2.85,c:-0.7},{y:8.6,r:2.5,c:-1.1},{y:10.7,r:1.35,c:-1.5},{y:11.2,r:0.15,c:-1.6}],
  ];
  profiles.forEach((profile, side) => {
    const positions: number[] = [], indices: number[] = [], colors: number[] = [], normals: number[] = [], uvs: number[] = [];
    const segments = 19;
    profile.forEach((p, row) => { for(let j=0;j<segments;j++) {
      const angle = j / segments * Math.PI * 2;
      const rough = 1 + Math.sin(j * 7.1 + row * 5.4 + side) * 0.22;
      positions.push(Math.cos(angle) * p.r * rough + p.c, p.y + Math.sin(j * 3.7 + row) * 0.27, Math.sin(angle) * p.r * rough * 0.65);
      uvs.push(j/segments*3,row/(profile.length-1)*5);
      const shade = 0.92 + Math.sin(j * 4.2 + row * 3.3) * 0.06;
      colors.push(shade, shade, shade * 0.9, 1);
      if(row<profile.length-1) { const a=row*segments+j,b=row*segments+(j+1)%segments,c=a+segments,d=b+segments; indices.push(a,c,b,b,c,d); }
    } });
    VertexData.ComputeNormals(positions, indices, normals);
    const data=new VertexData();data.positions=positions;data.indices=indices;data.normals=normals;data.colors=colors;data.uvs=uvs;
    const mesh=new Mesh(side ? 'Hòn Mái' : 'Hòn Trống',scene);data.applyToMesh(mesh);
    mesh.position.set((side ? 3.6 : -3.6) + 3, -3, 106);mesh.material=limestone;mesh.rotation.y=0.12;mesh.freezeWorldMatrix();
    for(let i=0;i<7;i++) { const shrub=MeshBuilder.CreateIcoSphere('sparse islet vegetation',{radius:0.28+i%2*.1,subdivisions:2,flat:false},scene);shrub.scaling.set(1,.55,.8);shrub.position.set(mesh.position.x+(side?-1.3:1.5)+Math.sin(i*4)*.7,(side?7.6:9.2)+Math.sin(i*2)*.4,106+Math.cos(i*3)*.6);shrub.material=foliage;shrub.freezeWorldMatrix(); }
  });
}
