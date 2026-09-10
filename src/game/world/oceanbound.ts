import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import type { BuildingRecord, NearbyResource, Weather } from '../oceanbound/session';
import { terrainHeight } from './terrain';
import { mat } from './temple';

interface ResourceNode extends NearbyResource { mesh: Mesh; phase: number; respawnAt: number }

const RESOURCE_LAYOUT = [
  ['driftwood', -8, 51], ['fiber', 7, 52], ['plastic', 13, 58], ['stone', -14, 45],
  ['scrap', -23, 58], ['coconut', 19, 40], ['driftwood', 27, 52], ['fiber', -30, 38],
  ['plastic', 33, 29], ['stone', -35, 19], ['scrap', 38, 9], ['fish', -45, 63],
] as const;

function addBox(parent: TransformNode, scene: Scene, name: string, size: Vector3, position: Vector3, material: ReturnType<typeof mat>) {
  const mesh = MeshBuilder.CreateBox(name, { width: size.x, height: size.y, depth: size.z }, scene);
  mesh.parent = parent; mesh.position.copyFrom(position); mesh.material = material; return mesh;
}

export function createOceanboundWorld(scene: Scene, shadows: ShadowGenerator) {
  const wood = mat(scene, 'oceanbound weathered wood', '#79543a', 0, 0.82);
  const woodLight = mat(scene, 'oceanbound sunlit wood', '#ad7a49', 0, 0.78);
  const rope = mat(scene, 'oceanbound rope', '#c5a86f', 0, 0.9);
  const cloth = mat(scene, 'oceanbound sail', '#e8d9b8', 0, 0.88); cloth.backFaceCulling = false;
  const metal = mat(scene, 'oceanbound metal', '#657581', 0.55, 0.34);
  const leaf = mat(scene, 'oceanbound fiber', '#5f9345', 0, 0.92);
  const plastic = mat(scene, 'oceanbound recycled plastic', '#df8b55', 0, 0.66);
  const stone = mat(scene, 'oceanbound stone', '#686d68', 0, 0.96);
  const water = mat(scene, 'oceanbound water container', '#52d5da', 0.1, 0.22); water.alpha = 0.8;
  const dark = mat(scene, 'oceanbound shark', '#274b59', 0, 0.72);

  const raft = new TransformNode('starter raft', scene); raft.position.set(0, -1.62, 72);
  for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) {
    const plank = addBox(raft, scene, 'raft plank', new Vector3(0.9, 0.18, 0.9), new Vector3(x * 0.92, 0, z * 0.92), (x + z) % 2 ? wood : woodLight);
    shadows.addShadowCaster(plank);
  }
  const mast = MeshBuilder.CreateCylinder('raft mast', { height: 5.4, diameter: 0.18, tessellation: 8 }, scene); mast.parent = raft; mast.position.y = 2.6; mast.material = wood;
  const sail = MeshBuilder.CreatePlane('raft sail', { width: 3.4, height: 2.7, sideOrientation: Mesh.DOUBLESIDE }, scene); sail.parent = raft; sail.position.set(0, 3.1, 0.08); sail.rotation.y = Math.PI / 2; sail.material = cloth;
  const stripe = addBox(raft, scene, 'sail emblem', new Vector3(0.05, 0.22, 2.1), new Vector3(0.03, 3.1, 0), metal); stripe.rotation.x = Math.PI / 2;

  const resourceMaterials = { driftwood: woodLight, fiber: leaf, plastic, stone, scrap: metal, coconut: wood, fish: water };
  const nodes: ResourceNode[] = RESOURCE_LAYOUT.map(([item, x, z], index) => {
    const y = terrainHeight(x, z) + 0.45;
    const mesh = item === 'stone'
      ? MeshBuilder.CreateIcoSphere(`resource ${item}`, { radius: 0.48, subdivisions: 1 }, scene)
      : item === 'scrap'
        ? MeshBuilder.CreateTorus(`resource ${item}`, { diameter: 0.85, thickness: 0.18, tessellation: 12 }, scene)
        : item === 'coconut'
          ? MeshBuilder.CreateSphere(`resource ${item}`, { diameter: 0.68, segments: 10 }, scene)
          : item === 'fish'
            ? MeshBuilder.CreateCylinder(`resource ${item}`, { height: 1.1, diameterTop: 0.18, diameterBottom: 0.42, tessellation: 8 }, scene)
            : MeshBuilder.CreateBox(`resource ${item}`, { width: item === 'fiber' ? 0.55 : 1.15, height: 0.22, depth: item === 'fiber' ? 0.55 : 0.38 }, scene);
    mesh.position.set(x, y, z); mesh.material = resourceMaterials[item]; mesh.rotation.set(index * 0.3, index * 0.8, index * 0.13);
    const halo = MeshBuilder.CreateTorus('resource glint', { diameter: 1.25, thickness: 0.035, tessellation: 24 }, scene); halo.parent = mesh; halo.rotation.x = Math.PI / 2; halo.material = water;
    return { nodeId: `node-${index}`, item, amount: item === 'scrap' ? 1 : 2, mesh, phase: index * 0.77, respawnAt: 0 };
  });

  const shark = new TransformNode('reef shark threat', scene);
  const body = MeshBuilder.CreateCapsule('shark body', { height: 3.4, radius: 0.55, tessellation: 10 }, scene); body.parent = shark; body.rotation.z = Math.PI / 2; body.material = dark;
  const fin = MeshBuilder.CreateCylinder('shark fin', { height: 1.2, diameterTop: 0, diameterBottom: 0.9, tessellation: 3 }, scene); fin.parent = shark; fin.position.y = 0.48; fin.rotation.z = Math.PI; fin.material = dark;
  shark.position.y = -1.95;

  const built = new Map<string, TransformNode>();
  function createBuilding(record: BuildingRecord) {
    const root = new TransformNode(`built ${record.type} ${record.id}`, scene); root.position.set(record.x, terrainHeight(record.x, record.z), record.z); root.rotation.y = record.rotation;
    if (record.type === 'foundation') addBox(root, scene, 'foundation deck', new Vector3(3.8, 0.3, 3.8), new Vector3(0, 0.15, 0), woodLight);
    else if (record.type === 'wall') addBox(root, scene, 'timber wall', new Vector3(3.8, 2.7, 0.22), new Vector3(0, 1.35, 0), wood);
    else if (record.type === 'door') {
      addBox(root, scene, 'door left', new Vector3(1.2, 2.7, 0.24), new Vector3(-1.3, 1.35, 0), wood);
      addBox(root, scene, 'door right', new Vector3(1.2, 2.7, 0.24), new Vector3(1.3, 1.35, 0), wood);
      addBox(root, scene, 'door lintel', new Vector3(1.4, 0.5, 0.24), new Vector3(0, 2.45, 0), woodLight);
    } else if (record.type === 'roof') {
      const roof = addBox(root, scene, 'palm roof', new Vector3(4.4, 0.2, 4.4), new Vector3(0, 2.9, 0), leaf); roof.rotation.z = 0.14;
    } else if (record.type === 'storage') {
      addBox(root, scene, 'storage chest', new Vector3(1.5, 0.9, 0.8), new Vector3(0, 0.45, 0), woodLight);
      addBox(root, scene, 'storage band', new Vector3(0.13, 0.94, 0.84), new Vector3(0, 0.46, 0), metal);
    } else if (record.type === 'purifier') {
      const tank = MeshBuilder.CreateCylinder('water purifier', { height: 1.4, diameter: 1.05, tessellation: 16 }, scene); tank.parent = root; tank.position.y = 0.7; tank.material = water;
      addBox(root, scene, 'purifier frame', new Vector3(1.4, 0.12, 1.4), new Vector3(0, 0.08, 0), metal);
    } else if (record.type === 'grill') {
      addBox(root, scene, 'stone grill', new Vector3(1.5, 0.8, 1.1), new Vector3(0, 0.4, 0), stone);
      const grate = addBox(root, scene, 'grill grate', new Vector3(1.35, 0.08, 0.95), new Vector3(0, 0.86, 0), metal); grate.rotation.y = 0.1;
    } else if (record.type === 'beacon') {
      const pole = MeshBuilder.CreateCylinder('claim beacon', { height: 5.4, diameter: 0.18, tessellation: 8 }, scene); pole.parent = root; pole.position.y = 2.7; pole.material = metal;
      const signal = MeshBuilder.CreateTorus('beacon signal', { diameter: 1.15, thickness: 0.09, tessellation: 20 }, scene); signal.parent = root; signal.position.y = 5.1; signal.material = water;
    } else if (record.type === 'anchor') {
      const ring = MeshBuilder.CreateTorus('storm anchor ring', { diameter: 1.4, thickness: 0.22, tessellation: 18 }, scene); ring.parent = root; ring.position.y = 0.75; ring.material = metal;
      const shaft = addBox(root, scene, 'storm anchor shaft', new Vector3(0.22, 1.8, 0.22), new Vector3(0, 0.8, 0), metal); shaft.rotation.z = 0.1;
    } else {
      const pole = MeshBuilder.CreateCylinder('lightning rod', { height: 6, diameterTop: 0.05, diameterBottom: 0.25, tessellation: 8 }, scene); pole.parent = root; pole.position.y = 3; pole.material = metal;
      const ring = MeshBuilder.CreateTorus('grounding ring', { diameter: 1.8, thickness: 0.08, tessellation: 20 }, scene); ring.parent = root; ring.position.y = 0.08; ring.material = rope;
    }
    for (const child of root.getChildMeshes()) { child.receiveShadows = true; shadows.addShadowCaster(child); }
    built.set(record.id, root);
  }

  function syncBuildings(records: BuildingRecord[]) {
    const ids = new Set(records.map(record => record.id));
    for (const [id, root] of built) if (!ids.has(id)) { root.dispose(); built.delete(id); }
    for (const record of records) if (!built.has(record.id)) createBuilding(record);
  }

  return {
    nearestResource(x: number, z: number): NearbyResource | undefined {
      const now = performance.now();
      let nearest: ResourceNode | undefined; let best = 3.2;
      for (const node of nodes) {
        if (!node.mesh.isEnabled() && node.respawnAt <= now) node.mesh.setEnabled(true);
        if (!node.mesh.isEnabled()) continue;
        const distance = Math.hypot(node.mesh.position.x - x, node.mesh.position.z - z);
        if (distance < best) { nearest = node; best = distance; }
      }
      return nearest && { nodeId: nearest.nodeId, item: nearest.item, amount: nearest.amount };
    },
    collect(nodeId: string) {
      const node = nodes.find(candidate => candidate.nodeId === nodeId && candidate.mesh.isEnabled());
      if (!node) return;
      node.mesh.setEnabled(false); node.respawnAt = performance.now() + 30000;
    },
    syncBuildings,
    update(time: number, weather: Weather, reduced: boolean) {
      const motion = reduced ? 0 : time;
      raft.position.y = -1.62 + Math.sin(motion * 0.9) * (weather === 'Bão nhiệt đới' ? 0.28 : 0.08);
      raft.rotation.z = Math.sin(motion * 0.55) * (weather === 'Bão nhiệt đới' ? 0.08 : 0.02);
      sail.rotation.z = Math.sin(motion * 1.1) * 0.035;
      stripe.visibility = weather === 'Bão nhiệt đới' ? 0.45 : 0.8;
      nodes.forEach(node => { if (node.mesh.isEnabled()) { node.mesh.position.y = terrainHeight(node.mesh.position.x, node.mesh.position.z) + 0.45 + Math.sin(motion * 1.5 + node.phase) * 0.08; node.mesh.rotation.y += reduced ? 0 : 0.004; } });
      const angle = motion * 0.11;
      shark.position.x = Math.sin(angle) * 62; shark.position.z = 20 + Math.cos(angle) * 58; shark.rotation.y = angle + Math.PI / 2;
      const storm = weather === 'Bão nhiệt đới';
      scene.fogDensity = storm ? 0.012 : weather === 'Gió mạnh' ? 0.004 : 0.0015;
      scene.fogColor = storm ? new Color3(0.3, 0.42, 0.48) : new Color3(0.72, 0.85, 0.88);
    },
  };
}
