import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import type { Scene } from '@babylonjs/core/scene';

export function coastalSky(scene: Scene) {
  const dome=MeshBuilder.CreateSphere('atmospheric coastal sky',{diameter:1400,segments:16,sideOrientation:Mesh.BACKSIDE},scene);
  dome.infiniteDistance=true;dome.isPickable=false;
  dome.material=new ShaderMaterial('daylight sky and wispy clouds',scene,{
    vertexSource:'precision highp float;attribute vec3 position;uniform mat4 worldViewProjection;varying vec3 dir;void main(){dir=position;gl_Position=worldViewProjection*vec4(position,1.);}',
    fragmentSource:`precision highp float;varying vec3 dir;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
      void main(){vec3 d=normalize(dir);float h=max(0.,d.y);vec3 c=mix(vec3(.78,.87,.89),vec3(.22,.56,.79),pow(h,.55));
      vec2 p=d.xz/(h+.14)*1.7;float n=noise(p)*.55+noise(p*2.1)*.27+noise(p*4.3)*.13+noise(p*8.2)*.05;
      float cloud=smoothstep(.53,.77,n)*smoothstep(.02,.16,h);c=mix(c,vec3(.99,.97,.92),cloud*.9);gl_FragColor=vec4(c,1.);}`,
  },{attributes:['position'],uniforms:['worldViewProjection']});
  dome.material.disableDepthWrite=true;
}
