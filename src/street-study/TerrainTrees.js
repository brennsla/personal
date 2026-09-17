import * as T from 'three';
import {STUDY_SIZE,STUDY_STEP} from './TerrainNeighborhoods.js';
const random=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export function planTerrainTrees(plan,streets,lots,existing=[]){
 const plots=[...plan.plots,...lots],trees=[],bins=new Map(),size=12;
 function safe(x,z,r){
  if(plan.distance(x,z)<9+r+4||plots.some(p=>Math.hypot(x-p.x,z-p.z)<p.r+r+1))return false;
  const ix=Math.floor((x-streets.origin)/streets.step),iz=Math.floor((z-streets.origin)/streets.step);
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const id=(iz+dz)*streets.n+ix+dx;if(!streets.roads.has(id))continue;const p=streets.point(id);if(Math.hypot(Math.max(0,Math.abs(x-p.x)-streets.step/2),Math.max(0,Math.abs(z-p.z)-streets.step/2))<r+1)return false;}
  if(existing.some(p=>Math.hypot(x-p.x,z-p.z)<r+3))return false;
  const bx=Math.floor(x/size),bz=Math.floor(z/size);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if((bins.get((bx+dx)+','+(bz+dz))||[]).some(t=>Math.hypot(x-t.x,z-t.z)<(r+t.r)*.85))return false;
  return true;
 }
 let index=0;for(let z=-780;z<=780;z+=11)for(let x=-780;x<=780;x+=11){const seed=index++,px=x+(random(seed)-.5)*9,pz=z+(random(seed+900)-.5)*9,r=2.1+random(seed+1700)*1.7;
  // Uneven groves, with denser pockets rather than rows of identical trees.
  if(random(seed+3600)<.12+.12*(Math.sin(x/95)*Math.cos(z/110)+1)||!safe(px,pz,r))continue;
  const tree={x:px,z:pz,r,h:4.7+random(seed+2800)*5.5,kind:Math.floor(random(seed+4300)*4),seed};trees.push(tree);const key=Math.floor(px/size)+','+Math.floor(pz/size);if(!bins.has(key))bins.set(key,[]);bins.get(key).push(tree);
 }
 return trees;
}
// Match the preview's rendered ground triangles, including between sample points.
export function treeGround(field,x,z){const origin=-STUDY_SIZE/2,s=STUDY_STEP,ix=Math.floor((x-origin)/s),iz=Math.floor((z-origin)/s),a=origin+ix*s,b=origin+iz*s,u=(x-a)/s,v=(z-b)/s;
 const h00=field.height(a,b),h10=field.height(a+s,b),h01=field.height(a,b+s),h11=field.height(a+s,b+s);return u+v<=1?h00+(h10-h00)*u+(h01-h00)*v:h11+(h01-h11)*(1-u)+(h10-h11)*(1-v);}
export function terrainTrees(plan,streets,lots,field,existing){
 const trees=planTerrainTrees(plan,streets,lots,existing),group=new T.Group();group.name='Terrain study gap-filling groves';const trunk=new T.CylinderGeometry(.12,.2,1,6),crown=new T.IcosahedronGeometry(1,1),bark=new T.MeshStandardMaterial({color:'#786952',roughness:1}),leaf=new T.MeshStandardMaterial({color:'white',roughness:1}),batches=new Map(),palette=['#679378','#8aaa78','#4f8275','#be88ae'];
 function add(tree,g,m,x,y,z,sx,sy,sz,color){const key=(g===trunk?'bark':'leaf')+':'+Math.floor(tree.x/160)+','+Math.floor(tree.z/160);if(!batches.has(key))batches.set(key,{g,m,items:[]});batches.get(key).items.push({tree,x,y,z,sx,sy,sz,color});}
 for(const tree of trees){const {x,z,r,h,kind}=tree;add(tree,trunk,bark,x,h*.48,z,1,h*.96,1,null);
  if(kind===2){add(tree,crown,leaf,x,h*.77,z,r*.62,h*.43,r*.62,palette[2]);}
  else for(let j=0;j<3;j++){const a=j*2.4+tree.seed;add(tree,crown,leaf,x+Math.cos(a)*r*.22,h*(.76+j*.08),z+Math.sin(a)*r*.22,r*.74,kind===1?r*.48:r*.77,r*.74,palette[kind]);}
 }
 const records=[];for(const {g,m,items}of batches.values()){const mesh=new T.InstancedMesh(g,m,items.length);mesh.castShadow=g===trunk;mesh.receiveShadow=true;items.forEach((item,i)=>{if(item.color)mesh.setColorAt(i,new T.Color(item.color));});group.add(mesh);records.push({mesh,items});}
 const matrix=new T.Matrix4(),quat=new T.Quaternion();
 return {group,trees,update(amount){for(const {mesh,items}of records){items.forEach((p,i)=>{matrix.compose(new T.Vector3(p.x,p.y+treeGround(field,p.tree.x,p.tree.z)*amount-.1,p.z),quat,new T.Vector3(p.sx,p.sy,p.sz));mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}}};
}
