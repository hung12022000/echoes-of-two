import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import type { Scene } from '@babylonjs/core/scene';
import { mat } from './temple';
export function naturalSurface(scene: Scene, id: string, repeat = 1, normal = false) {
  const material = mat(scene, id, '#ffffff', 0, 0.92);
  const texture = new Texture(`${import.meta.env.BASE_URL}textures/${id}_Diffuse.jpg`,scene);
  texture.uScale=texture.vScale=repeat;texture.anisotropicFilteringLevel=4;material.albedoTexture=texture;
  if(normal) { const bump=new Texture(`${import.meta.env.BASE_URL}textures/${id}_nor_gl.jpg`,scene);bump.gammaSpace=false;bump.uScale=bump.vScale=repeat;bump.level=.45;material.bumpTexture=bump; }
  return material;
}
