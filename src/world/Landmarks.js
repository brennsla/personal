import * as THREE from 'three';

// Recognizable, simplified landmarks; placements are fictional race scenery.
export function addLandmarks(environment){
 const {group,track}=environment,concrete=new THREE.MeshStandardMaterial({color:0xe5ded0,roughness:.8}),red=new THREE.MeshStandardMaterial({color:0xb92d23,roughness:.6}),glass=new THREE.MeshStandardMaterial({color:0x496570,metalness:.4,roughness:.24}),dark=new THREE.MeshStandardMaterial({color:0x424c51,roughness:.8});
 const reservations=[];environment.landmarkLots=reservations;
 const samples=Array.from({length:2000},(_,i)=>track.curve.getPointAt(i/2000));
 function box(g,x,y,z,w,h,d,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 function place(name,t,radius,build){
  const f=track.frame(t);let pos;
  for(const offset of [radius+22,radius+48,radius+80,radius+120]){for(const side of [1,-1]){const p=f.p.clone().addScaledVector(f.n,side*offset);if(samples.every(q=>q.distanceTo(p)>radius+track.width/2+8)&&reservations.every(q=>q.position.distanceTo(p)>q.radius+radius+5)){pos=p;break;}}if(pos)break;}
  if(!pos)throw new Error(`No clear landmark site for ${name}`);
  const g=new THREE.Group();g.name=name;g.position.copy(pos);g.rotation.y=Math.atan2(f.tan.x,f.tan.z);build(g);group.add(g);reservations.push({name,position:pos,radius});
 }
 place('MASP',.08,36,g=>{
  box(g,0,.15,0,62,.3,30,concrete);
  for(const x of [-24,24])for(const z of [-9,9])box(g,x,10,z,2.2,20,2.2,red);
  for(const z of [-9,9])box(g,0,20,z,51,2.4,2.2,red);
  box(g,0,13,0,46,8,17,glass);box(g,0,8.8,0,47,.7,18,concrete);
  for(let x=-22;x<=22;x+=2.75)for(const z of [-8.55,8.55])box(g,x,13,z,.1,7.5,.12,dark);
 });
 place('Obelisco do Ibirapuera',.27,19,g=>{
  box(g,0,.4,0,25,.8,25,concrete);box(g,0,1.4,0,12,1.2,12,concrete);
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(1.4,2.8,40,4),concrete);shaft.position.y=22;shaft.rotation.y=Math.PI/4;shaft.castShadow=true;g.add(shaft);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(1.98,7,4),concrete);tip.position.y=45.5;tip.rotation.y=Math.PI/4;g.add(tip);
 });
 place('Oca',.43,27,g=>{
  const dome=new THREE.Mesh(new THREE.SphereGeometry(23,40,16,0,Math.PI*2,0,Math.PI/2),concrete);dome.scale.y=.42;dome.castShadow=dome.receiveShadow=true;g.add(dome);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,p=new THREE.Mesh(new THREE.CircleGeometry(.65,12),dark);p.position.set(Math.sin(a)*22.55,1.7,Math.cos(a)*22.55);p.rotation.y=a;g.add(p);}
 });
 place('Ponte Estaiada',.73,77,g=>{
  for(const s of [-1,1]){const leg=box(g,0,30,s*2,3,65,3,concrete);leg.rotation.z=s*.32;const deck=box(g,0,9,s*8,140,1.6,7,dark);deck.rotation.y=s*.12;}
  const cable=new THREE.LineBasicMaterial({color:0xd2d0c5});for(const side of [-1,1])for(const z of [-8,8])for(let i=1;i<=12;i++){const x=side*(9+i*4.8);g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,58,0),new THREE.Vector3(x,10,z)]),cable));}
 });
 return reservations;
}
