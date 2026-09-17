import * as T from 'three';
// Split connected geometry islands; only tire-shaped islands near the floor qualify.
export function wheelPivots(root){
 root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(root),width=bounds.max.x-bounds.min.x,pivots=[],meshes=[];root.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material))meshes.push(o);});
 for(const mesh of meshes){const original=mesh.geometry,g=original.index?original.toNonIndexed():original.clone(),p=g.attributes.position,n=p.count,parent=Array.from({length:n},(_,i)=>i),keys=new Map();
  const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};const join=(a,b)=>parent[find(a)]=find(b);
  for(let i=0;i<n;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*100000)).join(',');if(keys.has(key))join(i,keys.get(key));else keys.set(key,i);if(i%3)join(i,i-i%3);}
  const islands=new Map();for(let i=0;i<n;i++){const key=find(i);if(!islands.has(key))islands.set(key,[]);islands.get(key).push(i);}
  const selected=[],removed=new Set();
  for(const ids of islands.values()){if(ids.length<36)continue;const box=new T.Box3();for(const i of ids)box.expandByPoint(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld));const s=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());
   if(s.x>.65||s.y<.42||s.y>1.4||s.z<.42||s.z>1.4||s.y/s.z<.75||s.y/s.z>1.3||box.min.y>.32||Math.abs(c.x)<width*.3)continue;
   selected.push({ids,c,r:s.y/2});ids.forEach(i=>removed.add(i));
  }
  function subset(ids){const out=new T.BufferGeometry();for(const [name,a]of Object.entries(g.attributes)){const values=new Float32Array(ids.length*a.itemSize);ids.forEach((id,i)=>{for(let j=0;j<a.itemSize;j++)values[i*a.itemSize+j]=a.array[id*a.itemSize+j];});out.setAttribute(name,new T.BufferAttribute(values,a.itemSize,a.normalized));}return out;}
  if(selected.length){mesh.geometry=subset(Array.from({length:n},(_,i)=>i).filter(i=>!removed.has(i)));for(const item of selected){let pivot=pivots.find(w=>Math.sign(w.position.x)===Math.sign(item.c.x)&&Math.abs(w.position.x-item.c.x)<.38&&Math.hypot(w.position.y-item.c.y,w.position.z-item.c.z)<.1);if(!pivot){pivot=new T.Group();pivot.position.copy(item.c);pivot.userData.radius=item.r;pivots.push(pivot);root.add(pivot);}const geometry=subset(item.ids).applyMatrix4(mesh.matrixWorld).translate(-pivot.position.x,-pivot.position.y,-pivot.position.z),part=new T.Mesh(geometry,mesh.material);part.castShadow=part.receiveShadow=true;pivot.add(part);}}
  g.dispose();
 }
 root.wheels=pivots;return pivots;
}
export function spinWheels(car,distance){for(const wheel of car.wheels||[])wheel.rotation.x-=distance/Math.max(.2,wheel.userData.radius||.4);}
