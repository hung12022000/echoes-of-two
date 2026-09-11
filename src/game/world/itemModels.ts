import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import type { Material } from '@babylonjs/core/Materials/material';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import type { Scene } from '@babylonjs/core/scene';

/** Original geometry only: no downloads, textures, render loops or physics side effects. */
export const DETAILED_ITEM_IDS = [
  'driftwood', 'fiber', 'plastic', 'stone', 'scrap', 'coconut', 'fish',
  'bamboo', 'herb', 'clay', 'shell', 'seaweed', 'hook', 'hammer', 'spear',
  'compass', 'purifier', 'grill', 'storage',
] as const;
export type DetailedItemId = typeof DETAILED_ITEM_IDS[number];
type Surface = 'wood' | 'woodLight' | 'rope' | 'metal' | 'rust' | 'dark'
  | 'leaf' | 'leafLight' | 'plastic' | 'stone' | 'clay' | 'shell'
  | 'fish' | 'coral' | 'water' | 'cloth' | 'ember';
/** Optional shared materials; this factory never modifies or disposes overrides. */
export type DetailedItemMaterials = Partial<Record<Surface, Material>>;

const palette: Record<Surface, readonly [string, number, number]> = {
  wood: ['#6b4930', 0, .93], woodLight: ['#b68a58', 0, .85],
  rope: ['#cbb589', 0, 1], metal: ['#83969c', .75, .36],
  rust: ['#995b39', .2, .91], dark: ['#253238', .2, .74],
  leaf: ['#356b38', 0, .88], leafLight: ['#86a953', 0, .78],
  plastic: ['#69a4b7', .05, .42], stone: ['#7e8177', 0, 1],
  clay: ['#b57252', 0, .94], shell: ['#eddcc0', .05, .49],
  fish: ['#a6c7c7', .48, .35], coral: ['#d98176', .05, .7],
  water: ['#3cb8be', .15, .24], cloth: ['#e9dfbc', 0, .97],
  ember: ['#df672c', 0, .9],
};
const sceneMaterials = new WeakMap<Scene, Map<Surface, PBRMaterial>>();

function defaultMaterial(scene: Scene, surface: Surface): PBRMaterial {
  let cache = sceneMaterials.get(scene);
  if (!cache) {
    cache = new Map();
    sceneMaterials.set(scene, cache);
    scene.onDisposeObservable.addOnce(() => sceneMaterials.delete(scene));
  }
  let material = cache.get(surface);
  if (!material) {
    const [hex, metallic, roughness] = palette[surface];
    material = new PBRMaterial(`item.surface.${surface}`, scene);
    material.albedoColor = Color3.FromHexString(hex).toLinearSpace();
    material.metallic = metallic;
    material.roughness = roughness;
    if (surface === 'ember') material.emissiveColor = material.albedoColor.scale(.45);
    cache.set(surface, material);
    material.onDisposeObservable.addOnce(() => cache!.delete(surface));
  }
  return material;
}

type Point = readonly [number, number, number];
const v = (point: Point) => new Vector3(...point);
const aliases: Record<string, DetailedItemId> = {
  navigation_compass: 'compass', produce_coconut_tree: 'coconut',
  basic_hook: 'hook', building_hammer: 'hammer', wooden_spear: 'spear',
  water_purifier: 'purifier', simple_grill: 'grill', storage_chest: 'storage',
};

/**
 * Static, Y-up models in metres, with the lowest point at local Y=0. Small
 * pickups are roughly 0.3–1.4m; stations 1–1.5m; the spear is roughly 1.8m.
 * Rotate/scale the returned node for floating loot or a hand attachment.
 * Children are merged per material (no MultiMaterial), pickable and shadowed.
 * No collision is installed: the gameplay controller owns collision proxies.
 * Dispose with root.dispose(); shared scene materials live until scene disposal.
 * Do not pass disposeMaterialAndTextures=true when disposing shared materials.
 * Unsupported IDs throw before allocating any scene resources.
 */
