import * as T from 'three';
import maps from '../assets/environment/maps.js';
export function realMaterials(environment){
 if(environment.illustrated)return;
 const loader=new T.TextureLoader(),cache=new Map();
 function material(id){if(cache.has(id))return cache.get(id);const textures={};for(const [kind,url]of Object.entries(maps[id])){const t=loader.load(url);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;t.colorSpace=kind==='Color'?T.SRGBColorSpace:T.NoColorSpace;textures[kind]=t;}const m=new T.MeshStandardMaterial({map:textures.Color,normalMap:textures.NormalGL,roughnessMap:textures.Roughness,roughness:1,normalScale:new T.Vector2(.5,.5)});cache.set(id,m);return m;}
 environment.group.updateMatrixWorld(true);
 environment.group.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material)||!o.geometry.attributes.uv)return;
  const p=o.geometry.parameters||{},isGround=o.geometry.type==='CircleGeometry'&&p.radius>500||o.geometry.type==='PlaneGeometry'&&p.width===6500;
  const concrete=o.material.bumpMap&&o.material.color?.getHex()===0xe7ddc9;
  if(!concrete&&!isGround)return;
  // Only vegetated city ground; leave desert and beach sand untouched.
  if(isGround&&environment.theme)return;
  o.geometry=o.geometry.clone();const uv=o.geometry.attributes.uv,pos=o.geometry.attributes.position;
  for(let i=0;i<uv.count;i++){if(isGround)uv.setXY(i,pos.getX(i)/2.1,pos.getY(i)/2.1);else uv.setXY(i,uv.getX(i)*20,uv.getY(i)*20);}
  o.material=material(isGround?'Ground037':'Concrete034');
 });return cache;
}
