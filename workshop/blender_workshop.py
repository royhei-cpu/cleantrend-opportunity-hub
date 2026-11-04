"""Homecare A0 exterior design studies. Run in Blender 5.2+.

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

def rod(name,a,b,radius,mat,code,parent):
    a,b=Vector(a),Vector(b);delta=b-a
    o=cyl(name,radius,delta.length,(a+b)/2,mat,code,parent)
    o.rotation_euler=delta.to_track_quat('Z','Y').to_euler()
    return o

def ring(name,outer,inner,height,loc,mat,code,parent):
    # Open cylindrical wall with both sides; intentionally no solid top cap.
    x,y,z=loc;verts=[];faces=[];n=48
    for r,h in [(outer,0),(outer,height),(inner,0),(inner,height)]:
        verts.extend([((x+r*math.cos(i*2*math.pi/n))*MM,(y+r*math.sin(i*2*math.pi/n))*MM,(z+h)*MM) for i in range(n)])
    for i in range(n):
        j=(i+1)%n
        faces.extend([(i,j,n+j,n+i),(2*n+j,2*n+i,3*n+i,3*n+j),(n+i,n+j,3*n+j,3*n+i),(j,i,2*n+i,2*n+j)])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
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
    elif kind=='hamper':
        body.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.85
        box('Frame base',(w,d,20),(0,0,10),ivory,code(1),primary,8)
        for x in [-w/2+12,w/2-12]:
            for y in [-d/2+12,d/2-12]:box('Frame upright',(18,18,h-25),(x,y,(h-25)/2+15),ivory,code(1),primary,6)
        for x in [-w*.24,w*.24]:
            tray('Woven removable bag',w*.44,d-32,h-75,(x,0,25),body,code(2),primary)
            for y in [-d/2+26,d/2-26]:
                for dx in [-60,60]:box('Webbing handle riser',(22,4,55),(x+dx,y,h-52),rubber,code(3),primary,1)
                box('Webbing carry bridge',(140,4,20),(x,y,h-23),rubber,code(3),primary,1)
            box('Task label',(45,3,25),(x,-d/2+12,h*.62),ivory,code(6),primary,2)
        box('Lift-off split lid',(w,d,14),(0,0,h-7),ivory,code(4),primary,8)
        box('Lid split line',(3,d-15,2),(0,0,h+.2),dark,code(4),primary,.5)
        for x in [-w/2+15,w/2-15]:
            for y in [-d/2+15,d/2-15]:box('Floor pad',(22,22,8),(x,y,4),rubber,code(5),primary,3)
    elif kind=='dryer':
        for y in [-d/2+25,d/2-25]:
            rod('Cross-frame A',(-w*.35,y,14),(w/2-12,y,h-12),8,body,code(1),primary)
            rod('Cross-frame B',(w*.35,y,14),(-w/2+12,y,h-12),8,body,code(1),primary)
            cyl('Pivot',18,20,(0,y,14+(h-26)*(w*.35)/(w*.35+w/2-12)),ivory,code(4),primary,axis='Y')
            box('Pivot guard',(45,24,45),(0,y,14+(h-26)*(w*.35)/(w*.35+w/2-12)),ivory,code(6),primary,8)
            for x in [-w*.35,w*.35]:box('Soft floor foot',(45,35,22),(x,y,11),rubber,code(5),primary,7)
        for x in [-w/2+12,w/2-12]:rod('Top end frame',(x,-d/2+8,h-12),(x,d/2-8,h-12),8,body,code(1),primary)
        for i in range(12):
            y=-d/2+25+i*(d-50)/11
            rod('Drying rail '+str(i),(-w/2+12,y,h-8),(w/2-12,y,h-8),2,metal,code(2),primary)
            for x in [-w/2+12,w/2-12]:box('Replaceable clip',(16,12,15),(x,y,h-9),ivory,code(3),primary,3)
    elif kind=='washbags':
        body.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.95
        for i,(bw,bd,loc,z) in enumerate([(w,d,(0,0),1),(320,400,(-35,-40),3.5),(220,280,(-60,-95),6)]):
            x,y=loc;box('Mesh bag '+str(i),(bw,bd,1.5),(x,y,z),body,code(i+1),primary,.3)
            for bx in [x-bw/2+3,x+bw/2-3]:box('Bound long seam',(6,bd,2),(bx,y,z),ivory,code(5),primary,.4)
            for by in [y-bd/2+3,y+bd/2-3]:box('Bound short seam',(bw,6,2),(x,by,z),ivory,code(5),primary,.4)
            box('Covered zipper',(bw-10,5,3),(x,y-bd/2+9,z+1),dark,code(4),primary,.6)
            box('Zipper tuck',(25,30,3),(x+bw/2-20,y-bd/2+18,z+1.5),ivory,code(4),primary,.6)
            box('Size tab',(25,30,2),(x-bw/2+35,y-bd/2+22,z+2),rubber,code(6),primary,.4)
    elif kind=='storage':
        tray('Storage shell',w,d,h-10,(0,0,0),body,code(1),primary)
        box('Recessed lid',(w,d,8),(0,0,h-4),ivory,code(2),primary,6)
        box('Stacking rim',(w-24,d-24,4),(0,0,h+1),ivory,code(2),primary,4)
        for x in [-w/2,w/2]:
            box('Replaceable end latch',(12,100,45),(x,0,h-30),rubber,code(3),primary,5)
            cyl('Latch hinge',4,80,(x,0,h-13),metal,code(4),primary,axis='Y')
        box('Label pocket',(100,2,60),(0,-d/2-1,h*.52),ivory,code(5),primary,2)
        box('Identification card',(88,1,48),(0,-d/2-2,h*.52),textile,code(6),primary,1)
    elif kind=='dividers':
        for i,y in enumerate([-32,0,32]):
            box('Outer divider rail',(w*.66,8,h),(w*.14,y,h/2),body,code(1),primary,4)
            box('Sliding inner rail',(w*.60,6,h-12),(-w*.17,y,h/2),ivory,code(2),primary,3)
            for x in [-w/2+7,w/2-7]:box('Soft end pad',(12,21,h),(x,y,h/2),rubber,code(3),primary,3)
            box('Release',(25,15,10),(15,y,h-5),rubber,code(4),primary,3)
            for x in [-80,-60,-40,-20,0]:box('Length scale',(1,1,12),(x,y-5,h-17),dark,code(5),primary,.2)
    elif kind=='vanity':
        tray('Open organizer base',w,d,35,(0,0,0),body,code(1),primary)
        for x in [-w*.31,-w*.015]:tray('Removable tall cup',75,90,h-12,(x,15,8),ivory,code(2),primary)
        tray('Dry item tray',76,d-14,55,(w*.32,0,8),ivory,code(3),primary)
        box('Removable drip insert',(w-18,d-18,4),(0,0,8),body,code(4),primary,2)
        for x in [-w/2+18,w/2-18]:
            for y in [-d/2+18,d/2-18]:cyl('Base pad',6,5,(x,y,2.5),rubber,code(5),primary)
        box('Task marking',(35,2,16),(w*.3,-d/2-1,22),ivory,code(6),primary,1)
    elif kind=='pantry':
        for i,(x,ch) in enumerate([(-120,155),(0,205),(120,260)]):
            tray('Container body '+str(i),110,120,ch-14,(x,0,0),body,code(1),primary)
            box('Removable seal',(108,118,3),(x,0,ch-13),rubber,code(3),primary,3)
            box('Lid shell',(114,124,10),(x,0,ch-7),ivory,code(2),primary,5)
            for y in [-64,64]:box('Lift latch',(35,6,26),(x,y,ch-20),dark,code(4),primary,3)
            box('Front label',(70,2,45),(x,-61,ch*.5),ivory,code(5),primary,2)
    elif kind=='recycler':
        tray('Station shell',w,d,h-75,(0,0,10),body,code(1),primary)
        for x in [-w*.235,w*.235]:
            tray('Lift-out bucket',w*.43,d-30,h-105,(x,0,24),ivory,code(2),primary)
            box('Independent lid',(w*.475,d-12,13),(x,0,h-40),body,code(3),primary,7)
            rod('Carry bail left',(x-70,-40,h-85),(x-70,-40,h-18),2,metal,code(4),primary)
            rod('Carry bail right',(x+70,-40,h-85),(x+70,-40,h-18),2,metal,code(4),primary)
            rod('Carry bail grip',(x-70,-40,h-18),(x+70,-40,h-18),2,metal,code(4),primary)
            box('Local stream label',(90,2,50),(x,-d/2-1,h*.62),ivory,code(6),primary,2)
        for x in [-w/2+20,w/2-20]:
            for y in [-d/2+20,d/2-20]:box('Soft foot',(30,30,14),(x,y,7),rubber,code(5),primary,4)
    elif kind=='compost':
        tray('Outer caddy',w,d,h-50,(0,0,0),body,code(1),primary)
        tray('Lift-out bucket',w-12,d-12,h-56,(0,0,5),ivory,code(2),primary)
        box('Lift-off lid',(w,d,9),(0,0,h-46),body,code(3),primary,6)
        for x in [-w/2+12,w/2-12]:rod('Wire bail upright',(x,0,h*.55),(x,0,h-3),2,metal,code(4),primary)
        rod('Wire bail grip',(-w/2+12,0,h-3),(w/2-12,0,h-3),2,metal,code(4),primary)
        box('Removable vent cartridge',(55,30,5),(0,35,h-39),dark,code(5),primary,3)
        for x in [-w/2+18,w/2-18]:
            for y in [-d/2+18,d/2-18]:cyl('Base foot',6,5,(x,y,2),rubber,code(6),primary)
    elif kind=='floorbottle':
        tray('Presentation tray',w,d,24,(0,0,0),body,code(4 if ident=='floor-dose' else 5),primary)
        bottle('Task bottle',(-w*.23,0,5),85,65,h-5,code(1),primary,cap=ident!='disinfect-pack',closurecode=code(2),labelcode=code(4 if ident=='disinfect-pack' else 6))
        if ident!='disinfect-pack':
            ring('Measured dose cup',26,23,38,(w*.25,-25,26),ivory,code(2),primary)
            box('Cloth or applicator',(85,50,16),(w*.23,25,34),textile,code(5 if ident=='floor-dose' else 4),primary,4)
    elif kind=='spongedock':
        tray('Drip tray',w,d,12,(0,0,0),ivory,code(4),primary)
        for x in [-w/2+12,w/2-12]:box('Elevated dock support',(10,d-10,35),(x,0,27),body,code(3),primary,3)
        for y in [-25,25]:
            box('Absorbent sponge',(100,36,25),(0,y,47),textile,code(1),primary,8)
            box('Scrub face',(100,36,4),(0,y,61),body,code(2),primary,3)
        for x in [-w/2+14,w/2-14]:
            for y in [-d/2+14,d/2-14]:cyl('Base pad',4,4,(x,y,2),rubber,code(5),primary)
    elif kind=='duster':
        cyl('Duster grip',15,145,(0,0,75),body,code(1),primary)
        box('Flexible carrier',(25,10,h-140),(0,0,140+(h-140)/2),ivory,code(2),primary,4)
        for z in range(170,int(h)-5,12):box('Microfiber sleeve ridge',(w-5,55,18),(0,0,z),textile,code(3),primary,8)
        box('Pull tab',(32,4,30),(35,-24,180),body,code(4),primary,2)
        box('Retaining clip',(22,15,16),(0,0,156),rubber,code(5),primary,3)
    elif kind=='toilet':
        cyl('Holder floor',w/2,7,(0,0,3.5),body,code(4),primary)
        ring('Ventilated holder',w/2,w/2-3,h*.42,(0,0,6),body,code(4),primary)
        ring('Drip cup',w*.42,w*.42-3,30,(0,0,10),ivory,code(5),primary)
        cyl('Brush core',29,55,(0,0,115),ivory,code(2),primary)
        for a in range(0,360,30):
            for z in [95,110,125,140]:
                ar=math.radians(a);rod('Brush bristle',(29*math.cos(ar),29*math.sin(ar),z),(40*math.cos(ar),40*math.sin(ar),z),1,bristle,code(3),primary)
        cyl('Handle stem',8,h-145,(0,0,145+(h-145)/2),ivory,code(1),primary)
        cyl('Broad grip',14,105,(0,0,h-52.5),body,code(1),primary)
        cyl('Carry collar',w*.37,8,(0,0,h*.45),ivory,code(1),primary)
        cyl('Service joint',9,15,(0,0,150),metal,code(6),primary)
    elif kind=='sweep':
        tray('Standing dustpan',w,d,95,(0,0,0),body,code(4),primary)
        box('Replaceable sealing lip',(w-6,12,6),(0,-d/2+3,5),rubber,code(5),primary,2)
        cyl('Pan shaft',9,h-50,(-85,70,h/2+25),metal,code(3),primary)
        cyl('Broom shaft',9,h-80,(60,25,h/2+40),metal,code(3),primary)
        box('Broom block',(210,35,35),(60,25,115),ivory,code(1),primary,6)
        for x in range(-35,160,12):box('Broom bristle tuft',(7,28,65),(x,25,67),bristle,code(2),primary,1)
        box('Storage clip',(170,28,24),(-5,50,h*.7),ivory,code(6),primary,4)
        for x in [-85,60]:cyl('Handle grip',13,90,(x,70 if x<0 else 25,h-45),body,code(3),primary)
    elif kind=='glasskit':
        tray('Dock with drip tray',w,d,30,(0,0,0),body,code(5),primary)
        box('Finishing blade carrier',(200,18,22),(0,20,h-15),ivory,code(1),primary,4)
        box('Replaceable blade',(200,4,18),(0,8,h-15),rubber,code(2),primary,1)
        box('Tool grip',(30,22,95),(0,20,70),body,code(1),primary,7)
        box('Wash pad carrier',(180,24,20),(0,-35,85),ivory,code(3),primary,4)
        box('Wash pad',(180,18,18),(0,-48,85),textile,code(4),primary,5)
        box('Folded finishing cloth',(95,65,15),(48,20,37),textile,code(4),primary,4)
    elif kind=='vacuum':
        box('Motor housing',(190,86,90),(35,0,70),body,code(1),primary,30)
        box('Dust cup',(115,80,78),(-112,0,62),ivory,code(5),primary,20)
        box('Intake nozzle',(55,42,28),(-175,0,38),body,code(7),primary,9)
        box('Service grip',(140,45,30),(55,0,120),body,code(1),primary,12)
        box('Grip stand',(28,45,55),(110,0,92),rubber,code(7),primary,8)
        box('Battery service cover',(85,62,5),(65,0,23),ivory,code(3),primary,5)
        box('Dust release',(25,25,6),(-38,0,111),rubber,code(7),primary,3)
        for x in [2,13,24,35,46,57]:box('Motor vent',(4,2,24),(x,-44,72),dark,code(1),primary,1)
        box('Control switch',(23,20,5),(60,0,137),rubber,code(4),primary,4)
        # Internal modules are represented by exterior service covers, not functional CAD.
        box('Filter access code',(30,2,15),(-95,-42,62),body,code(6),primary,2)
    elif kind=='drillkit':
        tray('Vented storage tray',w,d,24,(0,0,0),body,code(5),primary)
        for i,(x,r) in enumerate([(-80,25),(0,36),(77,47)]):
            cyl('Brush block',r,16,(x,15,45),ivory,code(1),primary)
            cyl('Hex shank exterior proxy',3.175,55,(x,15,82),metal,code(3),primary)
            for a in range(0,360,30):
                ar=math.radians(a);cyl('Brush tuft',2.5,25,(x+(r-5)*math.cos(ar),15+(r-5)*math.sin(ar),27),bristle,code(2),primary)
        box('Unpowered manual holder',(150,28,24),(0,-50,38),rubber,code(4),primary,8)
    elif kind=='odorpod':
        box('Passive pod body',(w,d,h-10),(0,0,(h-10)/2),body,code(1),primary,15)
        box('Removable cap',(w,d,8),(0,0,h-4),ivory,code(2),primary,7)
        for x in range(-50,51,12):box('Vent slot',(4,2,65),(x,-d/2-1,h*.5),dark,code(1),primary,2)
        box('Cartridge access panel',(w-20,3,h-30),(0,d/2+1,h/2),ivory,code(3),primary,6)
        cyl('Date dial',16,4,(0,0,h+1),body,code(5),primary)
        for a in range(0,360,60):
            ar=math.radians(a);box('Date index',(2,4,1),(13*math.cos(ar),13*math.sin(ar),h+3),dark,code(5),primary,.2)
    elif kind=='autokit':
        tray('Separated auto-care tray',w,d,35,(0,0,0),body,code(1),primary)
        bottle('250 mL interior-care proposal',(-75,0,6),65,48,h-6,code(2),primary,labelcode=code(6))
        brush('Manual detail brush',(40,25,15),160,body,code(4),primary,24)
        for i in range(2):box('Folded task cloth',(95,65,12),(50,-35,43+i*15),textile if i==0 else ivory,code(5),primary,4)
    elif kind=='drainkit':
        tray('Service tray',w,d,22,(0,0,0),body,code(5),primary)
        cyl('Silicone drain cover',49,6,(-45,0,30),rubber,code(1),primary)
        ring('Capture basket',25,22,35,(-45,0,28),ivory,code(2),primary)
        box('Accessible lift tab',(25,20,8),(-12,-25,39),body,code(3),primary,4)
        box('Non-sharp hair hook',(14,105,7),(72,0,35),ivory,code(4),primary,3)
        box('Hook return',(30,10,7),(63,47,35),ivory,code(4),primary,3)
    elif kind=='gloves':
        body.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.7
        for side in [-1,1]:
            x=side*80
            box('Glove palm',(86,120,8),(x,10,5),body,code(1 if side<0 else 2),primary,24)
            box('Glove long cuff',(95,105,7),(x,-93,4.5),body,code(1 if side<0 else 2),primary,18)
            for i,length in enumerate([90,106,100,78]):box('Glove finger',(17,length,8),(x-30+i*20,65+length/2,4.8),body,code(1 if side<0 else 2),primary,8)
            thumb=box('Glove thumb',(24,75,8),(x-side*46,20,4.7),body,code(1 if side<0 else 2),primary,10);thumb.rotation_euler.z=side*.5
            box('Folded cuff lining',(85,14,3),(x,-140,9),ivory,code(3),primary,2)
            box('Task / hanging tab',(20,18,4),(x+25,-145,10),rubber,code(4),primary,3)
            for i in range(5):box('Raised grip rib',(55,2,1.5),(x,-10+i*10,10),rubber,code(1 if side<0 else 2),primary,.4)
            box('Size and care marking',(16,8,1),(x,-110,9),ivory,code(5),primary,.3)
    elif kind=='deckbrush':
        box('Brush carrier',(w,d,28),(0,0,70),body,code(1),primary,8)
        box('Replaceable face',(w-8,d-8,12),(0,0,50),ivory,code(2),primary,4)
        for x in range(-110,111,15):
            for y in [-30,-15,0,15,30]:cyl('Outdoor brush tuft',3.8,43,(x,y,25),bristle,code(2),primary)
        cyl('Head service joint',18,45,(0,0,100),ivory,code(5),primary)
        cyl('Handle shaft',11,h-160,(0,0,120+(h-160)/2),metal,code(3),primary)
        cyl('Grip',16,130,(0,0,h-65),body,code(4),primary)
    else:raise ValueError('No model defined for '+kind)
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
