import bpy, pathlib, json
root = pathlib.Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
for rel in ['Assets/Avatars/Adults/Male_Adult_07/Export/Male_Adult_07.fbx', 'Assets/Animations/all_animations_max_motextr_xy/m_walk_neutral.max.fbx']:
    bpy.ops.import_scene.fbx(filepath=str(root / 'art-source' / rel), use_anim=True)
    print('SOURCE', rel)
    for ob in bpy.context.selected_objects:
        if ob.type == 'ARMATURE':
            print('RIG', ob.name, list(ob.scale), list(ob.rotation_euler))
            print('BONES', [(b.name, list(b.head_local), list(b.tail_local)) for b in list(ob.data.bones)[:32]])
        if ob.type == 'MESH':
            print('MESH', ob.name, len(ob.data.vertices), list(ob.dimensions), [(s.material.name if s.material else '') for s in ob.material_slots])
    print('ACTIONS', [(a.name, list(a.frame_range), len(a.fcurves)) for a in bpy.data.actions])
print('IMAGES', [(i.name, i.filepath) for i in bpy.data.images])
