import * as T from 'three';
export const STUDY_SIZE=1650,STUDY_SEGMENTS=275,STUDY_STEP=STUDY_SIZE/STUDY_SEGMENTS;
export function planStudyStreets(plan){
 const n=STUDY_SEGMENTS,step=STUDY_STEP,half=step/2,origin=-STUDY_SIZE/2,cache=new Map(),roads=new Set();
 const point=id=>({x:origin+(id%n+.5)*step,z:origin+(Math.floor(id/n)+.5)*step});
 const buckets=new Map();for(const p of plan.plots)for(let x=Math.floor((p.x-p.r-10)/60);x<=Math.floor((p.x+p.r+10)/60);x++)for(let z=Math.floor((p.z-p.r-10)/60);z<=Math.floor((p.z+p.r+10)/60);z++){const k=x+','+z;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(p);}
 function clear(id){if(id<0||id>=n*n)return false;if(cache.has(id))return cache.get(id);const q=point(id);const valid=!(buckets.get(Math.floor(q.x/60)+','+Math.floor(q.z/60))||[]).some(p=>{const c=Math.cos(p.yaw),s=Math.sin(p.yaw),dx=q.x-p.x,dz=q.z-p.z,pad=half*(Math.abs(c)+Math.abs(s))+.4;return Math.abs(c*dx-s*dz)<p.w/2+pad&&Math.abs(s*dx+c*dz)<p.d/2+pad;});cache.set(id,valid);return valid;}
 function nearby(x,z){const ix=Math.floor((x-origin)/step),iz=Math.floor((z-origin)/step);for(let radius=0;radius<8;radius++)for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){const id=(iz+dz)*n+ix+dx;if(clear(id))return id;}return null;}
 function route(a,b){if(a===null||b===null)return;const heuristic=id=>Math.abs(id%n-b%n)+Math.abs(Math.floor(id/n)-Math.floor(b/n)),open=[a],cost=new Map([[a,0]]),parent=new Map(),closed=new Set();let count=0;
  while(open.length&&count++<4000){open.sort((x,y)=>(cost.get(y)+heuristic(y))-(cost.get(x)+heuristic(x)));const id=open.pop();if(id===b){for(let p=b;p!==undefined;p=parent.get(p))roads.add(p);return;}if(closed.has(id))continue;closed.add(id);for(const next of [id-1,id+1,id-n,id+n]){if(Math.abs(next%n-id%n)>1||!clear(next)||closed.has(next))continue;const score=cost.get(id)+(roads.has(next)?.7:1);if(score<(cost.get(next)??Infinity)){cost.set(next,score);parent.set(next,id);open.push(next);}}}
 }
 const nodes=[];for(let z=-594;z<=546;z+=60){const row=[];for(let x=-570;x<=570;x+=60)row.push(nearby(x,z));nodes.push(row);}
 for(let z=0;z<nodes.length;z++)for(let x=0;x<nodes[z].length;x++){if(x)route(nodes[z][x-1],nodes[z][x]);if(z)route(nodes[z-1][x],nodes[z][x]);}
 // Keep the largest connected network; never display isolated scraps of pavement.
 const remaining=new Set(roads),components=[];while(remaining.size){const todo=[remaining.values().next().value],component=[];remaining.delete(todo[0]);while(todo.length){const id=todo.pop();component.push(id);for(const next of [id-1,id+1,id-n,id+n])if(Math.abs(next%n-id%n)<=1&&remaining.delete(next))todo.push(next);}components.push(component);}components.sort((a,b)=>b.length-a.length);roads.clear();for(const id of components[0]||[])roads.add(id);
 return {roads,point,clear,n,step,origin};
}
export function planStudyInfill(plan,streets){
 const lots=[],occupied=[...plan.plots],roadPoints=[...streets.roads].map(streets.point);
 const candidates=[];for(let z=-550;z<=550;z+=13)for(let x=-550;x<=550;x+=13)candidates.push({x,z,order:Math.sin(x*12.98+z*78.23)});candidates.sort((a,b)=>a.order-b.order);
 for(const {x,z}of candidates){if(lots.length>=260)break;const near=roadPoints.reduce((best,p)=>Math.hypot(x-p.x,z-p.z)<Math.hypot(x-best.x,z-best.z)?p:best,roadPoints[0]);if(!near)continue;const dist=Math.hypot(x-near.x,z-near.z);if(dist<10||dist>25)continue;
  const kind=lots.length%13===0?'construction':lots.length%5===0?'business':'townhouse',w=kind==='townhouse'?6:12,d=kind==='townhouse'?8:12,r=Math.hypot(w,d)/2;
  if(plan.distance(x,z)<9+r+8||occupied.some(p=>Math.hypot(x-p.x,z-p.z)<r+p.r+1)||roadPoints.some(p=>Math.abs(x-p.x)<w/2+4&&Math.abs(z-p.z)<d/2+4))continue;
  const lot={x,z,w,d,r,yaw:0,archetype:kind,floors:kind==='business'?5:2,near:false};lots.push(lot);occupied.push(lot);
 }
 return lots;
}
export function studyStreetMesh(streets,field){
 const vertices=[];for(const id of streets.roads){const q=streets.point(id),h=streets.step/2;for(const [dx,dz]of [[-h,-h],[-h,h],[h,-h],[-h,h],[h,h],[h,-h]])vertices.push(q.x+dx,0,q.z+dz);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));const mesh=new T.Mesh(g,new T.MeshStandardMaterial({color:'#6c787a',roughness:1}));mesh.receiveShadow=true;mesh.name='Continuous terrain-conforming street network';
 return {mesh,update(amount){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,field.height(p.getX(i),p.getZ(i))*amount-.06);p.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();}};
}
export function studyInfill(lots,field){
 const group=new T.Group(),records=[],batches=new Map(),unit=new T.BoxGeometry(1,1,1),colors=['#e9e5d9','#b4c2c0','#d3a28b','#f0ead9','#b7acbf'],mats=new Map();
 const material=color=>{if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.92}));return mats.get(color);};
 function box(p,w,h,d,x,y,z,color){const m=material(color);if(!batches.has(color))batches.set(color,{m,items:[]});batches.get(color).items.push({p,matrix:new T.Matrix4().makeScale(w,h,d).setPosition(p.x+x,y,p.z+z)});}
 for(const [i,p]of lots.entries()){
  box(p,p.w,.35,p.d,0,.1,0,'#949b95');
  if(p.archetype==='construction'){
   for(let floor=0;floor<4;floor++){const y=.5+floor*3;box(p,11,.3,11,0,y,0,'#b5b1a5');for(const x of [-4.7,0,4.7])for(const z of [-4.7,4.7])box(p,.5,3,.5,x,y+1.5,z,'#9f9b91');}
   for(const z of [-5.8,5.8]){box(p,12,1.8,.15,0,.9,z,'#809c91');for(let x=-5;x<=5;x+=2)box(p,.4,1.4,.16,x,1,z,'#dcb65d');}
   box(p,.45,20,.45,3,10,2,'#d6a94f');box(p,9,.45,.4,0,19,2,'#d6a94f');box(p,.07,8,.07,-4,15,2,'#465759');box(p,2,1.2,2,-2,.8,0,'#b08a61');
  }else{
   const h=p.archetype==='business'?15:6.6;box(p,p.w,h,p.d,0,h/2,0,colors[i%colors.length]);box(p,p.w+.2,.35,p.d+.2,0,h+.1,0,'#889391');
   for(let y=1.7;y<h-1;y+=3)for(let x=-p.w/2+1.4;x<p.w/2;x+=2.8){box(p,1.6,1.65,.12,x,y,p.d/2+.07,'#586f78');box(p,1.9,.16,.5,x,y-.9,p.d/2+.2,'#ece5d3');box(p,.08,1.65,.2,x,y,p.d/2+.1,'#c3c8c0');}
   box(p,1.25,2.3,.18,-p.w/2+1.1,1.2,p.d/2+.1,'#5c6159');box(p,p.w*.8,.18,1,0,2.7,p.d/2+.3,'#b87762');
   box(p,.5,.6,.2,p.w/2-.7,1.4,p.d/2+.16,'#727e80');box(p,1.7,.7,1.3,0,h+.6,-2,'#819698');
   if(p.archetype==='business'){box(p,p.w*.72,.8,.18,0,3.6,p.d/2+.2,'#d6ba6a');for(let x=-3;x<4;x+=1)box(p,.12,.4,.21,x,3.6,p.d/2+.22,'#40575b');}
  }
 }
 for(const {m,items}of batches.values()){const mesh=new T.InstancedMesh(unit,m,items.length);items.forEach((item,i)=>mesh.setMatrixAt(i,item.matrix));mesh.castShadow=mesh.receiveShadow=true;mesh.name='Terrain-study infill';group.add(mesh);records.push({mesh,items});}
 return {group,update(amount){for(const {mesh,items}of records){items.forEach((item,i)=>{const matrix=item.matrix.clone();matrix.elements[13]+=field.height(item.p.x,item.p.z)*amount;mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}}};
}
