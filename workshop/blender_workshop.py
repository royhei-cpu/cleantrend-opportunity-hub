"""Homecare Atlas A0 exterior design studies. Run in Blender 5.2+.

blender -b --python blender_workshop.py -- --data workshop-data.json --out output
Native units: metres. Source dimensions: millimetres. Not production CAD.
"""
import bpy, math, json, argparse, sys, base64
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

args=argparse.ArgumentParser()
args.add_argument('--data',required=True);args.add_argument('--out',required=True)
args.add_argument('--ids',default='');args.add_argument('--samples',type=int,default=32)
opts=args.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
data=json.loads(Path(opts.data).read_text());out=Path(opts.out);out.mkdir(parents=True,exist_ok=True)
chosen=set(opts.ids.split(',')) if opts.ids else None
MM=.001

def material(name,color,rough=.4,metallic=0,texture=False):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metallic
    if texture:
        noise=m.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=240
        bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.00025
        m.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
    return m

def root(name):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);return o

def tag(o,name,mat,code,parent):
    o.name=name;o.data.materials.append(mat);o.parent=parent
    o['partCode']=code;o['designStatus']='A0 exterior concept; engineering review required'
    return o

def box(name,dims,loc,mat,code,parent,bevel=3):
    bpy.ops.mesh.primitive_cube_add(size=1,location=Vector(loc)*MM);o=bpy.context.object;o.dimensions=Vector(dims)*MM
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=o.modifiers.new('Molded edge radius','BEVEL');m.width=min(bevel,min(dims)/3)*MM;m.segments=4
        m=o.modifiers.new('Surface normals','WEIGHTED_NORMAL')
    return tag(o,name,mat,code,parent)

def cyl(name,radius,length,loc,mat,code,parent,axis='Z'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=radius*MM,depth=length*MM,location=Vector(loc)*MM)
    o=bpy.context.object
    if axis=='X':o.rotation_euler[1]=math.pi/2
    if axis=='Y':o.rotation_euler[0]=math.pi/2
    for p in o.data.polygons:p.use_smooth=True
    bevel=o.modifiers.new('Edge break','BEVEL');bevel.width=min(radius*.1,.8)*MM;bevel.segments=3
    return tag(o,name,mat,code,parent)

def tray(name,w,d,h,loc,mat,code,parent):
    x,y,z=loc;t=2.2
    box(name+' floor',(w,d,t),(x,y,z+t/2),mat,code,parent)
    for suffix,dim,pos in [('left',(t,d,h),(x-w/2+t/2,y,z+h/2)),('right',(t,d,h),(x+w/2-t/2,y,z+h/2)),('front',(w-2*t,t,h),(x,y-d/2+t/2,z+h/2)),('back',(w-2*t,t,h),(x,y+d/2-t/2,z+h/2))]:
        box(name+' '+suffix,dim,pos,mat,code,parent,2)

def brush(name,loc,length,mat,code,parent,head=42):
    x,y,z=loc
    box(name+' handle',(19,17,length-head*.55),(x,y,z+(length-head*.55)/2),mat,code,parent,8)
    cyl(name+' head',head/2,12,(x,y,z+length-head*.2),ivory,code,parent,axis='Y')
    for i in range(-3,4):
        for j in range(-3,4):
            if i*i+j*j<=10:
                cyl(name+f' tuft {i} {j}',1.1,13,(x+i*head/9,y-12,z+length-head*.2+j*head/9),bristle,code,parent,axis='Y')
    box(name+' soft grip',(23,20,length*.36),(x,y,z+length*.32),rubber,code,parent,8)

def bottle(name,loc,w,d,h,code,parent,pump=False,cap=False,closurecode=None,labelcode=None):
    x,y,z=loc
    closurecode=closurecode or code;labelcode=labelcode or code
    box(name+' molded body',(w,d,h*.67),(x,y,z+h*.335),body,code,parent,14)
    box(name+' shoulder',(w*.8,d*.8,h*.12),(x,y,z+h*.70),body,code,parent,12)
    cyl(name+' neck',w*.16,h*.12,(x,y,z+h*.80),ivory,code,parent)
    for ring in [0,2,4]:cyl(name+f' closure ring {ring}',w*.18,1.5,(x,y,z+h*.82+ring),ivory,closurecode,parent)
    if cap:
        cyl(name+' closure',w*.20,h*.15,(x,y,z+h*.92),body,closurecode,parent)
    elif pump:
        cyl(name+' pump stem',5,h*.08,(x,y,z+h*.89),ivory,closurecode,parent)
        box(name+' pump top',(w*.65,d*.5,h*.06),(x-w*.16,y,z+h*.97),body,closurecode,parent,4)
    else:
        box(name+' trigger head',(w*.83,d*.65,h*.10),(x-w*.07,y,z+h*.94),ivory,closurecode,parent,7)
        lever=box(name+' squeeze lever',(10,d*.50,h*.19),(x-w*.25,y,z+h*.81),body,closurecode,parent,4);lever.rotation_euler[1]=-.3
        cyl(name+' adjustable nozzle',7,8,(x-w*.48,y,z+h*.94),dark,closurecode,parent,axis='X')
    box(name+' task label',(w*.64,1,h*.30),(x,y-d/2-.6,z+h*.39),ivory,labelcode,parent,2)
    for i in range(3):box(name+f' label rule {i}',(w*.36-i*3,1.2,1.8),(x,y-d/2-1.3,z+h*.46-i*11),body,labelcode,parent,.4)
    box(name+' fill-line marker',(w*.56,1.2,1.4),(x,y-d/2-1.3,z+h*.56),dark,code,parent,.3)