export function createDetailedItemModel(
  scene: Scene,
  shadows: ShadowGenerator | null | undefined,
  itemId: string,
  materials: DetailedItemMaterials = {},
): TransformNode {
  const id = aliases[itemId] ?? itemId;
  if (!(DETAILED_ITEM_IDS as readonly string[]).includes(id)) {
    throw new RangeError(`Unsupported detailed item model: ${itemId}`);
  }
  const root = new TransformNode(`item.${itemId}`, scene);
  const batches = new Map<Material, Mesh[]>();
  let serial = 0;
  const name = (detail: string) => `item.${itemId}.${detail}.${serial++}`;
  const add = (mesh: Mesh, surface: Surface, position: Point = [0, 0, 0]) => {
    const material = materials[surface] ?? defaultMaterial(scene, surface);
    mesh.material = material;
    mesh.position.copyFrom(v(position));
    const batch = batches.get(material) ?? [];
    batch.push(mesh);
    batches.set(material, batch);
    return mesh;
  };
  const box = (detail: string, size: Point, position: Point, surface: Surface) =>
    add(MeshBuilder.CreateBox(name(detail), { width: size[0], height: size[1], depth: size[2] }, scene), surface, position);
  const ellipsoid = (detail: string, size: Point, position: Point, surface: Surface) =>
    add(MeshBuilder.CreateSphere(name(detail), { diameterX: size[0], diameterY: size[1], diameterZ: size[2], segments: 8 }, scene), surface, position);
  const rod = (detail: string, from: Point, to: Point, diameter: number, surface: Surface, endDiameter = diameter) => {
    const start = v(from), end = v(to), direction = end.subtract(start);
    const mesh = add(MeshBuilder.CreateCylinder(name(detail), {
      height: direction.length(), diameterBottom: diameter, diameterTop: endDiameter, tessellation: 10,
    }, scene), surface);
    mesh.position.copyFrom(start.add(end).scale(.5));
    const axis = Vector3.Cross(Vector3.Up(), direction.normalize());
    const cosine = Vector3.Dot(Vector3.Up(), direction);
    mesh.rotationQuaternion = axis.lengthSquared() > 1e-8
      ? Quaternion.RotationAxis(axis.normalize(), Math.acos(Math.max(-1, Math.min(1, cosine))))
      : Quaternion.RotationAxis(Vector3.Right(), cosine < 0 ? Math.PI : 0);
    return mesh;
  };
  const tube = (detail: string, points: Point[], radius: number, surface: Surface) =>
    add(MeshBuilder.CreateTube(name(detail), { path: points.map(v), radius, tessellation: 6, cap: Mesh.CAP_ALL }, scene), surface);
  const ring = (detail: string, diameter: number, thickness: number, position: Point, surface: Surface) =>
    add(MeshBuilder.CreateTorus(name(detail), { diameter, thickness, tessellation: 12 }, scene), surface, position);
  const leaf = (base: Point, length: number, width: number, angle: number, surface: Surface = 'leaf') => {
    // Two curved strips meeting at a raised midrib, so leaves have volume from either side.
    const paths: Vector3[][] = [[], [], []];
    for (let i = 0; i <= 4; i++) {
      const t = i / 4, spread = Math.sin(t * Math.PI) * width / 2;
      paths[0].push(new Vector3(-spread, t * length, Math.sin(t * Math.PI) * .035));
      paths[1].push(new Vector3(0, t * length, Math.sin(t * Math.PI) * .07));
      paths[2].push(new Vector3(spread, t * length, Math.sin(t * Math.PI) * .035));
    }
    const mesh = add(MeshBuilder.CreateRibbon(name('curved leaf'), { pathArray: paths, sideOrientation: Mesh.DOUBLESIDE }, scene), surface, base);
    mesh.rotation.z = angle;
    return mesh;
  };
  const lash = (y: number, radius: number, count = 3) => {
    for (let i = 0; i < count; i++) ring('rope binding', radius * 2, .017, [0, y + i * .023, 0], 'rope');
  };

  switch (id as DetailedItemId) {
    case 'driftwood': {
      rod('bleached log', [-.65, .17, 0], [.65, .21, .02], .25, 'woodLight', .18);
      rod('broken branch', [-.1, .22, 0], [.24, .4, .17], .11, 'wood', .055);
      for (let i = 0; i < 4; i++) tube('weathered grain', [[-.54, .22 + i * .013, -.085 + i * .049], [-.15, .28, -.075 + i * .044], [.5, .27, -.065 + i * .039]], .007, 'wood');
      for (const x of [-.65, .65]) {
        const end = ring('growth ring', .12, .012, [x, .2, .01], 'wood');
        end.rotation.z = Math.PI / 2;
      }
      break;
    }
    case 'fiber': {
      for (let i = 0; i < 7; i++) tube('bundled fiber', [[-.12 + i * .04, 0, 0], [-.09 + i * .03, .32, Math.sin(i) * .035], [-.24 + i * .073, .68 + (i % 3) * .04, .05]], .018, i % 2 ? 'rope' : 'woodLight');
      lash(.26, .115);
      tube('loose knot', [[0, .3, .13], [.16, .35, .14], [.17, .25, .14], [0, .3, .13], [-.13, .18, .15]], .018, 'rope');
      break;
    }
    case 'plastic': {
      rod('bottle body', [0, .08, 0], [0, .57, 0], .28, 'plastic');
      rod('bottle shoulder', [0, .57, 0], [0, .69, 0], .28, 'plastic', .12);
      rod('neck', [0, .69, 0], [0, .78, 0], .12, 'plastic');
      rod('cap', [0, .77, 0], [0, .84, 0], .15, 'dark');
      for (const y of [.13, .19, .5, .55]) ring('moulded bottle rib', .276, .018, [0, y, 0], 'plastic');
      rod('paper label', [0, .28, 0], [0, .4, 0], .284, 'cloth');
      box('label stripe', [.11, .03, .012], [0, .34, -.145], 'coral');
      break;
    }
    case 'stone':
    case 'clay': {
      for (let i = 0; i < 3; i++) {
        const chunk = add(MeshBuilder.CreateIcoSphere(name('irregular chunk'), { radius: .25 - i * .037, subdivisions: 1, flat: true }, scene), id === 'clay' ? 'clay' : 'stone', [i * .2 - .18, .15, i % 2 * .12]);
        chunk.scaling.set(1.12, .71, .88);
        chunk.rotation.set(i * .4, .3 + i, .2);
      }
      if (id === 'stone') tube('quartz vein', [[-.35, .25, .04], [-.2, .32, .02], [-.06, .28, -.03]], .012, 'shell');
      else for (let i = 0; i < 3; i++) tube('clay crease', [[-.23 + i * .13, .29, -.03], [-.19 + i * .13, .27, -.12]], .008, 'wood');
      break;
    }
    case 'scrap': {
      ring('salvaged gear rim', .55, .095, [0, .09, 0], 'rust');
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        box('gear tooth', [.09, .1, .13], [Math.sin(a) * .31, .09, Math.cos(a) * .31], 'metal').rotation.y = a;
      }
      box('bent metal plate', [.48, .04, .24], [.3, .16, .12], 'metal').rotation.z = .22;
      rod('bolt shaft', [-.16, .14, -.1], [.13, .22, -.1], .055, 'metal');
      for (let i = 0; i < 3; i++) ellipsoid('rivet', [.055, .027, .055], [.16 + i * .1, .19 + i * .02, .12], 'rust');
      break;
    }
    case 'coconut': {
      ellipsoid('coconut husk', [.56, .63, .55], [0, .315, 0], 'wood');
      for (let i = 0; i < 7; i++) {
        const a = i * Math.PI * 2 / 7;
        tube('husk fiber', [[Math.sin(a) * .1, .04, Math.cos(a) * .1], [Math.sin(a) * .277, .29, Math.cos(a) * .272], [Math.sin(a) * .16, .56, Math.cos(a) * .16]], .009, 'woodLight');
      }
      for (const [x, z] of [[-.055, -.045], [.055, -.045], [0, .055]]) ellipsoid('germination pore', [.039, .018, .039], [x, .625, z], 'dark');
      break;
    }
    case 'fish': {
      ellipsoid('silver fish body', [.85, .32, .21], [0, .23, 0], 'fish');
      ellipsoid('dark dorsal back', [.65, .09, .16], [-.03, .355, 0], 'dark');
      const tail = leaf([-.4, .23, 0], .35, .36, Math.PI / 2, 'coral');
      tail.rotation.x = .12;
      leaf([-.12, .32, 0], .23, .23, .4, 'fish');
      for (const side of [-1, 1]) {
        ellipsoid('eye', [.059, .059, .023], [.28, .265, side * .09], 'dark');
        ellipsoid('eye glint', [.017, .017, .01], [.291, .278, side * .103], 'shell');
        tube('gill', [[.17, .32, side * .079], [.135, .23, side * .11], [.16, .15, side * .075]], .008, 'dark');
        const fin = leaf([-.03, .2, side * .087], .24, .15, 2.15, 'coral');
        fin.rotation.y = side * .8;
      }
      for (let row = 0; row < 3; row++) for (let column = 0; column < 5; column++) {
        const scale = ellipsoid('overlapping scale', [.075, .035, .012], [-.18 + column * .095 + row % 2 * .04, .19 + row * .055, -.108], 'shell');
        scale.rotation.z = -.24;
      }
      tube('lateral line', [[-.28, .245, -.109], [.02, .24, -.112], [.24, .25, -.1]], .006, 'dark');
      break;
    }
    case 'bamboo': {
      for (let i = -1; i <= 1; i++) {
        const z = i * .13;
        rod('bamboo culm', [-.65, .13, z], [.65 - Math.abs(i) * .1, .13, z], .12, 'leafLight', .105);
        for (const x of [-.42, -.03, .37]) {
          const node = ring('bamboo joint', .124, .018, [x, .13, z], 'leaf');
          node.rotation.z = Math.PI / 2;
        }
        rod('hollow cut end', [-.651, .13, z], [-.656, .13, z], .073, 'dark');
      }
      for (const x of [-.25, .25]) {
        const tie = ring('bundle lashing', .36, .024, [x, .13, 0], 'rope');
        tie.rotation.z = Math.PI / 2;
        tie.scaling.x = .48;
      }
      break;
    }
    case 'herb':
    case 'seaweed': {
      const count = id === 'herb' ? 3 : 5;
      for (let i = 0; i < count; i++) {
        const x = (i - (count - 1) / 2) * .08;
        if (id === 'herb') {
          rod('herb stem', [x, 0, 0], [x, .5 + i * .035, 0], .015, 'leaf');
          for (let j = 0; j < 3; j++) for (const side of [-1, 1]) leaf([x, .12 + j * .12, 0], .22, .15, side * .95, j % 2 ? 'leaf' : 'leafLight');
        } else {
          const frond = leaf([x, 0, i % 2 * .07], .7 + (i % 3) * .13, .13, (i - 2) * .23);
          frond.rotation.y = i * .7;
          ellipsoid('kelp air bladder', [.07, .095, .07], [x, .1, i % 2 * .07], 'leafLight');
        }
      }
      break;
    }
    case 'shell': {
      const paths: Vector3[][] = [];
      for (let i = 0; i <= 12; i++) {
        const a = -.95 + i / 12 * 1.9;
        const path: Vector3[] = [];
        for (let j = 0; j <= 4; j++) {
          const t = j / 4;
          path.push(new Vector3(Math.sin(a) * t * .38, Math.sin(t * Math.PI) * .11 + (i % 2 ? .009 : 0), Math.cos(a) * t * .5));
        }
        paths.push(path);
        if (i % 2 === 0) tube('shell radial rib', path.map(p => [p.x, p.y + .008, p.z] as Point), .009, 'coral');
      }
      add(MeshBuilder.CreateRibbon(name('scallop shell'), { pathArray: paths, sideOrientation: Mesh.DOUBLESIDE }, scene), 'shell');
      ellipsoid('shell hinge', [.17, .07, .08], [0, .025, 0], 'shell');
      break;
    }
    case 'hook': {
      rod('hook handle', [0, 0, 0], [0, .43, 0], .1, 'wood');
      lash(.08, .056, 5);
      for (let i = 0; i < 5; i++) {
        const grip = ring('spiral grip ridge', .108, .012, [0, .17 + i * .048, 0], i % 2 ? 'rope' : 'woodLight');
        grip.rotation.y = i * .22;
      }
      rod('forged ferrule', [0, .37, 0], [0, .46, 0], .125, 'metal', .105);
      tube('forged hook', [[0, .39, 0], [0, .7, 0], [.055, .84, 0], [.19, .89, 0], [.31, .82, 0], [.33, .67, 0]], .031, 'metal');
      rod('hook point', [.33, .67, 0], [.26, .6, 0], .062, 'metal', 0);
      tube('forged hook bevel', [[.01, .7, -.024], [.07, .82, -.024], [.19, .865, -.024], [.29, .8, -.024]], .009, 'shell');
      rod('hook barb', [.302, .69, 0], [.225, .69, 0], .035, 'metal', 0);
      const eye = ring('rope eye', .11, .023, [0, .012, 0], 'metal');
      eye.rotation.x = Math.PI / 2;
      tube('trailing rope', [[0, .01, .02], [-.12, .04, .05], [-.21, 0, .07], [-.26, .04, .1]], .018, 'rope');
      break;
    }
    case 'hammer': {
      rod('hammer handle', [0, .02, 0], [0, .7, 0], .1, 'woodLight', .085);
      lash(.07, .054, 5);
      for (let i = 0; i < 6; i++) {
        const grip = ring('wrapped grip ridge', .108 - i * .002, .012, [0, .17 + i * .048, 0], i % 2 ? 'rope' : 'wood');
        grip.rotation.y = i * .2;
      }
      box('forged hammer head', [.36, .17, .17], [0, .72, 0], 'metal');
      rod('striking face', [-.26, .72, 0], [-.17, .72, 0], .21, 'metal');
      ring('striking face bevel', .196, .018, [-.264, .72, 0], 'shell').rotation.z = Math.PI / 2;
      for (const side of [-1, 1]) ellipsoid('head pin', [.034, .034, .016], [0, .72, side * .091], 'dark');
      for (const z of [-.055, .055]) tube('split claw', [[.13, .75, z], [.27, .77, z], [.35, .69, z]], .027, 'metal');
      box('handle wedge', [.065, .015, .095], [0, .812, 0], 'wood');
      break;
    }
    case 'spear': {
      rod('wooden spear shaft', [0, 0, 0], [0, 1.48, 0], .058, 'woodLight', .047);
      for (let i = 0; i < 4; i++) tube('shaft grain', [[-.027, .22 + i * .25, 0], [-.03, .35 + i * .25, .014], [-.022, .48 + i * .25, -.008]], .006, 'wood');
      rod('spear socket', [0, 1.39, 0], [0, 1.55, 0], .085, 'metal', .065);
      const blade = add(MeshBuilder.CreateCylinder(name('faceted spear blade'), { height: .34, diameterBottom: .2, diameterTop: 0, tessellation: 4 }, scene), 'metal', [0, 1.7, 0]);
      blade.scaling.z = .35;
      rod('blade central ridge', [0, 1.54, -.036], [0, 1.82, -.006], .022, 'shell', 0);
      for (const side of [-1, 1]) tube('sharpened blade edge', [[side * .066, 1.55, 0], [side * .092, 1.63, 0], [0, 1.87, 0]], .009, 'shell');
      lash(1.32, .043, 4);
      lash(.65, .035, 4);
      rod('counterweight cap', [0, 0, 0], [0, .07, 0], .074, 'metal', .052);
      break;
    }
    case 'compass': {
      rod('brass compass case', [0, .02, 0], [0, .09, 0], .42, 'metal');
      rod('ivory compass dial', [0, .091, 0], [0, .096, 0], .35, 'cloth');
      ring('raised bezel', .397, .025, [0, .104, 0], 'metal');
      for (let i = 0; i < 16; i++) {
        const a = i * Math.PI / 8;
        box('dial graduation', [.012, .005, i % 4 === 0 ? .047 : .022], [Math.sin(a) * .142, .103, Math.cos(a) * .142], 'dark').rotation.y = a;
      }
      // North/south needle is geometric and remains legible without a texture.
      rod('north needle', [0, .117, 0], [0, .117, .126], .043, 'coral', 0);
      rod('south needle', [0, .117, 0], [0, .117, -.126], .043, 'metal', 0);
      ellipsoid('needle pivot', [.035, .026, .035], [0, .124, 0], 'metal');
      for (const [x, z] of [[0, .16], [.16, 0], [0, -.16], [-.16, 0]] as const) {
        const cardinal = box('raised cardinal marker', [.026, .012, .048], [x, .11, z], z > .1 ? 'coral' : 'dark');
        cardinal.rotation.y = Math.atan2(x, z);
      }
      const glass = ellipsoid('convex compass glass', [.34, .018, .34], [0, .137, 0], 'water');
      glass.isPickable = false;
      const loop = ring('lanyard loop', .094, .016, [0, .045, -.248], 'metal');
      loop.rotation.x = Math.PI / 2;
      break;
    }
    case 'purifier': {
      for (const x of [-.46, .46]) for (const z of [-.32, .32]) rod('frame leg', [x, 0, z], [x, .8, z], .065, 'wood');
      for (let i = 0; i < 5; i++) box('base slat', [.94, .07, .13], [0, .13, -.3 + i * .15], 'woodLight');
      rod('filter tank', [-.2, .2, 0], [-.2, .91, 0], .39, 'plastic');
      for (let i = 0; i < 4; i++) rod('visible filter layer', [-.2, .31 + i * .105, 0], [-.2, .36 + i * .105, 0], .35, i % 2 ? 'stone' : 'shell');
      for (const y of [.27, .78]) ring('tank strap', .4, .03, [-.2, y, 0], 'metal');
      rod('filter lid', [-.2, .9, 0], [-.2, .96, 0], .44, 'metal');
      tube('feed hose', [[-.2, .98, 0], [-.2, 1.09, 0], [.31, 1.09, 0], [.31, .85, 0]], .025, 'dark');
      rod('collection cup', [.3, .2, 0], [.3, .48, 0], .25, 'shell');
      rod('visible clean water', [.3, .481, 0], [.3, .486, 0], .21, 'water');
      tube('outlet spout', [[-.19, .45, -.18], [-.19, .45, -.29], [-.19, .37, -.29]], .025, 'metal');
      box('tap handle', [.13, .024, .025], [-.19, .51, -.24], 'coral');
      rod('pressure gauge case', [.02, .73, -.2], [.02, .79, -.2], .2, 'metal');
      rod('pressure gauge face', [.02, .791, -.2], [.02, .796, -.2], .16, 'cloth');
      box('gauge needle', [.012, .008, .065], [.02, .802, -.225], 'coral').rotation.y = -.55;
      break;
    }
    case 'grill': {
      for (const x of [-.48, .48]) for (const z of [-.3, .3]) rod('splayed grill leg', [x * 1.16, 0, z * 1.2], [x, .65, z], .06, 'metal');
      box('coal tray', [1.08, .08, .74], [0, .5, 0], 'dark');
      for (const z of [-.36, .36]) box('firebox side', [1.12, .25, .035], [0, .61, z], 'rust');
      for (const x of [-.54, .54]) box('firebox end', [.035, .25, .74], [x, .61, 0], 'metal');
      for (let i = 0; i < 8; i++) {
        const coal = add(MeshBuilder.CreateIcoSphere(name('charcoal'), { radius: .095, subdivisions: 1, flat: true }, scene), i % 3 ? 'dark' : 'ember', [-.37 + i % 4 * .24, .57, -.17 + Math.floor(i / 4) * .31]);
        coal.scaling.y = .65;
      }
      for (let i = 0; i < 9; i++) rod('cooking grate bar', [-.47 + i * .117, .75, -.33], [-.47 + i * .117, .75, .33], .022, 'metal');
      for (const z of [-.28, .28]) rod('grate brace', [-.49, .73, z], [.49, .73, z], .025, 'metal');
      const meal = ellipsoid('grilled fish meal', [.67, .15, .24], [0, .84, 0], 'fish');
      meal.rotation.y = .17;
      for (let i = 0; i < 4; i++) box('grill sear mark', [.025, .012, .2], [-.18 + i * .12, .918, 0], 'dark').rotation.y = .17;
      const foodTail = leaf([-.32, .84, 0], .24, .2, Math.PI / 2, 'coral');
      foodTail.rotation.x = Math.PI / 2;
      tube('carry handle', [[.56, .65, -.15], [.7, .65, -.15], [.7, .65, .15], [.56, .65, .15]], .024, 'metal');
      break;
    }
    case 'storage': {
      box('chest interior', [1.12, .65, .66], [0, .36, 0], 'wood');
      for (let i = 0; i < 6; i++) {
        const x = -.5 + i * .2;
        for (const z of [-.35, .35]) box('chest plank', [.188, .64, .045], [x, .36, z], i % 3 ? 'woodLight' : 'wood');
        box('lid plank', [.188, .065, .77], [x, .72, 0], 'woodLight');
      }
      for (const x of [-.43, .43]) {
        box('lid strap', [.067, .025, .78], [x, .766, 0], 'metal');
        for (const z of [-.38, .38]) {
          box('chest strap', [.067, .69, .023], [x, .375, z], 'metal');
          for (const y of [.12, .58]) ellipsoid('strap rivet', [.028, .028, .018], [x, y, z * 1.04], 'dark');
        }
      }
      box('latch plate', [.12, .19, .032], [0, .58, -.397], 'metal');
      box('latch slot', [.027, .065, .01], [0, .59, -.418], 'dark');
      for (const x of [-.56, .56]) for (const z of [-.39, .39]) {
        box('reinforced corner', [.065, .18, .035], [x, .2, z], 'metal');
        ellipsoid('corner rivet', [.026, .026, .014], [x, .22, z * 1.035], 'dark');
      }
      for (const x of [-.32, .32]) {
        const hinge = ring('lid hinge', .11, .02, [x, .69, .39], 'metal');
        hinge.rotation.z = Math.PI / 2;
      }
      for (const x of [-.63, .63]) {
        const handle = ring('chest handle', .18, .022, [x, .44, 0], 'metal');
        handle.rotation.z = Math.PI / 2;
      }
      break;
    }
  }

  // Baking transforms and merging each opaque surface reduces dozens of detail
  // draw calls to one per material, while leaving the root free to move/bob.
  const children: Mesh[] = [];
  for (const [material, meshes] of batches) {
    for (const mesh of meshes) mesh.computeWorldMatrix(true);
    const merged = meshes.length === 1 ? meshes[0] : Mesh.MergeMeshes(meshes, true, true);
    if (!merged) {
      for (const batch of batches.values()) for (const mesh of batch) if (!mesh.isDisposed()) mesh.dispose();
      root.dispose();
      throw new Error(`Unable to merge detailed item: ${itemId}`);
    }
    merged.name = `item.${itemId}.surface.${children.length}`;
    merged.material = material;
    merged.parent = root;
    merged.isPickable = true;
    merged.receiveShadows = true;
    merged.metadata = { itemId, procedural: true };
    children.push(merged);
  }
  const bounds = root.getHierarchyBoundingVectors(true);
  for (const mesh of children) {
    mesh.position.y -= bounds.min.y;
    shadows?.addShadowCaster(mesh, false);
    mesh.onDisposeObservable.addOnce(() => shadows?.removeShadowCaster(mesh, false));
  }
  root.metadata = {
    itemId, modelId: id, procedural: true,
    triangles: children.reduce((sum, mesh) => sum + mesh.getTotalIndices() / 3, 0),
    meshCount: children.length,
  };
  return root;
}
