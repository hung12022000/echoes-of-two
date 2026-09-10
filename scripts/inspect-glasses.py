import bpy, pathlib
from mathutils import Vector
root=pathlib.Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(root/'art-source/Assets/Avatars/Adults/Male_Adult_07/Export/Male_Adult_07.fbx'),use_anim=False)
rig=next(o for o in bpy.context.selected_objects if o.type=='ARMATURE')
for n in ['Bip01 Head','Bip01 REye','Bip01 LEye']:
 print(n,tuple(rig.matrix_world@rig.data.bones[n].head_local),tuple(rig.matrix_world@rig.data.bones[n].tail_local))
for ob in bpy.context.selected_objects:
 if ob.type!='MESH':continue
 verts=[ob.matrix_world@v.co for v in ob.data.vertices]
 eye=rig.matrix_world@rig.data.bones['Bip01 REye'].head_local
 layer=[v for v in verts if abs(v.z-eye.z)<.01]
 print('EYE_LAYER',len(layer),'Y',min(v.y for v in layer),max(v.y for v in layer))