def bounds(objects):
    bpy.context.view_layer.update()
    pts=[o.matrix_world@Vector(c) for o in objects if o.type=='MESH' for c in o.bound_box]
    return Vector([min(v[i] for v in pts) for i in range(3)]),Vector([max(v[i] for v in pts) for i in range(3)])

def camera_for(objects,front=False):
    lo,hi=bounds(objects);center=(lo+hi)/2;size=hi-lo;span=max(size)
    bpy.ops.object.camera_add();cam=bpy.context.object;cam.name='Delivery camera'
    cam.location=center+(Vector((0,-3,0))*span if front else Vector((1.65,-2.6,1.9))*span)
    cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO'
    if size.z>size.x*1.8 and not front:cam.rotation_euler.rotate_axis('Z',-.65)
    inv=cam.rotation_euler.to_matrix().transposed()
    projected=[inv@(o.matrix_world@Vector(c)-center) for o in objects for c in o.bound_box]
    pw=max(v.x for v in projected)-min(v.x for v in projected);ph=max(v.y for v in projected)-min(v.y for v in projected)
    cam.data.ortho_scale=max(pw,ph*1200/900)*1.18
    bpy.context.scene.camera=cam;return cam

def studio(objects):
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=opts.samples;scene.cycles.use_denoising=True
    scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='JPEG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.quality=88
    scene.world.use_nodes=True;bg=scene.world.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(.88,.865,.82,1);bg.inputs['Strength'].default_value=.35
    scene.view_settings.view_transform='AgX'
    lo,hi=bounds(objects);center=(lo+hi)/2;span=max(hi-lo)
    floor=box('Studio cyclorama',(100000,100000,5),(center.x/MM,center.y/MM,-3),floor_mat,'STUDIO',None,0)
    for name,offset,power,area in [('Key',(-1.5,-1.6,2.5),180,2.2),('Fill',(1.8,-.2,1.6),80,1.7),('Rim',(.4,2,2.1),220,1.5)]:
        bpy.ops.object.light_add(type='AREA',location=center+Vector(offset)*span)
        light=bpy.context.object;light.name=name;light.data.energy=power*max(span,.25)**2;light.data.shape='DISK';light.data.size=span*area
        light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
    camera_for(objects);return floor

