import argparse
import json
import math
import struct
import hashlib
import shutil
from pathlib import Path
from types import MappingProxyType
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import trimesh

SCRIPT_PATH = Path(__file__).resolve()
SOURCE_DIR = SCRIPT_PATH.parent
PACKAGE_DIR = SOURCE_DIR.parent


def parse_output_directory():
    parser = argparse.ArgumentParser(
        description='Build the S7-002 R2 vertical slice into a new directory.'
    )
    parser.add_argument(
        '--output',
        required=True,
        type=Path,
        help='A non-existent directory outside the checked-in source package.',
    )
    output = parser.parse_args().output.expanduser().resolve()
    if output.exists():
        parser.error('--output must not already exist; the generator never removes files.')
    if output == PACKAGE_DIR or PACKAGE_DIR in output.parents:
        parser.error('--output must be outside the source package.')
    output.mkdir(parents=True)
    for name in ('source', 'textures', 'reference', 'previews'):
        (output / name).mkdir()
    return output


OUT = parse_output_directory()

# ---------- Helpers ----------
def sha256(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for c in iter(lambda:f.read(1024*1024), b''):
            h.update(c)
    return h.hexdigest()

def q_from_axis_angle(axis, deg):
    axis=np.array(axis,dtype=float); axis=axis/np.linalg.norm(axis)
    a=math.radians(deg)/2
    s=math.sin(a)
    return [float(axis[0]*s),float(axis[1]*s),float(axis[2]*s),float(math.cos(a))]

def quat_mul(a,b):
    ax,ay,az,aw=a; bx,by,bz,bw=b
    return [aw*bx+ax*bw+ay*bz-az*by,
            aw*by-ax*bz+ay*bw+az*bx,
            aw*bz+ax*by-ay*bx+az*bw,
            aw*bw-ax*bx-ay*by-az*bz]

def add_texture(name, base, accent=None, size=256, noise=14, vignette=0.08):
    seed = int.from_bytes(hashlib.sha256(name.encode('utf-8')).digest()[:8], 'big')
    rng=np.random.default_rng(seed)
    arr=np.zeros((size,size,3),dtype=np.float32)
    base=np.array(base,dtype=np.float32)
    arr[:]=base
    n=rng.normal(0,noise,(size,size,1))
    arr=np.clip(arr+n,0,255)
    if accent:
        yy,xx=np.mgrid[0:size,0:size]
        wave=(np.sin(xx/17.0)+np.cos(yy/23.0))*0.5+0.5
        acc=np.array(accent,dtype=np.float32)
        arr=arr*(0.92+0.06*wave[...,None]) + acc*(0.02*wave[...,None])
    yy,xx=np.mgrid[0:size,0:size]
    d=((xx-size/2)**2+(yy-size/2)**2)**0.5/(size*0.71)
    arr*=np.clip(1-vignette*d[...,None],0.86,1.0)
    img=Image.fromarray(np.uint8(np.clip(arr,0,255)),'RGB')
    path=OUT/'textures'/f'{name}.png'
    img.save(path,optimize=True)
    return path

tex_paths={
    'fur_orange': add_texture('fur_orange',(214,126,66),(242,177,107),noise=11),
    'fur_cream': add_texture('fur_cream',(244,222,186),(255,240,214),noise=7),
    'wood': add_texture('wood',(132,83,53),(177,117,71),noise=10),
    'floor': add_texture('floor',(173,138,101),(199,165,126),noise=8),
    'wall': add_texture('wall',(225,213,197),(242,232,217),noise=5),
    'rug': add_texture('rug',(167,184,170),(202,216,195),noise=7),
}

# ---------- Editable spec ----------
spec={
  'assetId':'PET-MASTER-S7-002-SLICE',
  'revision':'R2',
  'replaces':{'revision':'R1','status':'rejected','reason':'Chest prop replaced a rig joint in skin and idle channel'},
  'referenceId':'REF-001',
  'referenceSha256':'84f8dfa0c2c6b86cb4fe25efdc051c3b764fc794a2bf1b08f1f240474f107211',
  'units':'meters',
  'axis':'Y-up, +Z character front',
  'visualIntent':{
    'character':'large full-body soft stylized 3D pet; orange/cream fur; oversized expressive eyes; large tail; friendly proportions',
    'room':'small warm cozy fragment for scale/light checks; environment secondary to character',
    'forbidden':'no decorative text on chest/props; no injury/sickness visuals; no real brands'
  },
  'characterApproxHeightM':1.58,
  'animationClips':[
    {'id':'CLIP-001','name':'idle','duration':4.0,'loop':True},
    {'id':'CLIP-002','name':'blink','duration':0.24,'loop':False},
    {'id':'CLIP-003','name':'interest','duration':1.6,'loop':False},
    {'id':'CLIP-007','name':'joy','duration':1.2,'loop':False}
  ],
  'notes':'Vertical slice candidate only; not the 27 combinations, full AN-001–016 set, or finished room.'
}
with open(OUT/'source'/'finni_spec.json','w',encoding='utf-8') as f: json.dump(spec,f,ensure_ascii=False,indent=2)

# ---------- Geometry ----------
def joint_name(name):
    return name if name.startswith('Joint.') else f'Joint.{name}'


# Joint and object identifiers intentionally use different namespaces. This
# prevents a room prop from silently replacing a skeleton entry by name.
joint_defs=(
 (joint_name('RigRoot'),None,(0,0,0)),
 (joint_name('Hips'),joint_name('RigRoot'),(0,0.52,0)),
 (joint_name('Spine'),joint_name('Hips'),(0,0.22,0)),
 (joint_name('Chest'),joint_name('Spine'),(0,0.22,0)),
 (joint_name('Neck'),joint_name('Chest'),(0,0.22,0)),
 (joint_name('Head'),joint_name('Neck'),(0,0.20,0)),
 (joint_name('Ear.L'),joint_name('Head'),(-0.15,0.25,-0.01)),
 (joint_name('Ear.R'),joint_name('Head'),(0.15,0.25,-0.01)),
 (joint_name('Arm.L'),joint_name('Chest'),(-0.30,0.00,0.00)),
 (joint_name('Arm.R'),joint_name('Chest'),(0.30,0.00,0.00)),
 (joint_name('Leg.L'),joint_name('Hips'),(-0.15,-0.28,0.00)),
 (joint_name('Leg.R'),joint_name('Hips'),(0.15,-0.28,0.00)),
 (joint_name('Tail.Base'),joint_name('Hips'),(0.27,0.02,-0.12)),
 (joint_name('Tail.Mid'),joint_name('Tail.Base'),(0.26,0.18,-0.04)),
 (joint_name('Tail.Tip'),joint_name('Tail.Mid'),(0.20,0.22,0.05)),
)
JOINT_INDEX_BY_NAME=MappingProxyType({n:i for i,(n,_,_) in enumerate(joint_defs)})
# world translations
world_t={}
for n,p,t in joint_defs:
    if p is None: world_t[n]=np.array(t,dtype=float)
    else: world_t[n]=world_t[p]+np.array(t,dtype=float)

# primitive material indices later
parts=[]
def make_ico(name, center, scale, mat, joint, subdiv=2):
    m=trimesh.creation.icosphere(subdivisions=subdiv,radius=1.0)
    T=np.eye(4); T[:3,:3]=np.diag(scale); T[:3,3]=center
    m.apply_transform(T)
    m.remove_unreferenced_vertices()
    parts.append((name,m,mat,joint_name(joint),'sphere'))

def make_cone(name, center, scale, mat, joint, rotate_z=0):
    m=trimesh.creation.cone(radius=1.0,height=2.0,sections=4)
    # cone axis +Z by trimesh. Rotate to +Y and optionally around Z
    R=trimesh.transformations.rotation_matrix(math.radians(-90),(1,0,0))
    if rotate_z:
        R=trimesh.transformations.rotation_matrix(math.radians(rotate_z),(0,1,0))@R
    S=np.eye(4); S[:3,:3]=np.diag(scale)
    T=np.eye(4); T[:3,3]=center
    m.apply_transform(T@R@S)
    parts.append((name,m,mat,joint_name(joint),'box'))

# main body world positions
make_ico('Body',(0,0.82,0),(0.31,0.39,0.24),'fur_orange','Spine',3)
make_ico('Belly',(0,0.80,0.205),(0.20,0.25,0.035),'fur_cream','Spine',2)
make_ico('HeadFur',(0,1.31,0),(0.29,0.27,0.24),'fur_orange','Head',3)
make_ico('Cheek.L',(-0.22,1.25,0.10),(0.10,0.10,0.10),'fur_orange','Head',2)
make_ico('Cheek.R',(0.22,1.25,0.10),(0.10,0.10,0.10),'fur_orange','Head',2)
# ears
make_cone('EarFur.L',world_t[joint_name('Ear.L')]+(0,0.02,0),(0.14,0.21,0.10),'fur_orange','Ear.L',rotate_z=-7)
make_cone('EarFur.R',world_t[joint_name('Ear.R')]+(0,0.02,0),(0.14,0.21,0.10),'fur_orange','Ear.R',rotate_z=7)
make_cone('EarInner.L',world_t[joint_name('Ear.L')]+(0.0,0.015,0.055),(0.075,0.12,0.022),'fur_cream','Ear.L',rotate_z=-7)
make_cone('EarInner.R',world_t[joint_name('Ear.R')]+(0.0,0.015,0.055),(0.075,0.12,0.022),'fur_cream','Ear.R',rotate_z=7)
# arms legs
make_ico('Arm.L',(-0.31,0.79,0.03),(0.11,0.25,0.11),'fur_orange','Arm.L',2)
make_ico('Arm.R',(0.31,0.79,0.03),(0.11,0.25,0.11),'fur_orange','Arm.R',2)
make_ico('Paw.L',(-0.31,0.58,0.08),(0.11,0.10,0.10),'fur_cream','Arm.L',2)
make_ico('Paw.R',(0.31,0.58,0.08),(0.11,0.10,0.10),'fur_cream','Arm.R',2)
make_ico('Leg.L',(-0.15,0.32,0),(0.14,0.25,0.14),'fur_orange','Leg.L',2)
make_ico('Leg.R',(0.15,0.32,0),(0.14,0.25,0.14),'fur_orange','Leg.R',2)
make_ico('Foot.L',(-0.16,0.10,0.10),(0.16,0.10,0.20),'fur_cream','Leg.L',2)
make_ico('Foot.R',(0.16,0.10,0.10),(0.16,0.10,0.20),'fur_cream','Leg.R',2)
# tail segments
make_ico('Tail.Base',(0.36,0.60,-0.10),(0.18,0.25,0.16),'fur_orange','Tail.Base',2)
make_ico('Tail.Mid',(0.54,0.80,-0.08),(0.18,0.27,0.17),'fur_orange','Tail.Mid',2)
make_ico('Tail.Tip',(0.61,1.00,0.01),(0.16,0.23,0.15),'fur_cream','Tail.Tip',2)

# local rigid face/environment mesh factory
rigid_meshes=[]
def unit_ico(subdiv=2): return trimesh.creation.icosphere(subdivisions=subdiv,radius=1.0)
def unit_box(extents=(1,1,1)): return trimesh.creation.box(extents=extents)
def unit_cylinder(radius=1,height=1,sections=16): return trimesh.creation.cylinder(radius=radius,height=height,sections=sections)

def add_rigid(name, mesh, material, parent, translation=(0,0,0), scale=(1,1,1), rotation=None, extras=None):
    if parent is not None and not parent.startswith('object:'):
        parent=joint_name(parent)
    rigid_meshes.append({'name':name,'mesh':mesh,'material':material,'parent':parent,'translation':translation,'scale':scale,'rotation':rotation or [0,0,0,1],'extras':extras or {}})

# face children of Head
add_rigid('Muzzle',unit_ico(2),'fur_cream','Head',(0,-0.08,0.215),(0.18,0.10,0.06))
add_rigid('Eye.L',unit_ico(2),'eye','Head',(-0.105,0.02,0.218),(0.073,0.095,0.045),extras={'blinkTarget':True})
add_rigid('Eye.R',unit_ico(2),'eye','Head',(0.105,0.02,0.218),(0.073,0.095,0.045),extras={'blinkTarget':True})
add_rigid('Highlight.L',unit_ico(1),'white','object:Eye.L',(-0.018,0.025,0.042),(0.018,0.020,0.010))
add_rigid('Highlight.R',unit_ico(1),'white','object:Eye.R',(-0.018,0.025,0.042),(0.018,0.020,0.010))
add_rigid('Nose',unit_ico(2),'nose','Head',(0,-0.115,0.275),(0.055,0.035,0.038))
# subtle brows
add_rigid('Brow.L',unit_ico(1),'fur_cream','Head',(-0.105,0.115,0.225),(0.085,0.018,0.018),rotation=q_from_axis_angle((0,0,1),8))
add_rigid('Brow.R',unit_ico(1),'fur_cream','Head',(0.105,0.115,0.225),(0.085,0.018,0.018),rotation=q_from_axis_angle((0,0,1),-8))

# room objects root-level
add_rigid('Room.Floor',unit_box(),'floor',None,(0,-0.06,-0.25),(4.2,0.10,3.6),extras={'assetId':'ROOM-SLICE-FLOOR'})
add_rigid('Room.BackWall',unit_box(),'wall',None,(0,1.4,-1.95),(4.2,2.9,0.10),extras={'assetId':'ROOM-SLICE-WALL'})
add_rigid('Room.SideWall',unit_box(),'wall',None,(-2.05,1.4,-0.25),(0.10,2.9,3.6),extras={'assetId':'ROOM-SLICE-WALL'})
add_rigid('Room.Rug',unit_box(),'rug',None,(0,0.005,0.12),(1.9,0.02,1.2),extras={'assetId':'ROOM-SLICE-RUG'})
# chest separate object + lid
add_rigid('Chest',unit_box(),'wood',None,(-1.10,0.24,-0.60),(0.78,0.38,0.48),extras={'assetId':'OBJ-CHEST','separateObject':True})
add_rigid('Chest.Lid',unit_cylinder(radius=0.5,height=1.0,sections=20),'wood','object:Chest',(0,0.52,0),(1.0,0.42,1.0),rotation=q_from_axis_angle((1,0,0),90),extras={'pivot':'rear-hinge'})
add_rigid('Chest.Band',unit_box(),'metal','object:Chest',(0,0.06,0.505),(0.12,0.50,0.035))

# ---------- glTF builder ----------
COMPONENT={'float32':5126,'uint16':5123,'uint32':5125,'uint8':5121}
TYPE_COMPONENTS={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
class GltfBuilder:
    def __init__(self, external_images=False):
        self.data=bytearray(); self.bufferViews=[]; self.accessors=[]; self.meshes=[]; self.nodes=[]; self.materials=[]; self.images=[]; self.textures=[]; self.samplers=[]; self.external_images=external_images
    def align(self,n=4):
        while len(self.data)%n: self.data.append(0)
    def add_bytes(self,b,target=None):
        self.align(4); off=len(self.data); self.data.extend(b)
        bv={'buffer':0,'byteOffset':off,'byteLength':len(b)}
        if target: bv['target']=target
        self.bufferViews.append(bv); return len(self.bufferViews)-1
    def add_array(self,arr,typ,target=None,normalized=False,minmax=False):
        arr=np.asarray(arr)
        # enforce little-endian compatible
        if arr.dtype==np.float64: arr=arr.astype(np.float32)
        if arr.dtype==np.int64: arr=arr.astype(np.uint32)
        arr=np.ascontiguousarray(arr)
        bv=self.add_bytes(arr.tobytes(),target)
        comp=COMPONENT[str(arr.dtype)]
        acc={'bufferView':bv,'componentType':comp,'count':int(arr.shape[0]),'type':typ}
        if normalized: acc['normalized']=True
        if minmax and typ in ('SCALAR','VEC2','VEC3','VEC4'):
            resh=arr.reshape(arr.shape[0],-1)
            acc['min']=[float(x) for x in resh.min(axis=0)]
            acc['max']=[float(x) for x in resh.max(axis=0)]
        self.accessors.append(acc); return len(self.accessors)-1
    def add_material(self,name,baseFactor,roughness=0.7,metallic=0.0,texture_path=None):
        pbr={'baseColorFactor':baseFactor,'metallicFactor':metallic,'roughnessFactor':roughness}
        if texture_path is not None:
            if not self.samplers:
                self.samplers.append({'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497})
            if self.external_images:
                self.images.append({'uri':f'textures/{Path(texture_path).name}','name':Path(texture_path).stem})
            else:
                img_bytes=Path(texture_path).read_bytes(); bv=self.add_bytes(img_bytes)
                self.images.append({'bufferView':bv,'mimeType':'image/png','name':Path(texture_path).stem})
            img_i=len(self.images)-1
            self.textures.append({'sampler':0,'source':img_i,'name':Path(texture_path).stem})
            pbr['baseColorTexture']={'index':len(self.textures)-1}
        self.materials.append({'name':name,'pbrMetallicRoughness':pbr})
        return len(self.materials)-1
    def mesh_from_trimesh(self,name,m,mat_index,joint_index=None,shape_kind='box',skin_attrs=False):
        verts=np.asarray(m.vertices,dtype=np.float32)
        norms=np.asarray(m.vertex_normals,dtype=np.float32)
        faces=np.asarray(m.faces,dtype=np.uint32).reshape(-1)
        # UV: spherical-ish or planar normalized bbox
        c=verts.mean(axis=0); rel=verts-c
        if shape_kind=='sphere':
            rr=np.linalg.norm(rel,axis=1)+1e-9
            u=0.5+np.arctan2(rel[:,2],rel[:,0])/(2*np.pi)
            v=0.5-np.arcsin(np.clip(rel[:,1]/rr,-1,1))/np.pi
            uv=np.stack([u,v],axis=1).astype(np.float32)
        else:
            mn=verts.min(axis=0); mx=verts.max(axis=0); d=np.maximum(mx-mn,1e-6)
            uv=np.stack([(verts[:,0]-mn[0])/d[0],(verts[:,2]-mn[2])/d[2]],axis=1).astype(np.float32)
        attrs={
            'POSITION':self.add_array(verts,'VEC3',34962,minmax=True),
            'NORMAL':self.add_array(norms,'VEC3',34962),
            'TEXCOORD_0':self.add_array(uv,'VEC2',34962)
        }
        if skin_attrs:
            joints=np.zeros((len(verts),4),dtype=np.uint16); joints[:,0]=joint_index
            weights=np.zeros((len(verts),4),dtype=np.float32); weights[:,0]=1.0
            attrs['JOINTS_0']=self.add_array(joints,'VEC4',34962)
            attrs['WEIGHTS_0']=self.add_array(weights,'VEC4',34962)
        ind=self.add_array(faces.astype(np.uint32).reshape(-1,1),'SCALAR',34963)
        prim={'attributes':attrs,'indices':ind,'material':mat_index,'mode':4}
        self.meshes.append({'name':name,'primitives':[prim]})
        return len(self.meshes)-1


def build_asset(external_images=False):
    b=GltfBuilder(external_images=external_images)
    mats={}
    mats['fur_orange']=b.add_material('Fur Orange',[1,1,1,1],0.88,0.0,tex_paths['fur_orange'])
    mats['fur_cream']=b.add_material('Fur Cream',[1,1,1,1],0.90,0.0,tex_paths['fur_cream'])
    mats['eye']=b.add_material('Eyes',[0.10,0.055,0.035,1],0.20,0.0,None)
    mats['white']=b.add_material('Eye Highlight',[1,0.98,0.95,1],0.18,0.0,None)
    mats['nose']=b.add_material('Nose',[0.08,0.045,0.035,1],0.35,0.0,None)
    mats['wood']=b.add_material('Warm Wood',[1,1,1,1],0.70,0.0,tex_paths['wood'])
    mats['floor']=b.add_material('Floor',[1,1,1,1],0.88,0.0,tex_paths['floor'])
    mats['wall']=b.add_material('Wall',[1,1,1,1],0.92,0.0,tex_paths['wall'])
    mats['rug']=b.add_material('Rug',[1,1,1,1],0.96,0.0,tex_paths['rug'])
    mats['metal']=b.add_material('Chest Band',[0.22,0.20,0.18,1],0.45,0.55,None)

    # Skeleton and rigid-object maps are built separately, then frozen.  Do
    # not merge them: R1 accidentally let the `Chest` prop overwrite the
    # skeleton joint with the same name.
    joint_node_indices={}
    for n,p,t in joint_defs:
        node={'name':n,'translation':[float(x) for x in t],'extras':{'isJoint':True}}
        b.nodes.append(node); joint_node_indices[n]=len(b.nodes)-1
    joint_node_index=MappingProxyType(joint_node_indices)
    # assign hierarchy
    for n,p,t in joint_defs:
        if p is not None:
            b.nodes[joint_node_index[p]].setdefault('children',[]).append(joint_node_index[n])
    # skinned primitives each mesh node shares one skin
    skinned_node_indices=[]
    for name,m,mat,joint,kind in parts:
        mi=b.mesh_from_trimesh(name,m,mats[mat],joint_index=JOINT_INDEX_BY_NAME[joint],shape_kind=kind,skin_attrs=True)
        nd={'name':name,'mesh':mi,'skin':0,'extras':{'boundJoint':joint}}
        b.nodes.append(nd); skinned_node_indices.append(len(b.nodes)-1)
    # rigid meshes
    rigid_node_indices={}
    for rm in rigid_meshes:
        mi=b.mesh_from_trimesh(rm['name'],rm['mesh'],mats[rm['material']],shape_kind='sphere' if 'ico' in str(type(rm['mesh'])).lower() else 'box',skin_attrs=False)
        nd={'name':rm['name'],'mesh':mi,'translation':[float(x) for x in rm['translation']], 'scale':[float(x) for x in rm['scale']], 'rotation':[float(x) for x in rm['rotation']]}
        if rm['extras']: nd['extras']=rm['extras']
        b.nodes.append(nd); idx=len(b.nodes)-1; rigid_node_indices[rm['name']]=idx
    object_node_index=MappingProxyType(rigid_node_indices)
    for rm in rigid_meshes:
        idx=object_node_index[rm['name']]
        par=rm['parent']
        if par is not None:
            if par.startswith('object:'):
                parent_index=object_node_index[par.removeprefix('object:')]
            else:
                parent_index=joint_node_index[par]
            b.nodes[parent_index].setdefault('children',[]).append(idx)
    # camera
    cam_index=0
    cameras=[{'name':'DiagnosticCamera','type':'perspective','perspective':{'yfov':0.72,'znear':0.05,'zfar':50.0}}]
    cam_node={'name':'DiagnosticCamera','camera':0,'translation':[2.6,1.55,4.0],'rotation':q_from_axis_angle((0,1,0),34)}
    b.nodes.append(cam_node); camera_node_idx=len(b.nodes)-1
    # lights extension
    lights=[
      {'name':'WarmKey','type':'point','color':[1.0,0.82,0.66],'intensity':210.0,'range':7.0},
      {'name':'SoftFill','type':'directional','color':[0.82,0.90,1.0],'intensity':1.4}
    ]
    key={'name':'WarmKey','translation':[1.6,2.6,2.0],'extensions':{'KHR_lights_punctual':{'light':0}}}
    fill={'name':'SoftFill','rotation':q_from_axis_angle((1,0,0),-45),'extensions':{'KHR_lights_punctual':{'light':1}}}
    b.nodes.append(key); key_idx=len(b.nodes)-1
    b.nodes.append(fill); fill_idx=len(b.nodes)-1

    # inverse bind matrices for 15 joints
    invs=[]
    for n,p,t in joint_defs:
        M=np.eye(4,dtype=np.float32); M[:3,3]=world_t[n]
        inv=np.linalg.inv(M).astype(np.float32)
        invs.append(inv.T.reshape(-1)) # column major
    inv_acc=b.add_array(np.array(invs,dtype=np.float32),'MAT4')
    skins=[{'name':'FinniRig','joints':[joint_node_index[n] for n,_,_ in joint_defs], 'skeleton':joint_node_index[joint_name('RigRoot')],'inverseBindMatrices':inv_acc}]

    # Animations helper
    animations=[]
    def resolve_animation_target(target_name):
        joint_target=joint_name(target_name)
        if joint_target in joint_node_index:
            return joint_node_index[joint_target]
        if target_name in object_node_index:
            target=object_node_index[target_name]
            if b.nodes[target].get('extras',{}).get('blinkTarget') is True:
                return target
        raise AssertionError(f'Animation target must be a Joint.* node or a blink target: {target_name}')

    def add_anim(name, channels_def, extras=None):
        samplers=[]; chans=[]
        for target_name,path,times,values,interp in channels_def:
            tin=b.add_array(np.asarray(times,dtype=np.float32).reshape(-1,1),'SCALAR',minmax=True)
            typ='VEC4' if path=='rotation' else 'VEC3'
            tout=b.add_array(np.asarray(values,dtype=np.float32),typ)
            samplers.append({'input':tin,'output':tout,'interpolation':interp})
            chans.append({'sampler':len(samplers)-1,'target':{'node':resolve_animation_target(target_name),'path':path}})
        a={'name':name,'samplers':samplers,'channels':chans}
        if extras:a['extras']=extras
        animations.append(a)

    add_anim('idle',[
      ('Hips','translation',[0,1,2,3,4],[[0,0.52,0],[0,0.532,0],[0,0.52,0],[0,0.532,0],[0,0.52,0]],'LINEAR'),
      ('Chest','rotation',[0,1,2,3,4],[q_from_axis_angle((0,0,1),0),q_from_axis_angle((0,0,1),1.8),q_from_axis_angle((0,0,1),0),q_from_axis_angle((0,0,1),-1.8),q_from_axis_angle((0,0,1),0)],'LINEAR'),
      ('Tail.Base','rotation',[0,1,2,3,4],[q_from_axis_angle((0,1,0),-8),q_from_axis_angle((0,1,0),9),q_from_axis_angle((0,1,0),-6),q_from_axis_angle((0,1,0),8),q_from_axis_angle((0,1,0),-8)],'LINEAR'),
      ('Tail.Mid','rotation',[0,1,2,3,4],[q_from_axis_angle((0,1,0),7),q_from_axis_angle((0,1,0),-8),q_from_axis_angle((0,1,0),7),q_from_axis_angle((0,1,0),-7),q_from_axis_angle((0,1,0),7)],'LINEAR'),
      ('Head','rotation',[0,2,4],[q_from_axis_angle((1,0,0),0),q_from_axis_angle((1,0,0),2.0),q_from_axis_angle((1,0,0),0)],'LINEAR')
    ],{'clipId':'CLIP-001','loop':True,'duration':4.0,'reducedMotionFallback':'rest-pose'})
    add_anim('blink',[
      ('Eye.L','scale',[0,0.08,0.16,0.24],[[0.073,0.095,0.045],[0.073,0.014,0.045],[0.073,0.014,0.045],[0.073,0.095,0.045]],'LINEAR'),
      ('Eye.R','scale',[0,0.08,0.16,0.24],[[0.073,0.095,0.045],[0.073,0.014,0.045],[0.073,0.014,0.045],[0.073,0.095,0.045]],'LINEAR')
    ],{'clipId':'CLIP-002','loop':False,'duration':0.24,'reducedMotionFallback':'no-op'})
    add_anim('interest',[
      ('Head','rotation',[0,0.55,1.15,1.6],[q_from_axis_angle((0,0,1),0),q_from_axis_angle((0,0,1),13),q_from_axis_angle((0,0,1),13),q_from_axis_angle((0,0,1),0)],'LINEAR'),
      ('Ear.L','rotation',[0,0.55,1.15,1.6],[q_from_axis_angle((0,0,1),0),q_from_axis_angle((0,0,1),-9),q_from_axis_angle((0,0,1),-9),q_from_axis_angle((0,0,1),0)],'LINEAR'),
      ('Ear.R','rotation',[0,0.55,1.15,1.6],[q_from_axis_angle((0,0,1),0),q_from_axis_angle((0,0,1),7),q_from_axis_angle((0,0,1),7),q_from_axis_angle((0,0,1),0)],'LINEAR'),
      ('Tail.Tip','rotation',[0,0.55,1.15,1.6],[q_from_axis_angle((1,0,0),0),q_from_axis_angle((1,0,0),10),q_from_axis_angle((1,0,0),-5),q_from_axis_angle((1,0,0),0)],'LINEAR')
    ],{'clipId':'CLIP-003','loop':False,'duration':1.6,'labelRu':'интерес / любопытство','reducedMotionFallback':'head-pose-6deg'})
    add_anim('joy',[
      ('Hips','translation',[0,0.28,0.58,0.9,1.2],[[0,0.52,0],[0,0.60,0],[0,0.54,0],[0,0.59,0],[0,0.52,0]],'LINEAR'),
      ('Arm.L','rotation',[0,0.35,0.75,1.2],[q_from_axis_angle((0,0,1),0),q_from_axis_angle((0,0,1),-42),q_from_axis_angle((0,0,1),-30),q_from_axis_angle((0,0,1),0)],'LINEAR'),
      ('Arm.R','rotation',[0,0.35,0.75,1.2],[q_from_axis_angle((0,0,1),0),q_from_axis_angle((0,0,1),42),q_from_axis_angle((0,0,1),30),q_from_axis_angle((0,0,1),0)],'LINEAR'),
      ('Tail.Base','rotation',[0,0.2,0.4,0.6,0.8,1.0,1.2],[q_from_axis_angle((0,1,0),-5),q_from_axis_angle((0,1,0),18),q_from_axis_angle((0,1,0),-18),q_from_axis_angle((0,1,0),18),q_from_axis_angle((0,1,0),-18),q_from_axis_angle((0,1,0),12),q_from_axis_angle((0,1,0),-5)],'LINEAR'),
      ('Head','rotation',[0,0.4,0.8,1.2],[q_from_axis_angle((1,0,0),0),q_from_axis_angle((1,0,0),-7),q_from_axis_angle((1,0,0),4),q_from_axis_angle((1,0,0),0)],'LINEAR')
    ],{'clipId':'CLIP-007','loop':False,'duration':1.2,'labelRu':'радость','reducedMotionFallback':'brief-smile-pose'})

    # scene roots include rig root, all skinned mesh nodes and room root-level rigid nodes, camera/lights
    child_set=set()
    for nd in b.nodes:
        child_set.update(nd.get('children',[]))
    roots=[i for i in range(len(b.nodes)) if i not in child_set]
    gltf={
      'asset':{'version':'2.0','generator':'Finni S7-002 procedural vertical-slice builder','extras':{'purpose':'minimal artistic vertical slice; not production-final'}},
      'scene':0,
      'scenes':[{'name':'FinniVerticalSlice','nodes':roots}],
      'nodes':b.nodes,'meshes':b.meshes,'materials':b.materials,
      'buffers':[{'byteLength':len(b.data)}],
      'bufferViews':b.bufferViews,'accessors':b.accessors,
      'skins':skins,'animations':animations,'cameras':cameras,
      'extensionsUsed':['KHR_lights_punctual'],
      'extensions':{'KHR_lights_punctual':{'lights':lights}},
      'extras':{'referenceId':'REF-001','referenceSha256':spec['referenceSha256'],'revision':'R2','units':'m','characterApproxHeightM':1.58,'roomFragment':True,'chestSeparateObject':True}
    }
    if b.images: gltf['images']=b.images
    if b.textures: gltf['textures']=b.textures
    if b.samplers: gltf['samplers']=b.samplers

    skin_joints=set(skins[0]['joints'])
    if len(skins[0]['joints']) != 15 or len(skin_joints) != 15:
        raise AssertionError('FinniRig must contain 15 unique joint nodes.')
    if not all(b.nodes[index].get('extras',{}).get('isJoint') is True for index in skin_joints):
        raise AssertionError('Every FinniRig joint must have extras.isJoint=true.')
    chest_prop_index=object_node_index['Chest']
    animation_targets={channel['target']['node'] for animation in animations for channel in animation['channels']}
    if chest_prop_index in animation_targets:
        raise AssertionError('The Chest prop must never be an animation target.')
    for target in animation_targets:
        extras=b.nodes[target].get('extras',{})
        if target not in skin_joints and extras.get('blinkTarget') is not True:
            raise AssertionError('Only joints and explicit blink targets may be animated.')
    return gltf,bytes(b.data)

# external glTF
jg,bin_data=build_asset(external_images=True)
jg['buffers'][0]['uri']='Finni_S7-002.bin'
with open(OUT/'Finni_S7-002.gltf','w',encoding='utf-8') as f: json.dump(jg,f,ensure_ascii=False,separators=(',',':'))
(OUT/'Finni_S7-002.bin').write_bytes(bin_data)
# embedded GLB
jg2,bin2=build_asset(external_images=False)
json_bytes=json.dumps(jg2,ensure_ascii=False,separators=(',',':')).encode('utf-8')
while len(json_bytes)%4: json_bytes+=b' '
bin_chunk=bin2
while len(bin_chunk)%4: bin_chunk+=b'\x00'
total=12+8+len(json_bytes)+8+len(bin_chunk)
header=struct.pack('<4sII',b'glTF',2,total)
chunk_json=struct.pack('<I4s',len(json_bytes),b'JSON')+json_bytes
chunk_bin=struct.pack('<I4s',len(bin_chunk),b'BIN\x00')+bin_chunk
(OUT/'Finni_S7-002.glb').write_bytes(header+chunk_json+chunk_bin)

# Copy builder as source and requirements
shutil.copy2(SCRIPT_PATH,OUT/'source'/'build_finni_vertical_slice.py')
shutil.copy2(SOURCE_DIR/'requirements.txt',OUT/'source'/'requirements.txt')

# Reference marker (not bundling missing approved image)
(OUT/'reference'/'REF-001.sha256.txt').write_text(spec['referenceSha256']+'  finni-home-approved.png\n',encoding='utf-8')
(OUT/'reference'/'README.md').write_text('''# REF-001\n\nУтверждённый `REF-001` **не копируется в этот пакет**, потому что исходный PNG не был доступен как отдельный файл в текущей рабочей среде.\n\nОжидаемый файл: `finni-home-approved.png`  \nSHA-256: `84f8dfa0c2c6b86cb4fe25efdc051c3b764fc794a2bf1b08f1f240474f107211`\n\nVertical slice собран по зафиксированным визуальным инвариантам REF-001: полнофигурный крупный рыже-кремовый Финни, большие выразительные глаза, крупный хвост, мягкий стилизованный 3D, тёплый свет, окружение вторично. Перед присвоением статуса production model обязателен side-by-side review с оригинальным REF-001.\n''',encoding='utf-8')

# Documentation
readme='''# S7-002 — минимальный художественный vertical slice Финни\n\nСтатус: **ART/INTEGRATION CANDIDATE**, не production-final. Пакет подготовлен ровно для разблокировки проверки S7-002 и не подменяет полный Sprint 8.\n\n## Что внутри\n\n- `Finni_S7-002.glb` — самодостаточный glTF 2.0 binary с rig/skin, материалами, встроенными текстурами, 4 анимационными клипами, фрагментом комнаты и отдельным сундуком.\n- `Finni_S7-002.gltf` + `Finni_S7-002.bin` + `textures/` — редактируемая/разворачиваемая версия для DCC и ручной проверки структуры.\n- `source/finni_spec.json` — параметры vertical slice и связь с REF-001.\n- `source/build_finni_vertical_slice.py` — воспроизводимый процедурный исходник.\n- `RIGHTS_AND_PROVENANCE.md` — происхождение и права.\n- `RESPONSIBILITIES.md` — роли приёмки.\n- `ANIMATION_CLIPS.md` — состав минимальных анимаций.\n- `INTEGRATION_NOTES.md` — узлы, единицы и ожидаемая проверка.\n\n## Состав slice\n\n### Финни\nПолнофигурный один вариант: рыже-кремовый мягко-стилизованный персонаж с большими глазами и крупным хвостом. Масштаб: 1 unit = 1 метр, общая высота около 1.58 м.\n\nRig/skin: `FinniRig`, 15 joints. Лицевые детали (`Eye.L`, `Eye.R`, `Muzzle`, `Nose`) находятся в иерархии головы; моргание реализовано трансформацией глаз.\n\n### Анимации\n- `idle` / `CLIP-001` — 4.0 с, loop;\n- `blink` / `CLIP-002` — 0.24 с;\n- `interest` / `CLIP-003` — 1.6 с;\n- `joy` / `CLIP-007` — 1.2 с.\n\n### Комната\nМинимальный угол комнаты: пол, две стены, ковёр, диагностические camera/light nodes. Это не законченный интерьер.\n\n### Сундук\n`Chest` — отдельный root-level object; `Chest.Lid` — дочерний объект с заданным pivot metadata. Декоративного текста на сундуке нет.\n\n## Что намеренно не входит\n\n27 сочетаний внешности, три полноценные стадии роста, полный AN-001–016, законченная комната, финальный grooming/fur shader, production retopology, Android runtime/perf evidence.\n\n## Важное ограничение\n\nИсходный PNG `REF-001` в текущей среде не был доступен отдельным файлом. Поэтому этот пакет — **reference-directed candidate**, а не доказательство identity-preserving совпадения. Side-by-side с оригинальным `REF-001` остаётся обязательным gate перед production-статусом.\n'''
(OUT/'README.md').write_text(readme,encoding='utf-8')

(OUT/'ANIMATION_CLIPS.md').write_text('''# Минимальные анимации\n\n| Clip | Asset ID | Длительность | Loop | Что проверять | Reduced motion |\n|---|---|---:|---|---|---|\n| `idle` | CLIP-001 | 4.0 с | да | дыхание/качание корпуса, спокойное движение хвоста, без ухода из silhouette-safe zone | rest pose |\n| `blink` | CLIP-002 | 0.24 с | нет | синхронное короткое моргание обоих глаз | no-op |\n| `interest` | CLIP-003 | 1.6 с | нет | наклон головы, лёгкая реакция ушей/хвоста; читается как интерес/любопытство | небольшой статический наклон |\n| `joy` | CLIP-007 | 1.2 с | нет | короткий прыжок, лапы вверх, хвост; без агрессивной амплитуды | краткая радостная поза |\n\nВсе клипы находятся в одном GLB как отдельные `animations[].name`.\n''',encoding='utf-8')

(OUT/'INTEGRATION_NOTES.md').write_text('''# Интеграционные заметки\n\n## Coordinate/scale\n- glTF 2.0, Y-up; фронт персонажа направлен в +Z.\n- 1 unit = 1 m.\n- Финни ≈ 1.58 m по максимальному габариту.\n\n## Ключевые имена\n- Rig: `FinniRig`\n- Root joint: `RigRoot`\n- Head: `Head`\n- Eyes: `Eye.L`, `Eye.R`\n- Tail: `Tail.Base`, `Tail.Mid`, `Tail.Tip`\n- Chest: `Chest` (отдельный root-level node), lid: `Chest.Lid`\n- Room fragment: `Room.Floor`, `Room.BackWall`, `Room.SideWall`, `Room.Rug`\n\n## Анимации\n`idle`, `blink`, `interest`, `joy`. Перед импортом в runtime не объединять их в один timeline.\n\n## Diagnostic review\n1. Проверить валидный import GLB и наличие `skin`/joints.\n2. Проверить, что все 4 animation clips перечисляются отдельно.\n3. На rest pose и крайних кадрах `joy`/`interest` Финни должен оставаться полнофигурным и не терять уши/лап/хвост.\n4. Сундук должен оставаться самостоятельным selectable object.\n5. Проверить материалы/текстуры без сети.\n6. Сравнить силуэт, пропорции, цветовую схему, глаза и хвост с оригиналом `REF-001`.\n\n## Не считать PASS без\n- side-by-side с оригинальным REF-001;\n- проверки Android renderer;\n- clean debug/signed release;\n- назначения конкретного 3D-owner.\n''',encoding='utf-8')

(OUT/'RIGHTS_AND_PROVENANCE.md').write_text('''# Права и происхождение материалов\n\nВ пакет **не включены сторонние модели, текстуры, шрифты, изображения или звуки**. Геометрия и текстуры созданы специально для этого vertical slice процедурным скриптом в рамках текущей работы.\n\n| Файл/группа | Автор / источник | Лицензия / правовой статус | Конкурс | Публичный APK | Атрибуция |\n|---|---|---|---|---|---|\n| `Finni_S7-002.glb/.gltf/.bin` | создано специально для проекта процедурной генерацией по утверждённому visual direction | сторонняя asset-лицензия отсутствует; использование результата — по применимым условиям OpenAI и правилам конкурса | предназначено для использования | предназначено для включения после внутренней правовой/организационной проверки | сторонняя атрибуция не требуется |\n| `textures/*.png` | собственная процедурная генерация, без внешних текстур | то же | да | да, после внутренней проверки | не требуется |\n| `source/*` | исходный процедурный код/спецификация текущей поставки | внутренний исходник проекта | да | код в APK не обязателен | не требуется |\n| `REF-001` | утверждённый референс проекта; **сам файл не включён** | права на оригинал должны подтверждаться отдельно его владельцем/источником | по ранее согласованным условиям | по ранее согласованным условиям | по условиям оригинала |\n\n## Для manifest/evidence\nРекомендуемая формулировка: `no third-party art assets embedded in S7-002 vertical slice; REF-001 is external review reference and is not redistributed in this package`.\n\nЭто техническая ведомость происхождения, а не юридическое заключение. Финальную оценку прав на `REF-001` и правила использования AI-generated/project-generated outputs должна подтвердить команда.\n''',encoding='utf-8')

(OUT/'RESPONSIBILITIES.md').write_text('''# Ответственные за приёмку\n\nДля разблокировки S7-002 достаточно двух ролей:\n\n- **Утверждение внешнего вида Финни:** владелец продукта / автор утверждённого `REF-001` — **[ВПИШИТЕ ФИО]**.\n- **3D-исходники и исправления:** дизайнер или 3D-художник, который принимает замечания по модели/rig/материалам и выпускает следующую ревизию — **[ВПИШИТЕ ФИО]**.\n\nТехническая интеграция, hash/manifest, diagnostic scene и release evidence остаются на стороне принимающего разработчика согласно запросу S7-002.\n\n> Я намеренно не подставлял вымышленное имя 3D-художника. Если отдельного специалиста пока нет, статус следует фиксировать как `3D owner: TBD`, а текущую модель — как vertical-slice candidate, не production model.\n''',encoding='utf-8')

(OUT/'S7-002_HANDOFF.md').write_text('''# Текст передачи материалов для S7-002\n\nПередаём минимальный художественный vertical slice для разблокировки S7-002.\n\nГотово:\n- один полнофигурный вариант Финни;\n- редактируемый glTF-исходник + self-contained GLB + процедурный source;\n- rig/skin, материалы и локальные текстуры;\n- `idle`, `blink`, `interest`, `joy`;\n- минимальный фрагмент комнаты;\n- `Chest` отдельным объектом;\n- ведомость происхождения/прав;\n- имена ролей приёмки — требуется вписать 2 ФИО в `RESPONSIBILITIES.md`.\n\nНе заявляем как готовое: 27 сочетаний, полный AN-001–016, законченный интерьер, production grooming/retopology и identity-preserving соответствие без side-by-side с оригиналом REF-001.\n''',encoding='utf-8')

# R2 provenance is repeated in the generated package so it cannot be lost when
# the output directory is handed to a reviewer without this source checkout.
r2_note='''

## R2 structural correction

Revision **R2** replaces rejected R1. R1 allowed the room prop `Chest` to overwrite a `FinniRig` joint and to become the `idle` rotation target. R2 namespaces every rig node as `Joint.*`, freezes separate joint/object maps, and asserts that every skin joint has `extras.isJoint=true` while prop `Chest` is not an animation target. This remains an ART/INTEGRATION CANDIDATE, not an identity/art PASS.
'''
for document in ('README.md','ANIMATION_CLIPS.md','INTEGRATION_NOTES.md','S7-002_HANDOFF.md'):
    with (OUT/document).open('a',encoding='utf-8') as handoff_document:
        handoff_document.write(r2_note)

# Build a simple preview image from approximate projected shapes (not evidence)
W,H=1100,800
im=Image.new('RGB',(W,H),(238,229,214)); d=ImageDraw.Draw(im)
# room
d.rectangle([0,510,W,H],fill=(178,146,111)); d.rectangle([0,0,W,510],fill=(228,217,201)); d.rectangle([0,590,W,720],fill=(170,188,171))
# chest
d.rounded_rectangle([90,420,320,590],radius=22,fill=(132,83,53),outline=(92,58,40),width=6); d.arc([90,355,320,505],180,360,fill=(132,83,53),width=70)
# character 2D proxy centered
cx=650
# tail
d.ellipse([760,335,970,640],fill=(214,126,66)); d.ellipse([800,260,975,480],fill=(244,222,186))
# body/legs
d.ellipse([520,300,790,665],fill=(214,126,66)); d.ellipse([578,390,735,610],fill=(244,222,186))
d.ellipse([540,590,640,735],fill=(214,126,66)); d.ellipse([670,590,770,735],fill=(214,126,66)); d.ellipse([520,690,655,755],fill=(244,222,186)); d.ellipse([655,690,790,755],fill=(244,222,186))
# arms
d.ellipse([475,365,575,610],fill=(214,126,66)); d.ellipse([735,365,835,610],fill=(214,126,66))
# head and ears
d.polygon([(545,260),(585,80),(645,255)],fill=(214,126,66)); d.polygon([(710,255),(770,80),(810,260)],fill=(214,126,66))
d.ellipse([500,130,840,445],fill=(214,126,66)); d.ellipse([584,295,755,405],fill=(244,222,186))
# eyes
for ex in (600,735):
    d.ellipse([ex-43,220,ex+43,330],fill=(44,25,17)); d.ellipse([ex-18,235,ex+6,266],fill=(255,250,245))
d.ellipse([650,330,705,370],fill=(44,25,17))
# subtle caption
d.text((36,28),'S7-002 vertical slice — preview only / not REF-001 evidence',fill=(73,64,57))
im.save(OUT/'previews'/'Finni_S7-002_preview.png')

# hashes manifest
entries=[]
for p in sorted(OUT.rglob('*')):
    if p.is_file() and p.name!='SHA256SUMS.txt':
        entries.append((str(p.relative_to(OUT)).replace('\\','/'),sha256(p),p.stat().st_size))
with open(OUT/'SHA256SUMS.txt','w',encoding='utf-8') as f:
    for rel,h,s in entries:f.write(f'{h}  {rel}\n')
manifest={
 'package':'Finni_S7-002_vertical_slice','revision':'R2','status':'art_integration_candidate','reference':{'id':'REF-001','sha256':spec['referenceSha256'],'bundled':False},
 'replaces':{'revision':'R1','status':'rejected','reason':'Chest prop replaced a FinniRig joint and idle animation target'},
 'build':{'python':'3.12.14','numpy':'2.5.3','Pillow':'12.3.0','trimesh':'4.12.2','textureSeed':'sha256(name)[:8]'},
 'rig':{'name':'FinniRig','jointNamespace':'Joint.*','jointCount':15,'objectMapSeparate':True,'chestPropAnimationTarget':False},
 'primaryAsset':'Finni_S7-002.glb','editableAsset':'Finni_S7-002.gltf','source':'source/build_finni_vertical_slice.py','animations':['idle','blink','interest','joy'],
 'roomFragment':True,'chestSeparateObject':True,'thirdPartyAssetsEmbedded':False,
 'files':[{'path':r,'sha256':h,'bytes':s} for r,h,s in entries]
}
with open(OUT/'slice-manifest.json','w',encoding='utf-8') as f:json.dump(manifest,f,ensure_ascii=False,indent=2)
# refresh hashes to include manifest itself? keep SHA separate and also hash manifest at end
with open(OUT/'SHA256SUMS.txt','a',encoding='utf-8') as f:
    f.write(f'{sha256(OUT/"slice-manifest.json")}  slice-manifest.json\n')

print('OUT',OUT)
print('GLB', (OUT/'Finni_S7-002.glb').stat().st_size)
print('GLTF', (OUT/'Finni_S7-002.gltf').stat().st_size)
print('FILES',len([p for p in OUT.rglob('*') if p.is_file()]))
