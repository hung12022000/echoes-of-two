"""Blender 4.5: retarget MIT Rocketbox motion and pack web-ready GLBs.

Run after downloading scripts/asset-sources.json into art-source/.
No Blender installation, textures, or original FBX files are deployed.
"""
import bpy, pathlib, math, json
from mathutils import Matrix, Vector

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art-source' / 'Assets'
OUT = ROOT / 'public' / 'models'
OUT.mkdir(parents=True, exist_ok=True)

def build(role, avatar, prefix):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    folder = SOURCE / 'Avatars' / 'Adults' / avatar
    bpy.ops.import_scene.fbx(filepath=str(folder / 'Export' / (avatar + '.fbx')), use_anim=False)
    rig = next(o for o in bpy.context.selected_objects if o.type == 'ARMATURE')
    meshes = [o for o in bpy.context.selected_objects if o.type == 'MESH']
    original = set(bpy.context.scene.objects)
    rig.animation_data_clear()
    # Original spectacles inspired by the user's illustrated couple reference.
    spectacle = bpy.data.materials.new(role + '_glasses')
    spectacle.diffuse_color = (0.015,0.018,0.018,1) if role == 'hung' else (0.24,0.15,0.07,1)
    spectacle.use_nodes = True
    spectacle.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value = spectacle.diffuse_color
    spectacle.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value = 0.7
    spectacle.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value = 0.3
    glasses_parts = []
    eyes = [rig.matrix_world @ rig.data.bones[n].head_local for n in ['Bip01 REye','Bip01 LEye']]
    def wire(points, closed=False):
        curve = bpy.data.curves.new('spectacle frame', 'CURVE'); curve.dimensions='3D';curve.bevel_depth=0.002;curve.bevel_resolution=2
        line=curve.splines.new('POLY');line.points.add(len(points)-1);line.use_cyclic_u=closed
        for p, co in zip(line.points, points): p.co=(*co,1)
        ob=bpy.data.objects.new('glasses',curve);bpy.context.collection.objects.link(ob)
        bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob;bpy.ops.object.convert(target='MESH')
        ob=bpy.context.object;ob.data.materials.append(spectacle)
        group=ob.vertex_groups.new(name='Bip01 Head');group.add(list(range(len(ob.data.vertices))),1,'REPLACE')
        modifier=ob.modifiers.new('head skin','ARMATURE');modifier.object=rig
        world=ob.matrix_world.copy();ob.parent=rig;ob.matrix_world=world
        glasses_parts.append(ob)
    for eye in eyes:
        points=[]
        for i in range(32):
            a=i/32*math.tau;c=math.cos(a);s=math.sin(a)
            if role=='hung': c=math.copysign(abs(c)**0.55,c);s=math.copysign(abs(s)**0.55,s)
            points.append((eye.x+c*0.029,eye.y-0.048,eye.z+s*0.023))
        wire(points, True)
        side=-1 if eye.x<0 else 1
        wire([(eye.x+side*.029,eye.y-.048,eye.z+.005),(eye.x+side*.037,eye.y+.07,eye.z+.002)])
    wire([(eyes[0].x*.15,eyes[0].y-.048,eyes[0].z+.003),(eyes[1].x*.15,eyes[1].y-.048,eyes[1].z+.003)])
    original.update(glasses_parts)
    # Replace Max-specific material graphs with portable glTF PBR graphs.
    for mesh in meshes:
        for slot in mesh.material_slots:
            mat = slot.material
            name = mat.name
            mat.use_nodes = True
            nodes = mat.node_tree.nodes
            nodes.clear()
            bs = nodes.new('ShaderNodeBsdfPrincipled')
            bs.inputs['Roughness'].default_value = 0.74
            bs.inputs['Specular IOR Level'].default_value = 0.28
            output = nodes.new('ShaderNodeOutputMaterial')
            mat.node_tree.links.new(bs.outputs['BSDF'], output.inputs['Surface'])
            path = folder / 'Textures' / (name + '_color.tga')
            img = bpy.data.images.load(str(path), check_existing=False)
            img.scale(1024, 1024)
            img.file_format = 'PNG'
            img.pack()
            tex = nodes.new('ShaderNodeTexImage'); tex.image = img
            mat.node_tree.links.new(tex.outputs['Color'], bs.inputs['Base Color'])
            if 'opacity' in name:
                mat.node_tree.links.new(tex.outputs['Alpha'], bs.inputs['Alpha'])
                mat.surface_render_method = 'DITHERED'
                mat.use_backface_culling = False
            else:
                normal_path = folder / 'Textures' / (name + '_normal.tga')
                if normal_path.exists():
                    normal = bpy.data.images.load(str(normal_path), check_existing=False)
                    normal.colorspace_settings.name = 'Non-Color'
                    normal.scale(1024, 1024); normal.file_format = 'PNG'; normal.pack()
                    nt = nodes.new('ShaderNodeTexImage'); nt.image = normal
                    nm = nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 0.45
                    mat.node_tree.links.new(nt.outputs['Color'], nm.inputs['Color'])
                    mat.node_tree.links.new(nm.outputs['Normal'], bs.inputs['Normal'])
        for p in mesh.data.polygons: p.use_smooth = True
    rig.animation_data_create()
    baked = []
    clips = [('idle', 'static', 'idle_breathe_01'), ('walk', 'xy', 'walk_neutral'),
             ('run', 'xy', 'run_neutral'), ('wave', 'static', 'wave_01'),
             ('victory', 'static', 'cheer_03'), ('kneel', 'static', 'crouch_in')]
    base_world = rig.matrix_world.copy()
    for name, directory, filename in clips:
        if prefix == 'm' and filename == 'crouch_in': directory = 'xy'
        filepath = SOURCE / 'Animations' / ('all_animations_max_motextr_' + directory) / (prefix + '_' + filename + '.max.fbx')
        bpy.ops.import_scene.fbx(filepath=str(filepath), use_anim=True)
        imported = set(bpy.context.scene.objects) - original
        src = next(o for o in imported if o.type == 'ARMATURE')
        action = src.animation_data.action
        start, end = [int(v) for v in action.frame_range]
        bpy.context.scene.frame_set(start)
        origin = src.matrix_world.translation.copy()
        target = bpy.data.actions.new(name)
        rig.animation_data.action = target
        rig.matrix_world = base_world
        for frame in range(start, end + 1):
            bpy.context.scene.frame_set(frame)
            # Match world-space rotations, retaining target bone lengths; strip
            # horizontal root motion because the collision controller owns it.
            for pb in rig.pose.bones:
                sb = src.pose.bones.get(pb.name)
                if sb is None: continue
                world = src.matrix_world @ sb.matrix
                world.translation.x -= origin.x
                world.translation.y -= origin.y
                desired = rig.matrix_world.inverted() @ world
                if pb.parent and src.pose.bones.get(pb.parent.name):
                    parent_world = src.matrix_world @ src.pose.bones[pb.parent.name].matrix
                    parent_world.translation.x -= origin.x
                    parent_world.translation.y -= origin.y
                    basis = pb.bone.convert_local_to_pose(desired, pb.bone.matrix_local,
                        parent_matrix=rig.matrix_world.inverted() @ parent_world,
                        parent_matrix_local=pb.parent.bone.matrix_local, invert=True)
                else:
                    basis = pb.bone.convert_local_to_pose(desired, pb.bone.matrix_local, invert=True)
                pb.rotation_mode = 'QUATERNION'
                pb.rotation_quaternion = basis.to_quaternion()
                pb.location = basis.translation if not pb.parent else (0, 0, 0)
                pb.scale = (1, 1, 1)
                pb.keyframe_insert('location', frame=frame - start)
                pb.keyframe_insert('rotation_quaternion', frame=frame - start)
                pb.keyframe_insert('scale', frame=frame - start)
            bpy.context.view_layer.update()
        target.use_fake_user = True
        baked.append(target)
        rig.animation_data.action = None
        for ob in imported: bpy.data.objects.remove(ob, do_unlink=True)
        print('BAKED', role, name, end - start + 1, flush=True)
    for act in baked:
        track = rig.animation_data.nla_tracks.new(); track.name = act.name
        strip = track.strips.new(act.name, 0, act); strip.name = act.name
    # Export only the actual character, never animation source armatures/helpers.
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    for mesh in meshes + glasses_parts: mesh.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.context.scene.render.fps = 30
    bpy.context.scene.frame_set(0)
    bpy.ops.export_scene.gltf(filepath=str(OUT / (role + '.glb')), export_format='GLB',
        use_selection=True, export_animations=True, export_animation_mode='NLA_TRACKS',
        export_nla_strips=True, export_force_sampling=True, export_optimize_animation_size=True,
        export_image_format='AUTO', export_materials='EXPORT', export_yup=True)
    print('EXPORTED', role, (OUT / (role + '.glb')).stat().st_size, flush=True)

build('hung', 'Male_Adult_07', 'm')
build('mei', 'Female_Adult_03', 'f')