for proposal in data['concepts']:
    if chosen and proposal['id'] not in chosen:continue
    ident=proposal['id'];print('BUILDING '+ident,flush=True)
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    for m in list(bpy.data.materials):bpy.data.materials.remove(m)
    body=material('HA_body',(.30,.37,.24),.40,texture=True)
    ivory=material('HA_chalk',(.77,.75,.67),.48,texture=True)
    rubber=material('HA_soft_grip',(.12,.21,.17),.65,texture=True)
    dark=material('HA_graphite',(.035,.055,.045),.5)
    metal=material('HA_satin_aluminum',(.62,.65,.66),.25,.8)
    textile=material('HA_textile',(.69,.70,.58),.9,texture=True)
    bristle=material('HA_bristles',(.20,.25,.20),.55)
    floor_mat=material('Studio ivory',(.88,.865,.82),.75)
    primary=root(proposal['code']+' primary assembly');primary['role']='primaryAssembly'
    primary['nominalDimensionsMm']=proposal['envelope'];primary['revision']='A0'
    code=lambda n:proposal['code']+'-'+f'{n:02d}'
    w,d,h=proposal['envelope'];kind=proposal['kind'];aux=[]
    if kind in ['mop','scrubber','squeegee']:
        box('Contact pad or blade',(w,d,7),(0,0,3.5),textile if kind!='squeegee' else rubber,code(2),primary,4)
        box('Head carrier',(w*.96,d*.92,16),(0,0,15),body,code(1),primary,8)
        cyl('Head pivot',15,42,(0,0,35),ivory,code(5),primary,axis='Y')
        cyl('Lower shaft',11,h*.48,(0,0,50+h*.24),metal,code(3),primary)
        cyl('Upper shaft',9,h*.44,(0,0,h*.71),metal,code(3),primary)
        cyl('Twist collar',14,42,(0,0,h*.52),body,code(4),primary)
        cyl('Soft grip',18 if kind=='scrubber' else 16,120,(0,0,h-60),body,code(4),primary)
        cyl('End loop',12,8,(0,0,h-4),ivory,code(4),primary)
        box('Release control',(22,18,7),(0,-15,55),rubber,code(5),primary,4)
        if kind=='mop':
            accessory=root('Separate rail and alternative heads');aux.append(accessory)
            box('Storage rail',(320,42,25),(340,70,35),ivory,code(8),accessory,8)
            for x in [230,340,450]:box('Rail clip',(25,50,40),(x,60,48),body,code(8),accessory,6)
            box('Alternative duster textile',(165,55,25),(320,0,20),textile,code(6),accessory,12)
            box('Alternative squeegee',(215,30,17),(320,-100,15),body,code(7),accessory,5)
            box('Alternative squeegee blade',(215,5,15),(320,-118,15),rubber,code(7),accessory,1)
    elif kind=='bottle':bottle('Measured refill bottle',(0,0,0),w,d,h,code(1),primary,closurecode=code(2),labelcode=code(5))
    elif kind in ['pet','trio','mineral','sink','caddy']:
        if kind!='caddy':tray('Removable docking tray',w,d,32,(0,0,0),body,code(1),primary)
        if kind=='trio':
            for i in [-1,0,1]:bottle('Task bottle '+str(i),(i*88,0,6),74,65,h-6,code(1),primary,pump=i==0,cap=i==1,closurecode=code(2),labelcode=code(4))
        elif kind=='caddy':
            tray('Caddy walls',w,d,120,(0,0,0),body,code(1),primary)
            for x in [-w/2+12,w/2-12]:box('Handle upright',(15,20,h-90),(x,0,90+(h-90)/2),ivory,code(2),primary,6)
            box('Carry grip',(w-12,22,23),(0,0,h-12),ivory,code(2),primary,10)
            bottle('Surface bottle',(-75,0,5),75,60,225,code(4),primary)
            brush('Detail brush',(60,-25,15),180,body,code(6),primary,32)
            box('Folded cloth',(90,60,20),(65,35,35),textile,code(7),primary,5)
            box('Glass finishing head',(100,22,20),(65,40,110),ivory,code(8),primary,5)
        else:
            bottle('Task bottle',(-w*.23,8,5),w*.37,d*.63,h-5,code(4 if kind in ['pet','sink'] else 1),primary,pump=kind=='sink',cap=kind=='mineral')
            brush('Task brush',(w*.25,-5,20),h*.81,body,code(2 if kind=='pet' else 3),primary,50 if kind=='sink' else 38)
            box('Separated textile',(w*.38,35,12),(w*.22,d*.25,40),textile,code(3 if kind=='pet' else 6 if kind=='sink' else 5),primary,4)
            box('Wet dry divider',(3,d*.75,45),(0,0,27),ivory,code(1),primary,1)
    elif kind=='parts':
        tray('Service-parts box',w,d,h,(0,0,0),ivory,code(6),primary)
        cyl('HA-01 coupler',18,40,(-42,0,25),body,code(1),primary)
        box('Release button',(22,18,8),(5,-20,20),body,code(2),primary,4)
        cyl('Spring exterior proxy',6,20,(12,18,22),metal,code(3),primary,axis='X')
        for y in [-20,0]:cyl('M3 service screw',2.5,15,(47,y,14),metal,code(4),primary,axis='Y')
        box('Blade service insert',(100,6,12),(0,43,20),rubber,code(5),primary,2)
    elif kind=='cloths':
        tray('Drying tray',w,d,18,(0,0,0),body,code(4),primary)
        for x in [-95,95]:box('Rack upright',(12,14,h),(x,26,h/2),ivory,code(3),primary,5)
        for i,y in enumerate([-28,0,28]):
            cyl('Drying rail '+str(i),5,w-20,(0,y,h-6),body,code(3),primary,axis='X')
            box('Folded room cloth '+str(i),(140,3,108),(0,y-5,h-60),textile,code(1),primary,1)
            box('Stitched room symbol '+str(i),(20+i*5,2,12),(42,y-8,h-35),body,code(2),primary,1)
    elif kind=='detail':
        tray('Divided precision-tool holder',w,d,60,(0,0,0),body,code(5),primary)
        brush('Long precision brush',(-27,0,12),h-12,ivory,code(1),primary,18)
        brush('Angled precision brush',(27,5,12),h-27,body,code(2),primary,23)
        box('Washable detail sleeve',(30,20,40),(30,0,80),textile,code(4),primary,4)
        box('Dividing fin',(3,d-7,45),(0,0,28),ivory,code(5),primary,1)
    objects=[o for o in bpy.data.objects if o.type=='MESH']
    main=[o for o in objects if o.parent==primary]
    lo,hi=bounds(main);extent=hi-lo
    primary.scale=Vector([proposal['envelope'][i]*MM/extent[i] for i in range(3)])
    primary.location=Vector([-((lo.x+hi.x)/2)*primary.scale.x,-((lo.y+hi.y)/2)*primary.scale.y,-lo.z*primary.scale.z])
    bpy.context.view_layer.update();lo,hi=bounds(main)
    measured=[round(v/MM,2) for v in hi-lo]
    assert all(abs(measured[i]-proposal['envelope'][i])<.1 for i in range(3))
    # Export only the product objects, without studio cameras, lights or floor.
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects+[primary]+aux:o.select_set(True)
    bpy.context.view_layer.objects.active=primary
    bpy.ops.export_scene.gltf(filepath=str(out/f'{ident}.glb'),export_format='GLB',use_selection=True,export_extras=True,export_apply=True)
    floor=studio(objects);scene=bpy.context.scene
    scene['Design status']=data['stage'];scene['Source concept']=ident
    bpy.ops.wm.save_as_mainfile(filepath=str(out/f'{ident}.blend'),compress=True)
    scene.render.filepath=str(out/f'{ident}.jpg');bpy.ops.render.render(write_still=True)
    # Exact primary front view supports the dimension sheet; accessories are hidden.
    for o in objects:
        if o not in main:o.hide_render=True
    cam=camera_for(main,front=True);scene.render.filepath=str(out/f'{ident}-front.jpg');bpy.ops.render.render(write_still=True)
    image=base64.b64encode((out/f'{ident}-front.jpg').read_bytes()).decode()
    lo,hi=bounds(main);projected=[world_to_camera_view(scene,cam,Vector((x,y,z))) for x in [lo.x,hi.x] for y in [lo.y,hi.y] for z in [lo.z,hi.z]]
    x0=100+min(v.x for v in projected)*1200;x1=100+max(v.x for v in projected)*1200
    y0=90+(1-max(v.y for v in projected))*900;y1=90+(1-min(v.y for v in projected))*900
    yd=min(y1+35,1030);xd=min(x1+40,1320)
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1120" viewBox="0 0 1400 1120"><rect width="1400" height="1120" fill="#f7f5ef"/><text x="55" y="55" font-family="Arial" font-size="26" fill="#153f34">{proposal['code']} · {proposal['name']} · A0</text><image x="100" y="90" width="1200" height="900" href="data:image/jpeg;base64,{image}"/><g stroke="#153f34" fill="none" stroke-width="1.5"><path d="M{x0} {y1}V{yd+9}M{x1} {y1}V{yd+9}M{x0} {yd}H{x1}M{x1} {y0}H{xd+9}M{x1} {y1}H{xd+9}M{xd} {y0}V{y1}"/></g><g font-family="Arial" font-size="23" fill="#153f34"><text x="{(x0+x1)/2}" y="{yd+28}" text-anchor="middle">{w} mm</text><text transform="translate({xd+28} {(y0+y1)/2}) rotate(-90)" text-anchor="middle">{h} mm</text><text x="55" y="1065" font-size="20">Primary assembled envelope · depth {d} mm (not shown in front view)</text><text x="55" y="1100" font-size="16">Dimension references only · not to scale · internal fits, sections and tolerances unresolved · not a manufacturing drawing</text></g></svg>'''
    (out/f'{ident}-dimensions.svg').write_text(svg)
    (out/f'{ident}-geometry.json').write_text(json.dumps({'id':ident,'revision':'A0','blenderVersion':bpy.app.version_string,'primaryDimensionsMm':measured,'envelopeDefinition':'Primary assembled product, not the separate accessories or studio floor','partCodes':sorted(set(o.get('partCode') for o in objects)),'status':data['stage']},indent=2)+'\n')
    print('COMPLETE '+ident+' '+json.dumps(measured),flush=True)
print('ALL REQUESTED CONCEPTS COMPLETE',flush=True)
