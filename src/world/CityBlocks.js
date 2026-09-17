import * as THREE from 'three';
import {apartmentMaterial,facadeBox} from './Architecture.js';

// Street-facing parcels share an alignment, pavement and ground-floor retail.
export function addCityBlocks(environment,facadeMaterial){
 const {track,group}=environment,curve=track.curve;
 const samples=Array.from({length:1800},(_,i)=>curve.getPointAt(i/1800));
 const distance=p=>{let best=Infinity;for(let i=0;i<samples.length;i++){const a=samples[i],b=samples[(i+1)%samples.length],dx=b.x-a.x,dz=b.z-a.z,t=THREE.MathUtils.clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz),0,1);best=Math.min(best,Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz));}return best;};
 const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.78});
 const stone=mat(0xbdb9b0),roof=mat(0x656c70),frame=mat(0xe9e4d9),glass=new THREE.MeshStandardMaterial({color:0x294955,roughness:.25,metalness:.28});
 const facades=[0xd4c5af,0xadb5b7,0xcebbab,0xe0dbcf].map(c=>apartmentMaterial(c));
 const shopNames=['PADARIA JARDINS','CAFÉ DA PRAÇA','LIVRARIA','FARMÁCIA','MERCADO LOCAL','FLORICULTURA'];
 const signMaterials=shopNames.map((name,i)=>{const c=document.createElement('canvas');c.width=512;c.height=96;const q=c.getContext('2d');q.fillStyle=['#254d43','#623d2d','#304650','#3d6655','#73483e','#4b6350'][i];q.fillRect(0,0,512,96);q.fillStyle='#f5f0e4';q.font='bold 34px sans-serif';q.textAlign='center';q.fillText(name,256,60);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map:t,roughness:.8});});
 const cube=new THREE.BoxGeometry(1,1,1),head=new THREE.SphereGeometry(1,8,6),body=new THREE.CylinderGeometry(.16,.2,.58,8);
 const skins=[0xb17b58,0x79513b,0xd2a17c].map(mat),clothes=[0x375b70,0xa45143,0xdee0cd,0x4f6852].map(mat);
 const occupied=[];let buildings=0,people=0;
 function box(parent,x,y,z,w,h,d,material){const m=new THREE.Mesh(cube,material);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function safe(p,r){return distance(p)>track.width/2+r+3;}
 // Keep a quieter green district; other sectors become connected commercial streets.
 for(let i=0;i<100;i++){
  const t=i/100;if(t>.30&&t<.39)continue;
  const f=track.frame(t);
  for(const side of[-1,1]){
   const center=f.p.clone().addScaledVector(f.n,side*(track.width/2+24));
   if(environment.landmarkLots?.some(l=>l.position.distanceTo(center)<l.radius+18))continue;
   if(!safe(center,17)||occupied.some(p=>p.distanceTo(center)<34))continue;
   occupied.push(center);const block=new THREE.Group();block.position.copy(center);block.rotation.y=Math.atan2(f.n.x*side,f.n.z*side);group.add(block);
   // Local negative Z faces the track. Three attached shops make a continuous frontage.
   box(block,0,.14,0,25,.28,21,stone);
   for(let j=0;j<3;j++){
    const x=(j-1)*8,h=10+((i+j)%5)*3.1,b=new THREE.Mesh(facadeBox(7.7,h,12),[facades[(i+j)%4],facades[(i+j)%4],roof,roof,facades[(i+j)%4],facades[(i+j)%4]]);
    b.position.set(x,h/2+.3,2);b.castShadow=b.receiveShadow=true;block.add(b);
    box(block,x,1.65,-4.08,6.7,2.7,.12,glass);
    for(const dx of[-3.4,0,3.4])box(block,x+dx,1.65,-4.2,.12,2.8,.14,frame);
    const sign=box(block,x,3.45,-4.3,7.2,.9,.15,signMaterials[(i+j)%6]);sign.rotation.y=Math.PI;
    box(block,x,2.95,-4.65,7.4,.12,1.3,roof);
    box(block,x,h+.35,2,8,.28,12.3,frame);
    // Detailed benchmark frontage at the opening part of the lap.
    if(t<.22){
     for(let y=6.3;y<h-1;y+=3.1){box(block,x,y,-4.45,7.3,.15,1.2,frame);box(block,x,y+.55,-5,7.1,.06,.06,roof);for(const dx of[-3.5,0,3.5])box(block,x+dx,y+.28,-5,.055,.55,.055,roof);}
     box(block,x,h+1.1,3,2.2,1.5,2,roof);
     box(block,x-2.8,1.45,-4.25,.95,2.25,.1,frame);box(block,x-2.8,1.45,-4.32,.75,2.05,.08,glass);
    }buildings++;
   }
   // Benches and people stay on the pavement between storefronts and race fence.
   box(block,8,.5,-7,2,.15,.5,roof);
   // Café furniture and planters fill the pavement, within the checked parcel.
   for(const x of[-7,0,7]){
    box(block,x,.7,-6,1.1,.12,1.1,frame);
    box(block,x,.36,-6,.12,.7,.12,roof);
    for(const dx of[-.9,.9]){box(block,x+dx,.45,-6,.5,.12,.5,roof);box(block,x+dx,.7,-5.75,.5,.6,.08,roof);}
    box(block,x,.5,-9,1.1,1,1,roof);box(block,x,1.1,-9,1.25,.5,1.1,clothes[3]);
   }
   for(let k=0;k<(t<.22?7:3);k++){
    const p=new THREE.Group();p.position.set(-10+k*3.2,.28,-7.3+(k%2)*.6);p.rotation.y=Math.PI+(k%3)*.35;
    const torso=new THREE.Mesh(body,clothes[(i+k)%4]);torso.position.y=1.04;p.add(torso);
    const face=new THREE.Mesh(head,skins[(i+k)%3]);face.scale.setScalar(.14);face.position.y=1.49;p.add(face);
    for(const x of[-.09,.09])box(p,x,.44,0,.12,.7,.15,roof);
    for(const x of[-.23,.23])box(p,x,1.01,0,.09,.49,.1,skins[(i+k)%3]);
    block.add(p);people++;
   }
  }
 }
 // Continuous race-edge sidewalks replace the old disconnected paving tiles.
 const spacing=3,count=Math.ceil(curve.getLength()/spacing);
 for(let i=0;i<count;i++)for(const side of[-1,1]){
  const f=track.frame(i/count),p=f.p.clone().addScaledVector(f.n,side*(track.width/2+3.6));
  if(distance(p)<track.width/2+2)continue;
  const tile=box(group,p.x,.12,p.z,3.6,.24,spacing+.1,stone);tile.rotation.y=Math.atan2(f.tan.x,f.tan.z);
  const fence=box(group,p.x-f.n.x*side*1.7,.65,p.z-f.n.z*side*1.7,.15,1.05,spacing+.1,roof);fence.rotation.y=tile.rotation.y;
 }
 environment.cityStats={blocks:occupied.length,buildings,people};
 return environment.cityStats;
}
