import * as T from 'three';

export function windowLights(group){
 const seen=new Set();let count=0;
 group.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){
  if(seen.has(m)||!m.emissive)continue;seen.add(m);
  if(m.map?.image&&m.map.image.width===192&&m.map.image.height===384){
   // Match the authored facade UV atlas: only individual window cells emit.
   const c=document.createElement('canvas');c.width=192;c.height=384;const q=c.getContext('2d');q.fillStyle='#000';q.fillRect(0,0,192,384);
   for(let y=24,row=0;y<370;y+=30,row++)for(let x=12,col=0;x<184;x+=30,col++){if((row*17+col*7)%5<2)continue;q.fillStyle=(row+col)%3?'#ffd49a':'#b6d5ec';q.fillRect(x+1,y+1,16,15);}
   const mask=new T.CanvasTexture(c);mask.colorSpace=T.SRGBColorSpace;mask.wrapS=m.map.wrapS;mask.wrapT=m.map.wrapT;mask.repeat.copy(m.map.repeat);m.emissiveMap=mask;m.emissive.set(0xffffff);m.emissiveIntensity=1.8;count++;
  }
 }});return count;
}

export function worldLife(scene,track,id){
 if(scene.userData.environmentFactory)return {update(dt){scene.userData.illustratedUpdate?.(dt);}};
 const group=new T.Group();scene.add(group);const walkers=[],clouds=[];
 const c=document.createElement('canvas');c.width=256;c.height=128;const q=c.getContext('2d');
 for(let i=0;i<22;i++){const x=38+(i*43)%180,y=48+(i*19)%34,r=20+(i%5)*5,g=q.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,255,255,.24)');g.addColorStop(1,'rgba(255,255,255,0)');q.fillStyle=g;q.fillRect(0,0,256,128);}
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
 for(let i=0;i<22;i++){const cloud=new T.Sprite(new T.SpriteMaterial({map:texture,color:id==='city-night'?0x748299:0xf3eee5,transparent:true,opacity:.72,depthWrite:false,fog:false}));cloud.position.set(Math.sin(i*2.4)*1100,300+(i%5)*65,Math.cos(i*2.4)*1100);cloud.scale.set(300+(i%4)*75,100+(i%3)*25,1);group.add(cloud);clouds.push(cloud);}
 if(id!=='desert')for(let i=0;i<60;i++){
  const t=i/60,f=track.frame(t),side=i%2?1:-1,a=f.p.clone().addScaledVector(f.n,side*19),b=a.clone().addScaledVector(f.tan,7);
  let safe=true;for(let j=0;j<900;j++){const p=track.curve.getPointAt(j/900);for(const end of [a,b])if(p.distanceTo(end)<track.width/2+6)safe=false;}if(!safe)continue;
  const person=new T.Group(),limbs=[];const cloth=new T.MeshStandardMaterial({color:[0x668390,0xae7455,0x8e9476,0xc3b6a0][i%4],roughness:.9}),pants=new T.MeshStandardMaterial({color:0x344049}),skin=new T.MeshStandardMaterial({color:[0xb77c59,0xe0ae84,0x74513d][i%3]});
  const body=new T.Mesh(new T.CapsuleGeometry(.19,.4,3,6),cloth);body.position.y=1.12;person.add(body);const head=new T.Mesh(new T.SphereGeometry(.145,8,6),skin);head.position.y=1.63;person.add(head);
  for(const s of [-1,1])for(const arm of [false,true]){const pivot=new T.Group();pivot.position.set(s*(arm?.27:.12),arm?1.37:.85,0);const limb=new T.Mesh(new T.CapsuleGeometry(arm?.065:.085,arm?.38:.55,3,6),arm?cloth:pants);limb.position.y=arm?-.23:-.34;pivot.add(limb);person.add(pivot);limbs.push({pivot,phase:s*(arm?-1:1)});}
  person.traverse(o=>{if(o.isMesh)o.castShadow=true;});group.add(person);walkers.push({person,a,b,limbs,phase:i*.9});
 }
 let time=0;return {walkers,clouds,update(dt){time+=dt;for(const cloud of clouds){cloud.position.x+=dt*1.2;if(cloud.position.x>1400)cloud.position.x=-1400;}for(const w of walkers){const f=(time*.12+w.phase)%2,u=f<1?f:2-f;w.person.position.lerpVectors(w.a,w.b,u);w.person.rotation.y=Math.atan2(w.b.x-w.a.x,w.b.z-w.a.z)+(f<1?0:Math.PI);for(const limb of w.limbs)limb.pivot.rotation.x=Math.sin(time*7+w.phase)*.45*limb.phase;}}};
}
