import { MaterialPluginBase } from '@babylonjs/core/Materials/materialPluginBase';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import type { BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture';
import type { UniformBuffer } from '@babylonjs/core/Materials/uniformBuffer';
import type { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import type { Scene } from '@babylonjs/core/scene';

/** World-space biome blending removes hard triangle edges along the beach. */
export class CoastMaterial extends MaterialPluginBase {
  private sand: Texture;
  constructor(material:PBRMaterial,scene:Scene){
    super(material,'soft coastal transition',200,{},true,true);
    this.sand=new Texture(`${import.meta.env.BASE_URL}textures/sand_01_Diffuse.jpg`,scene);
    this.sand.anisotropicFilteringLevel=4;
  }
  getSamplers(samplers:string[]){samplers.push('coastSand');}
  getActiveTextures(textures:BaseTexture[]){textures.push(this.sand);}
  isReadyForSubMesh(){return this.sand.isReady();}
  bindForSubMesh(buffer:UniformBuffer){buffer.setTexture('coastSand',this.sand);}
  getCustomCode(type:string){return type==='fragment'?{
    CUSTOM_FRAGMENT_DEFINITIONS:'uniform sampler2D coastSand;',
    CUSTOM_FRAGMENT_UPDATE_ALBEDO:`float shoreRadius=length(vec2(vPositionW.x/1.08,vPositionW.z-15.));
      float shoreNoise=sin(vPositionW.x*.6)*sin(vPositionW.z*.45)*.65;
      vec3 beachColor=toLinearSpace(texture2D(coastSand,vPositionW.xz*.24).rgb)*vec3(1.,.97,.88);
      surfaceAlbedo=mix(surfaceAlbedo,beachColor,smoothstep(41.,48.,shoreRadius+shoreNoise));`,
  }:null;}
}
