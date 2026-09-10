import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { Scene } from '@babylonjs/core/scene';

/** Original alpha-tested leaf clusters; shared instances, no downloaded artwork. */
export function foliageSource(scene: Scene) {
  const texture = new DynamicTexture('painted tropical leaf cluster', 256, scene, true);
  const ctx = texture.getContext() as CanvasRenderingContext2D; ctx.clearRect(0,0,256,256);
  ctx.strokeStyle = '#576239'; ctx.lineWidth = 2;
  ctx.beginPath();ctx.moveTo(128,250);ctx.bezierCurveTo(110,175,150,90,130,12);ctx.stroke();
  for(let i=0;i<34;i++) {
    const y=20+i*6.5, side=i%2?1:-1, x=128+side*(18+(i*13%40));
    ctx.strokeStyle='#5c6835';ctx.beginPath();ctx.moveTo(128,y+20);ctx.lineTo(x,y);ctx.stroke();
    ctx.save();ctx.translate(x,y);ctx.rotate(side*.8);
    const fill=ctx.createLinearGradient(-10,-20,12,20);fill.addColorStop(0,'#9eab56');fill.addColorStop(.45,'#6f963d');fill.addColorStop(1,'#345e2d');ctx.fillStyle=fill;
    ctx.beginPath();ctx.moveTo(0,-23);ctx.bezierCurveTo(19,-8,17,15,0,24);ctx.bezierCurveTo(-13,10,-17,-8,0,-23);ctx.fill();
    ctx.strokeStyle='#b3ba6590';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(0,20);ctx.stroke();ctx.restore();
  }
  texture.hasAlpha=true;texture.update();
  const material=new StandardMaterial('sunlit tropical foliage',scene);material.diffuseTexture=texture;material.useAlphaFromDiffuseTexture=true;material.transparencyMode=1;material.backFaceCulling=false;material.specularColor=Color3.Black();material.ambientColor=new Color3(.1,.13,.08);
  const parts:Mesh[]=[];
  for(let i=0;i<56;i++) {
    const leaf=MeshBuilder.CreatePlane('leaf branch',{width:1.5,height:1.6,sideOrientation:Mesh.DOUBLESIDE},scene);
    const a=i*2.399, radius=.45+(i%7)/7*.8;
    leaf.position.set(Math.cos(a)*radius,Math.sin(i*1.73)*.75,Math.sin(a)*radius);
    leaf.rotation.set(Math.sin(i*3.7)*.9,a,Math.sin(i*4.1)*.7);parts.push(leaf);
  }
  const source=Mesh.MergeMeshes(parts,true,true)!;source.material=material;source.setEnabled(false);return source;
}
