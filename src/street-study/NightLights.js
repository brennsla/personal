import * as T from 'three';
const random=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export function windowState(building,window){if(random(building+19)<.32)return 0;const r=random(window+building*37);return r<.54?0:r<.88?1:2;}
export function randomWindowLights(scene,plots=[]){
 const candidates=[],glass=new T.Color('#718b95'),stats=[0,0,0];scene.traverse(o=>{if(o.isInstancedMesh&&!Array.isArray(o.material)&&o.material.color?.equals(glass))candidates.push(o);});scene.updateMatrixWorld(true);
 const matrix=new T.Matrix4(),position=new T.Vector3();
 for(const mesh of candidates){const groups=[[],[],[]];for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix).applyMatrix4(mesh.matrixWorld);let building=0,best=Infinity;for(let j=0;j<plots.length;j++){const p=plots[j],d=(p.x-position.x)**2+(p.z-position.z)**2;if(d<best){best=d;building=j;}}const seed=Math.round(position.x*11+position.y*71+position.z*23),state=windowState(building,seed);groups[state].push(matrix.clone());stats[state]++;}
  const original=mesh.material;mesh.count=0;
  for(let k=0;k<3;k++){if(!groups[k].length)continue;const material=original.clone();material.onBeforeCompile=original.onBeforeCompile;material.customProgramCacheKey=original.customProgramCacheKey;material.emissive.set(k===1?'#efbf77':k===2?'#accbd6':'#000000');material.emissiveIntensity=k?.6:0;material.color.set(k?'#718b95':'#263743');const batch=new T.InstancedMesh(mesh.geometry,material,groups[k].length);groups[k].forEach((m,i)=>batch.setMatrixAt(i,m));batch.name=['Unlit windows','Warm occupied windows','Cool occupied windows'][k];batch.castShadow=false;batch.receiveShadow=true;batch.computeBoundingSphere();mesh.add(batch);}
 }
 return stats;
}
export function vehicleNightLights(car,illuminateRoad=false){
 const group=new T.Group();group.name='Night vehicle lights';const length=(car.userData.hitbox?.length||4.5)/.97,width=(car.userData.hitbox?.width||1.9)/.94;
 const geometry=new T.BoxGeometry(1,1,1),front=new T.MeshBasicMaterial({color:'#fff0c9',toneMapped:false}),rear=new T.MeshBasicMaterial({color:'#bb211b',toneMapped:false});
 for(const side of [-1,1]){
  for(const back of [false,true]){const bulb=new T.Mesh(geometry,back?rear:front);bulb.position.set(side*width*.37,back?.96:.78,(back?1:-1)*(length/2+.012));
   car.updateWorldMatrix(true,true);const origin=car.localToWorld(new T.Vector3(bulb.position.x,bulb.position.y,(back?1:-1)*(length+2))),direction=new T.Vector3(0,0,back?-1:1).transformDirection(car.matrixWorld),hit=new T.Raycaster(origin,direction).intersectObject(car,true).find(h=>h.object.isMesh);
   if(hit){bulb.position.copy(car.worldToLocal(hit.point.clone()));bulb.position.z+=(back?1:-1)*.015;}
   bulb.scale.set(back?.23:.34,back?.075:.12,.014);group.add(bulb);}
  if(illuminateRoad){const light=new T.SpotLight('#ffe9c2',24,55,.36,.65,1.4);light.position.set(side*width*.36,.8,-length/2);light.target.position.set(side*1.7,.05,-28);light.castShadow=false;group.add(light,light.target);}
 }
 car.add(group);return group;
}
export function streetLampLights(scene){
 const positions=[],matrix=new T.Matrix4();scene.updateMatrixWorld(true);scene.traverse(o=>{if(o.isInstancedMesh&&o.material.userData.streetLamp){o.material.emissive.set('#ffe2a5');o.material.emissiveIntensity=1.3;for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);positions.push(new T.Vector3().setFromMatrixPosition(matrix).applyMatrix4(o.matrixWorld));}}});
 const data=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);data.set([255,221,153,Math.round(Math.max(0,1-r)**2*80)],i);}const texture=new T.DataTexture(data,32,32);texture.needsUpdate=true;
 const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,blending:T.AdditiveBlending}),pools=new T.InstancedMesh(new T.PlaneGeometry(12,12).rotateX(-Math.PI/2),material,positions.length);positions.forEach((p,i)=>pools.setMatrixAt(i,new T.Matrix4().makeTranslation(p.x,.15,p.z)));pools.name='Streetlamp light pools';pools.computeBoundingSphere();scene.add(pools);
 const lights=Array.from({length:4},()=>{const l=new T.PointLight('#ffe0ac',14,17,1.6);scene.add(l);return l;});
 return {update(player){const nearest=positions.map(p=>({p,d:p.distanceToSquared(player)})).sort((a,b)=>a.d-b.d);lights.forEach((l,i)=>{l.visible=!!nearest[i]&&nearest[i].d<3600;if(l.visible)l.position.copy(nearest[i].p).add(new T.Vector3(0,-.2,0));});}};
}
