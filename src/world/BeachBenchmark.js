import * as T from 'three';
import {coastalMaterials,enrichCoast} from './CoastalMaterials.js';

// A deliberately bounded, 360 m art-direction sample along the coastal straight.
// All solids go through the environment's road-clearance check.
export function beachBenchmark(env){
 const {group}=env;
 const surfaces=coastalMaterials();enrichCoast(env,surfaces);
 env.track.group.traverse(o=>{if(o.isMesh&&o.material.map){const detail=o.material.map.clone();detail.colorSpace=T.NoColorSpace;detail.needsUpdate=true;o.material.bumpMap=detail;o.material.bumpScale=.025;o.material.roughnessMap=detail;o.material.roughness=1;}});
 const stone=surfaces.stone;
 const signMaterials=new Map();
 function sign(text,w,h,parent,x,y,z,rotation=0){
  if(!signMaterials.has(text)){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#173c43';ctx.fillRect(0,0,512,128);ctx.fillStyle='#f6e6c3';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,80);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;signMaterials.set(text,new T.MeshStandardMaterial({map:t,roughness:.8}));}
  const m=new T.Mesh(new T.PlaneGeometry(w,h),signMaterials.get(text));m.position.set(x,y,z);m.rotation.y=rotation;parent.add(m);
 }
 function person(g,x,z,i){const skin=[0xc7916d,0x855b44,0xe0b390][i%3];env.box(.42,.65,.25,x,1.1,z,[0xc67148,0x346c80,0xddd3b4][i%3],g);const head=env.mesh(new T.SphereGeometry(.15,8,6),skin,g);head.position.set(x,1.62,z);for(const s of [-1,1]){env.box(.14,.7,.16,x+s*.12,.43,z,0x354149,g);env.box(.11,.55,.13,x+s*.28,1.08,z,skin,g);}}
 for(let i=0;i<30;i++){
  const z=-240+i*12;
  env.place(439,z,7,g=>{
   g.name='benchmark-promenade';const slab=new T.Mesh(new T.BoxGeometry(10,.12,12),stone);slab.position.y=.04;slab.receiveShadow=true;g.add(slab);
   env.box(.3,.45,12,5,.225,0,0xdcd3bd,g);
   if(i%3===0){env.palm(g);env.box(2,.12,.55,-2,.55,1,0x8a6850,g);env.box(2,.5,.1,-2,.87,1.25,0x8a6850,g);for(const x of [-2.7,-1.3])env.box(.1,.5,.4,x,.25,1,0x3c484a,g);person(g,2,-2,i);person(g,2.9,-1,i+1);}
   if(i%3===1){env.box(.12,5,.12,-3,2.5,0,0x394b50,g);env.box(1.4,.12,.35,-2.5,5,0,0xe9d8a9,g);}
  });
 }
 for(let i=0;i<12;i++){
  const z=-230+i*30;
  env.place(334,z,18,g=>{
   g.name='benchmark-shop';const h=9+(i%3)*3;
   const building=env.box(22,h,24,0,h/2,0,0xffffff,g);building.material=surfaces.plaster;
   env.box(29,.16,28,2,.04,0,0xb9b4a9,g);
   for(let j=0;j<3;j++){
    const shopWindow=env.box(.1,2.8,5,11.06,1.7,-8+j*8,0x34565d,g);shopWindow.material=surfaces.glass;
    for(const dz of [-2.55,0,2.55])env.box(.28,2.95,.1,11.18,1.7,-8+j*8+dz,0xc9c5b7,g);
    env.box(2,.25,6,12,3.3,-8+j*8,[0x477d79,0xbb7759,0xcbb577][i%3],g);
    for(let floor=0;floor<(h-4)/3;floor++){
     const window=env.box(.1,1.9,3.5,11.07,5+floor*3,-8+j*8,0x4d6976,g);window.material=surfaces.glass;
     for(const dz of [-1.85,1.85])env.box(.4,2.1,.17,11.15,5+floor*3,-8+j*8+dz,0xd4d0c2,g);
     env.box(.35,.16,3.9,11.18,6+floor*3,-8+j*8,0xd4d0c2,g);
     env.box(1.4,.16,5,11.6,4+floor*3,-8+j*8,0xe4ded0,g);
     env.box(.08,.75,5,12.2,4.4+floor*3,-8+j*8,0x717c7a,g);
    }
   }
   env.box(23,.35,25,0,h,0,0xe7dfce,g);env.box(3,1.2,2,-5,h+.7,0,0x8d9695,g);
   sign(['CAFÉ DA ORLA','HOTEL COSTA AZUL','MERCADO DO MAR'][i%3],9,.8,g,11.15,3.95,0,Math.PI/2);
   person(g,13,7,i);
  });
 }
 // Track-following race furniture, on the ocean side, never on the racing surface.
 for(let i=0;i<1800;i+=4){const f=env.track.frame(i/1800);if(f.p.x<350||f.p.z< -240||f.p.z>108)continue;
  const side=f.n.x>0?1:-1,p=f.p.clone().addScaledVector(f.n,side*22);
  env.place(p.x,p.z,2,g=>{g.name='benchmark-race-barrier';g.rotation.y=Math.atan2(f.tan.x,f.tan.z);env.box(.5,.85,3.2,0,.43,0,i%8?0xe5ddd0:0x287879,g);});
 }
 // Metadata makes the quality slice discoverable to tests without depending on mesh counts.
 group.userData.beachBenchmark={startZ:-240,endZ:108,shoreX:465};
}
