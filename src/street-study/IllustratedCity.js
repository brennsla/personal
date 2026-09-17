import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import assets from './city-architecture.js';
import {createPedestrian,animatePedestrian} from './Pedestrians.js';
import {LANDMARK_LOTS,drawLandmark} from './CityLandmarks.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Metres, seeded variation, and full-footprint road clearance are shared by every prop.
export function roadField(track){
 const length=track.curve.getLength(),count=Math.ceil(length/2),points=Array.from({length:count},(_,i)=>track.frame(i/count).p);
 return (x,z)=>{let best=Infinity;for(let i=0;i<count;i++){const a=points[i],b=points[(i+1)%count],dx=b.x-a.x,dz=b.z-a.z;
  const t=T.MathUtils.clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);best=Math.min(best,(x-a.x-t*dx)**2+(z-a.z-t*dz)**2);}return Math.sqrt(best);};
}
export function planCity(track){
 const distance=roadField(track),plots=[],occupied=[],length=track.curve.getLength();
 function reserve(x,z,r){if(distance(x,z)<track.width/2+r+3)return false;if(occupied.some(p=>Math.hypot(x-p.x,z-p.z)<r+p.r+.4))return false;occupied.push({x,z,r});return true;}
 for(const [kind,w,d,target]of [...LANDMARK_LOTS,['masp',82,34,.12],['mall',90,58,.37],['supermarket',52,36,.63],['park',68,48,.82],['park',56,42,.48]]){
  const r=Math.hypot(w,d)/2;let placed=false;
  for(let j=0;j<80&&!placed;j++)for(const side of [-1,1]){const f=track.frame((target+j*.003)%1),out=f.n.clone().multiplyScalar(side),p=f.p.clone().addScaledVector(out,track.width/2+r+7);if(reserve(p.x,p.z,r)){plots.push({x:p.x,z:p.z,w,d,r,yaw:Math.atan2(-out.x,-out.z),floors:2,kind:0,archetype:kind,near:true,special:true});placed=true;break;}}
 }
 // Buildings face the course. Their entire footprint, not only centre, stays outside it.
 for(let i=0;i<Math.floor(length/28);i++)for(const side of [-1,1]){const f=track.frame(i/Math.floor(length/28)),out=f.n.clone().multiplyScalar(side),w=23+i%3,d=10,r=Math.hypot(w,d)/2;
  const p=f.p.clone().addScaledVector(out,track.width/2+5+r);
  const district=Math.floor(i/14)%3;
  const archetype=i%19===0?'hospital':i%23===0?'townhall':i%11===0?'cinema':i%7===0?'house':district===2?'tower':'shops';
  const floors=archetype==='house'?1+i%2:archetype==='townhall'?2:archetype==='hospital'?5:district===0?3+i%3:district===1?2+i%2:7+i%8;
  if(reserve(p.x,p.z,r))plots.push({x:p.x,z:p.z,w,d,r,yaw:Math.atan2(-out.x,-out.z),floors,kind:i%4,district,archetype,near:true});
 }
 // Small infill houses occupy safe residual lots behind the main street frontage.
 for(let i=0;i<Math.floor(length/18);i++)for(const side of [-1,1]){const f=track.frame(i/Math.floor(length/18)),out=f.n.clone().multiplyScalar(side),p=f.p.clone().addScaledVector(out,43+i%3*5),w=10,d=10,r=Math.hypot(w,d)/2;if(reserve(p.x,p.z,r))plots.push({x:p.x,z:p.z,w,d,r,yaw:Math.atan2(-out.x,-out.z),floors:1+i%2,kind:i%4,district:1,archetype:'house',near:false});}
 // A regular secondary street grid creates city blocks, rather than scattered towers.
 for(let x=-570;x<=570;x+=60)for(let z=-570;z<=570;z+=60){
  for(const dx of [-14,14]){const px=x+dx,pz=z+7,w=18,d=18,r=Math.hypot(w,d)/2;if(reserve(px,pz,r))plots.push({x:px,z:pz,w,d,r,yaw:0,floors:3+Math.abs((x+z)/60|0)%18,kind:Math.abs(x/60|0)%4,archetype:'tower',near:false});}
 }
 plots.filter(p=>!p.near&&p.archetype==='tower').forEach((p,i)=>{if(i%4===0){p.archetype='townhouses';p.floors=2;}});
 return {plots,distance,length};
}

export async function buildIllustratedCity(scene,track){
 const group=new T.Group();group.name='Illustrated São Paulo district';scene.add(group);
 const plan=planCity(track),batches=new Map(),unit=new T.BoxGeometry(1,1,1),matrix=new T.Matrix4(),quat=new T.Quaternion(),up=new T.Vector3(0,1,0);
 const palette=['#e8cb82','#d98970','#85be9c','#ac94ce','#edba56','#70b5d5','#d887af','#83b59a','#cfa879','#87c9cd','#b495d0','#e6a080'];
 const materialCache=new Map();const mat=c=>{if(!materialCache.has(c))materialCache.set(c,new T.MeshStandardMaterial({color:c,roughness:.94}));return materialCache.get(c);};
 const wall=palette.map(mat),neutral=['#f0eeea','#deded9','#b8bdc0','#929ca3','#e6e2d9'].map(mat),stone=mat('#c9c2ac'),ink=mat('#46535a'),glass=mat('#718b95'),soil=mat('#786b52'),green=mat('#73916e'),paint=mat('#eee7ce'),asphalt=mat('#7c8581');
 function add(g,m,mx,shadow=true,detail=false,tint=null){const p=new T.Vector3().setFromMatrixPosition(mx),cellSize=detail?60:256,cell=`${Math.floor(p.x/cellSize)},${Math.floor(p.z/cellSize)}`,key=`${g.uuid}:${m.uuid}:${cell}:${shadow}:${detail}`;if(!batches.has(key))batches.set(key,{g,m,transforms:[],colors:[],shadow,detail});const batch=batches.get(key);batch.transforms.push(mx.clone());batch.colors.push(tint);}
 function box(w,h,d,x,y,z,m,parent=null){matrix.compose(new T.Vector3(x,y,z),new T.Quaternion(),new T.Vector3(w,h,d));if(parent)matrix.premultiply(parent);add(unit,m,matrix);}
 function safeBox(w,h,d,x,y,z,m){if(plan.distance(x,z)>track.width/2+Math.hypot(w,d)/2+3)box(w,h,d,x,y,z,m);}
 box(2600,.1,2600,0,-.18,0,mat('#adb89b'));
 // Narrow side roads run continuously on a grid; race ribbon remains above them.
 for(let v=-600;v<=600;v+=60)for(let a=-612;a<=612;a+=12)for(const axis of [0,1]){const x=axis?v:a,z=axis?a:v;if(plan.plots.some(p=>Math.hypot(x-p.x,z-p.z)<p.r+8))continue;box(axis?10:12,.015,axis?12:10,x,-.09,z,asphalt);}
 const sidewalk=track.ribbon(track.width+13,.04,stone);group.add(sidewalk);
 const libs={};const loader=new GLTFLoader();
 for(const id of ['modular_urban_apartments_facade','modular_factory_facade'])libs[id]=(await loader.parseAsync(JSON.stringify(assets[id]),'')).scene;
 const libraryList=Object.values(libs);let detailed=0;
 const clutterFootprints=[],clutterStats={billboards:0,bladeSigns:0,cafeTables:0,marketStalls:0,rooftopTanks:0,cables:0,houses:0,hospitals:0,townHalls:0,cinemas:0,graffiti:0,monuments:0};
 function module(library,name,transform,tint=null){const source=library.getObjectByName(name);if(!source)return;source.updateWorldMatrix(true,true);source.traverse(o=>{if(!o.isMesh)return;const mx=transform.clone().multiply(o.matrixWorld);add(o.geometry,o.material,mx,true,true,tint);});}
 function shopAtlas(){const c=document.createElement('canvas');c.width=1024;c.height=512;const q=c.getContext('2d');const names=['PADARIA AURORA','MERCADO DO BAIRRO','LIVRARIA PAULISTA','CAFÉ DA ESQUINA','FARMÁCIA CENTRAL','OFICINA · AUTO','FLORES & FOLHAS','BAR DO LARGO'];
  names.forEach((name,i)=>{q.fillStyle=['#b4cabe','#dbb6a7','#e6d6ac','#b8cbd6'][i%4];q.fillRect(0,i*64,1024,64);q.fillStyle='#405861';q.font='bold 38px sans-serif';q.textAlign='center';q.fillText(name,512,i*64+45);});const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:t,roughness:1});}
 const signage=shopAtlas(),signs=Array.from({length:8},(_,i)=>{const g=new T.PlaneGeometry(1,1),uv=g.attributes.uv;for(let j=0;j<uv.count;j++)uv.setY(j,(uv.getY(j)+7-i)/8);return g;});
 const round=new T.CylinderGeometry(1,1,1,10),umbrella=new T.ConeGeometry(1,1,10),wireGeo=new T.CylinderGeometry(1,1,1,5),roofBlue=mat('#a5bfc5');
 function localDetail(g,m,x,y,z,w,h,d,base){const center=new T.Vector3(x,y,z).applyMatrix4(base);if(!g.boundingBox)g.computeBoundingBox();const size=g.boundingBox.getSize(new T.Vector3()),r=Math.hypot(size.x*w,size.z*d)/2;
  if(plan.distance(center.x,center.z)<track.width/2+r+2)return false;
  clutterFootprints.push({x:center.x,z:center.z,r});
  const mx=base.clone().multiply(new T.Matrix4().makeTranslation(x,y,z)).multiply(new T.Matrix4().makeScale(w,h,d));add(g,m,mx,true);return true;
 }
 function detailBox(w,h,d,x,y,z,m,base){return localDetail(unit,m,x,y,z,w,h,d,base);}
 function billboardTexture(){const c=document.createElement('canvas');c.width=1024;c.height=512;const q=c.getContext('2d');q.fillStyle='#e7d7b5';q.fillRect(0,0,1024,512);q.fillStyle='#afc7bf';q.fillRect(22,22,980,468);q.fillStyle='#ecdfc5';for(let i=0;i<8;i++)q.fillRect(20+i*140,325-i%3*45,100,180);q.fillStyle='#405860';q.textAlign='center';q.font='bold 102px sans-serif';q.fillText('VEM PRA RUA',512,170);q.font='42px sans-serif';q.fillText('SÃO PAULO  /  FEIRA • CAFÉ • MÚSICA',512,245);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:t,roughness:1,side:T.DoubleSide});}
 const billboardMat=billboardTexture(),boardGeo=new T.PlaneGeometry(1,1);
 function graphic(text,bg,fg){const c=document.createElement('canvas');c.width=1024;c.height=256;const q=c.getContext('2d');q.fillStyle=bg;q.fillRect(0,0,1024,256);q.fillStyle=fg;q.font='bold 90px sans-serif';q.textAlign='center';q.fillText(text,512,166);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:t,roughness:1});}
 const civicSigns={hospital:graphic('HOSPITAL MUNICIPAL','#deece6','#476b67'),townhall:graphic('PAÇO MUNICIPAL','#eadfca','#5d6871'),cinema:graphic('CINE REPÚBLICA','#e4c9c3','#5c596b')};
 const murals=['MAIS AMOR','A RUA É NOSSA','SP • ARTE VIVA'].map((text,i)=>{const c=document.createElement('canvas');c.width=1024;c.height=512;const q=c.getContext('2d');q.fillStyle=['#d2d9bc','#d5c7da','#c0d7d9'][i];q.fillRect(0,0,1024,512);for(let k=0;k<16;k++){q.fillStyle=['#d9aa98','#a5b9c1','#e6d49f'][k%3];q.beginPath();q.ellipse(40+k*67,250+Math.sin(k*2)*150,80,100,k,0,Math.PI*2);q.fill();}q.textAlign='center';q.font='italic bold 95px sans-serif';q.fillStyle='#596473';q.fillText(text,510,287);q.fillStyle='#fff0d5';q.fillText(text,505,281);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:t,roughness:1});});
 const roofGeo=new T.ConeGeometry(1,1,4).rotateY(Math.PI/4),obelisk=new T.CylinderGeometry(.05,.5,1,4),sculpture=new T.TorusGeometry(1,.13,6,16);
 // Graphic murals: faces, botanical art, a sun and geometric city drawings.
 for(let i=0;i<4;i++){const c=document.createElement('canvas');c.width=512;c.height=512;const q=c.getContext('2d');q.fillStyle=['#e9dfc9','#acbeb8','#d2b9af','#b4c4d0'][i];q.fillRect(0,0,512,512);
  const ellipse=(x,y,rx,ry,color,angle=0)=>{q.fillStyle=color;q.beginPath();q.ellipse(x,y,rx,ry,angle,0,Math.PI*2);q.fill();};
  if(i===0){ellipse(256,260,150,195,'#da955f');ellipse(194,216,37,50,'#eee6d2');ellipse(314,216,37,50,'#eee6d2');ellipse(202,216,12,24,'#394e5d');ellipse(306,216,12,24,'#394e5d');ellipse(256,328,70,18,'#a54851');}
  if(i===1){for(let k=0;k<7;k++){q.fillStyle='#446b60';q.fillRect(90+k*53,100+k%3*55,6,390);for(const side of [-1,1])ellipse(93+k*53+side*22,180+k%3*65,38,13,['#588f72','#d29e67','#789b79'][k%3],side*.6);}}
  if(i===2){ellipse(256,195,110,110,'#e4ad43');for(let k=0;k<10;k++){q.fillStyle=['#bb645d','#537681','#658975'][k%3];q.fillRect(k*57,290+k%3*33,49,222);}}
  if(i===3){for(let k=0;k<15;k++)ellipse(45+k%5*105,60+Math.floor(k/5)*170,47,65,['#ce7059','#e2b75e','#f0e8d4','#537977'][k%4],k*.6);}
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;murals.push(new T.MeshStandardMaterial({map:texture,roughness:1}));
 }
 const red=mat('#d93932'),parkGreen=mat('#73a568'),crown=new T.IcosahedronGeometry(1,1),pine=new T.ConeGeometry(1,1,7);
 const destinationSigns={masp:graphic('MASP','#d93932','#fff4de'),mall:graphic('SHOPPING PAULISTA','#735ca2','#ffffff'),supermarket:graphic('SUPERMERCADO • MERCADO SP','#39866b','#fff3d0')};
 const specialStats={parks:0,malls:0,supermarkets:0,masp:0,obelisco:0,bienal:0,pinacoteca:0,oca:0,stadium:0};
 for(const [index,p]of plan.plots.entries()){
  const base=new T.Matrix4().compose(new T.Vector3(p.x,.15,p.z),quat.setFromAxisAngle(up,p.yaw),new T.Vector3(1,1,1));
  if(p.special){
   if(drawLandmark(p,base,{box,detail:localDetail,mat,sign:graphic})){specialStats[p.archetype]++;continue;}
   box(p.w,.15,p.d,0,0,0,p.archetype==='park'?parkGreen:stone,base);
   if(p.archetype==='park'){
   specialStats.parks++;box(p.w*.9,.04,2.2,0,.12,0,paint,base);box(2.2,.04,p.d*.9,0,.13,0,paint,base);
    for(const x of [-8,8]){detailBox(2.5,1.3,2.5,x,.65,5,stone,base);localDetail(round,soil,x,2.7,5,.5,2.8,.5,base);localDetail(crown,soil,x,4.4,5,.5,.6,.5,base);detailBox(.3,2,.3,x-.55,3.2,5,soil,base);detailBox(.3,2,.3,x+.55,3.2,5,soil,base);clutterStats.monuments++;}
    for(let k=0;k<32;k++){const x=Math.sin(k*13.7)*p.w*.43,z=Math.cos(k*7.3)*p.d*.43;if(Math.abs(x)<3||Math.abs(z)<3)continue;const h=3+k%5;box(.24,h,.24,x,h/2,z,soil,base);localDetail(k%3===0?pine:crown,wall[(k%3)+2],x,h,z,2+k%2,3+k%3,2+k%2,base);if(k%4===0){detailBox(2,.2,.6,x+2,.6,z,soil,base);detailBox(.2,.6,.5,x+1.3,.3,z,ink,base);}}
    for(let k=0;k<20;k++)localDetail(crown,k%2?green:wall[6],Math.sin(k*5)*p.w*.4,.6,Math.cos(k*3)*p.d*.4,1.1,.9,1.1,base);
   }else if(p.archetype==='masp'){
    specialStats.masp++;for(const x of [-38,38])for(const z of [-13,13])box(3.5,20,3,x,10,z,red,base);
    for(const z of [-13,13])box(80,3.2,3,0,20,z,red,base);
    box(74,1.3,28,0,8.5,0,stone,base);box(74,8,28,0,13.1,0,glass,base);box(74,.7,28,0,17.5,0,stone,base);
    for(let x=-35;x<=35;x+=3.5)for(const z of [-14.05,14.05])box(.14,7.2,.14,x,13,z,ink,base);
    localDetail(boardGeo,destinationSigns.masp,0,14,14.2,16,4,.01,base);
   }else{
    const mall=p.archetype==='mall';specialStats[mall?'malls':'supermarkets']++;
    box(p.w, mall?15:8,p.d,0,mall?7.5:4,0,wall[mall?3:2],base);
    box(p.w*.88,5,.35,0,3,p.d/2+.2,glass,base);box(p.w*.9,.4,3,0,6,p.d/2+1,stone,base);
    for(let x=-p.w*.4;x<p.w*.45;x+=4)box(.2,5,.3,x,3,p.d/2+.4,ink,base);
    localDetail(boardGeo,destinationSigns[p.archetype],0,mall?11:7,p.d/2+.5,p.w*.65,2,.01,base);
    for(let x=-p.w*.35;x<p.w*.4;x+=8)box(3,1.6,3,x,mall?16:9,0,stone,base);
   }
   continue;
  }
  const h=p.floors*3.15+3.4,skin=index%5<3?neutral[index%neutral.length]:wall[index%wall.length];
  if(p.archetype==='townhouses'){
   for(let k=0;k<3;k++){const x=(k-1)*p.w/3,w=p.w/3-.15;box(w,7,p.d,x,3.5,0,wall[(index+k)%wall.length],base);box(w+.1,.3,p.d+.2,x,7.1,0,stone,base);box(1.3,2.3,.2,x-1,1.15,p.d/2+.1,soil,base);for(const y of [1.6,5]){box(1.6,1.6,.2,x+1,y,p.d/2+.15,glass,base);box(1.9,.14,.7,x+1,y-.9,p.d/2+.35,stone,base);}box(.15,7,.2,x+w/2,3.5,p.d/2+.12,paint,base);clutterStats.houses++;}continue;
  }
  add(unit,mat('#ffffff'),base.clone().multiply(new T.Matrix4().makeTranslation(0,h/2,0)).multiply(new T.Matrix4().makeScale(p.w,h,p.d)),true,false,skin.color);box(p.w+.6,.25,p.d+.6,0,h,0,stone,base);
  box(p.w+.4,.3,p.d+.4,0,3.35,0,stone,base);
  if(p.archetype==='house'){
   clutterStats.houses++;const roof=base.clone().multiply(new T.Matrix4().makeTranslation(0,h+1.5,0)).multiply(new T.Matrix4().makeScale(p.w*.70,3,p.d*.70));add(roofGeo,wall[(index+1)%6],roof);
   detailBox(.55,3.2,.7,p.w*.27,h+1.5,-p.d*.2,stone,base);
  }
  if(civicSigns[p.archetype]){
   const front=p.d/2;if(p.archetype==='hospital'){clutterStats.hospitals++;detailBox(2.4,.65,.2,0,h-1,front+.3,green,base);detailBox(.65,2.4,.2,0,h-1,front+.31,green,base);detailBox(p.w*.8,.25,2.4,0,3,front+1,stone,base);}
   if(p.archetype==='townhall'){clutterStats.townHalls++;for(const x of [-8,-4,4,8])localDetail(round,stone,x,2.1,front+.65,.28,4.2,.28,base);detailBox(p.w*.85,.55,1.7,0,4.4,front+.7,stone,base);}
   if(p.archetype==='cinema'){clutterStats.cinemas++;detailBox(p.w*.85,.65,2.2,0,3.2,front+.8,wall[1],base);}
   localDetail(boardGeo,civicSigns[p.archetype],0,4.1,front+1.9,p.w*.75,1.4,.01,base);
  }
  if(p.near){
   detailed++;const library=libraryList[p.kind===1?1:0],source=library.getObjectByName('wall_window_centered_large_01');
   const bounds=new T.Box3().setFromObject(source,true),size=bounds.getSize(new T.Vector3()),origin=bounds.getCenter(new T.Vector3());origin.y=bounds.min.y;origin.z=bounds.min.z;
   const bays=Math.max(2,Math.floor(p.w/size.x)),sx=p.w/(bays*size.x),sy=3.15/size.y;
   // Authored walls and matching openings remain fitted and retain UVs/materials.
   for(let f=0;f<p.floors;f++)for(let b=0;b<bays;b++){
    const transform=base.clone().multiply(new T.Matrix4().makeTranslation(-p.w/2+(b+.5)*p.w/bays,3.4+f*3.15,p.d/2+.06)).multiply(new T.Matrix4().makeScale(sx,sy,1)).multiply(new T.Matrix4().makeTranslation(-origin.x,-origin.y,-origin.z));
    module(library,'wall_window_centered_large_01',transform,skin.color);module(library,'window_centered_large_01',transform);
   }
   for(let b=0;b<4;b++){const x=-p.w/2+(b+.5)*p.w/4;box(p.w/4-.25,2.5,.12,x,1.45,p.d/2+.1,glass,base);box(.09,2.6,.2,x,1.45,p.d/2+.2,ink,base);box(p.w/4-.1,.12,1.65,x,3.05,p.d/2+.65,wall[(index+2)%6],base);}
   const sm=base.clone().multiply(new T.Matrix4().makeTranslation(0,3.58,p.d/2+.3)).multiply(new T.Matrix4().makeScale(p.w-.8,.72,1));add(signs[index%8],signage,sm,false);
   for(let f=1;f<p.floors;f+=2){const y=3.4+f*3.15;box(p.w,.12,1.1,0,y,p.d/2+.55,stone,base);box(p.w,.07,.07,0,y+.95,p.d/2+1.05,ink,base);for(let b=0;b<8;b++)box(.045,.85,.045,-p.w/2+(b+.5)*p.w/8,y+.5,p.d/2+1.05,ink,base);}
   // Layer details on the street-facing elevation, keeping the road safety envelope intact.
   const front=p.d/2;
   if(localDetail(boardGeo,murals[index%murals.length],-p.w*.22,1.55,front+.25,p.w*.35,2.3,.01,base))clutterStats.graffiti++;
   if(index%2===0&&localDetail(boardGeo,murals[(index+2)%murals.length],p.w*.27,h*.6,front+.26,p.w*.3,Math.min(8,h*.35),.01,base))clutterStats.graffiti++;
   // Sculptures sit in frontage pockets, never on the race surface.
   if(index%17===0){const x=p.w*.33,z=front+2.6;
    if(detailBox(1.2,.7,1.2,x,.35,z,stone,base)){clutterStats.monuments++;localDetail(index%2?sculpture:obelisk,roofBlue,x,2.1,z,index%2?.7:1,index%2?.7:3,index%2?.7:1,base);}
   }
   detailBox(.15,4.8,.15,p.w*.36,2.4,front+1.7,ink,base);
   if(detailBox(.3,2.4,1.45,p.w*.36,4.1,front+1.05,wall[(index+2)%6],base))clutterStats.bladeSigns++;
   for(let k=0;k<3;k++)detailBox(.32,.1,.7,p.w*.36,3.5+k*.5,front+1.05,ink,base);
   // Posters, air conditioning, downpipes and roof parapets give repeat modules local variation.
   for(let k=0;k<3;k++)localDetail(signs[(index+k+2)%8],signage,-p.w*.4+k*1.2,1.8,front+.23,.95,1.25,.02,base);
   detailBox(.11,h,.11,-p.w*.46,h/2,front+.3,ink,base);
   detailBox(p.w,.65,.18,0,h+.33,front,stone,base);
   for(let f=0;f<p.floors;f+=2){const y=5+f*3.15;detailBox(1.15,.65,.65,p.w*.22,y,front+.55,stone,base);for(let k=0;k<4;k++)detailBox(.75,.035,.02,p.w*.22,y-.2+k*.13,front+.89,ink,base);}
   if(index%3===0){
    if(localDetail(round,roofBlue,-p.w*.26,h+1.25,-1,1.15,2.2,1.15,base))clutterStats.rooftopTanks++;
    localDetail(round,ink,-p.w*.26,h+2.4,-1,1.23,.16,1.23,base);
   }
   if(index%5===0){
    detailBox(.18,3,.18,-3.3,h+1.5,front-.7,ink,base);detailBox(.18,3,.18,3.3,h+1.5,front-.7,ink,base);
    detailBox(9,3.8,.25,0,h+3,front-.7,ink,base);
    if(localDetail(boardGeo,billboardMat,0,h+3,front-.55,8.7,3.5,.02,base))clutterStats.billboards++;
   }
   if(p.district===0&&index%2===0){for(const x of [-4,2]){
    const z=front+2.5;localDetail(round,stone,x,.78,z,.65,.1,.65,base);detailBox(.12,.7,.12,x,.4,z,ink,base);
    if(detailBox(.7,.08,.7,x,.8,z,stone,base))clutterStats.cafeTables++;
    for(const s of [-1,1]){detailBox(.5,.1,.5,x+s, .46,z,wall[(index+1)%6],base);detailBox(.5,.55,.08,x+s,.75,z-.25,wall[(index+1)%6],base);}
    detailBox(.055,2.65,.055,x,1.33,z,ink,base);localDetail(umbrella,wall[(index+3)%6],x,2.65,z,1.5,.6,1.5,base);
   }}
   if(p.district===1&&index%2===0){const z=front+2.4;
    if(detailBox(3,.9,1.1,-3,.5,z,wall[(index+2)%6],base))clutterStats.marketStalls++;
    detailBox(3.6,.12,1.7,-3,2.35,z,wall[(index+4)%6],base);for(const x of [-4.4,-1.6])detailBox(.075,2.3,.075,x,1.15,z,ink,base);
    for(let k=0;k<4;k++){detailBox(.55,.25,.6,-4+k*.65,1.1,z,soil,base);detailBox(.4,.16,.4,-4+k*.65,1.3,z,wall[(index+k)%6],base);}
   }
   // Sagging utility cables follow the façade, never spanning the racing corridor.
   if(index%2===0){const pts=Array.from({length:9},(_,k)=>new T.Vector3(-p.w/2+k*p.w/8,6.8-Math.sin(k/8*Math.PI)*.65,front+1.2).applyMatrix4(base));
    for(let k=1;k<pts.length;k++){const a=pts[k-1],b=pts[k],mid=a.clone().add(b).multiplyScalar(.5),length=a.distanceTo(b),rotation=new T.Quaternion().setFromUnitVectors(up,b.clone().sub(a).normalize());if(plan.distance(mid.x,mid.z)<track.width/2+3)continue;add(wireGeo,ink,new T.Matrix4().compose(mid,rotation,new T.Vector3(.024,length,.024)),false);clutterStats.cables++;}
   }
  }
  // Side elevations and distant buildings still have windows, sills and roof equipment.
  for(let y=4.7;y<h-1;y+=3.15)for(let b=0;b<Math.floor(p.d/3);b++)for(const side of [-1,1]){box(.08,1.55,1.55,side*(p.w/2+.045),y,-p.d/2+(b+.5)*3,glass,base);}
  for(let y=4.7;y<h-1;y+=3.15)for(let x=-p.w/2+2;x<p.w/2;x+=3.5)for(const side of [-1,1])box(1.6,1.6,.025,x,y,side*(p.d/2+.015),glass,base);
  box(3,1.8,3,2,h+1,0,ink,base);box(2,.7,1.6,-3,h+.5,2,stone,base);
 }
 // Leaf-cutout clusters retain organic silhouettes without heavy tree meshes.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const q=canvas.getContext('2d');q.fillStyle='#ffffff';
 for(let i=0;i<100;i++){const a=i*2.39996,r=50*Math.sqrt(i/100),x=64+Math.cos(a)*r,y=64+Math.sin(a)*r;q.beginPath();q.ellipse(x,y,5+i%4,3+i%3,a,0,Math.PI*2);q.fill();}
 const leafTexture=new T.CanvasTexture(canvas);leafTexture.colorSpace=T.SRGBColorSpace;
 const leaves=['#9db69e','#b0c19b','#94b2a0','#c8afd1','#d7b6cb','#adc6b1'].map(color=>new T.MeshStandardMaterial({color,map:leafTexture,alphaTest:.45,side:T.DoubleSide,roughness:1}));
 const leafGeo=new T.PlaneGeometry(1,1),trunk=new T.CylinderGeometry(.15,.23,1,7);let trees=0,plantBeds=0;
 const random=seed=>{const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n);},treePositions=[];
 function tree(x,z,seed){if(plan.distance(x,z)<track.width/2+6||plan.plots.some(p=>Math.hypot(x-p.x,z-p.z)<p.r+2)||treePositions.some(p=>Math.hypot(x-p.x,z-p.z)<3))return;const type=Math.floor(random(seed+8)*3),h=(type===1?7.5:5.5)*(.78+random(seed+19)*.48);
  treePositions.push({x,z});
  add(trunk,soil,new T.Matrix4().compose(new T.Vector3(x,h/2,z),new T.Quaternion(),new T.Vector3(1,h,1)));
  for(let j=0;j<(type===1?7:9);j++){const a=j*2.4,mx=new T.Matrix4().compose(new T.Vector3(x+Math.sin(a)*(type===1?.6:1.1),h+.2+j%3*.4,z+Math.cos(a)*(type===1?.6:1.1)),new T.Quaternion().setFromEuler(new T.Euler(type===1?1.1:.3+(j%2)*.65,a,0)),new T.Vector3(type===1?1:3,type===1?4.5:2.8,1));add(leafGeo,leaves[type===2?3+j%2:(seed+j)%3],mx,false);}trees++;}
 const walkers=[],personColors=['#bc8c80','#83a9b3','#d2bd8a','#ae9dc0','#94b9a5'].map(mat),skinColors=['#d7ac8c','#ae805f','#805c48','#e8c4a3'].map(mat);let busStops=0,waitingPeople=0;
 const busSign=graphic('ÔNIBUS • SP','#315d6c','#ffffff'),lampMaterial=mat('#fff2cf');lampMaterial.userData.streetLamp=true;
 const queueTemplate=createPedestrian(0,{skin:skinColors,shirt:personColors,dark:ink});queueTemplate.group.updateMatrixWorld(true);const queueParts=[];queueTemplate.group.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);const colors=new Float32Array(g.attributes.position.count*3);for(let i=0;i<colors.length;i+=3)o.material.color.toArray(colors,i);g.setAttribute('color',new T.BufferAttribute(colors,3));queueParts.push(g);});const queueGeometry=mergeGeometries(queueParts),queueMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:1});queueParts.forEach(g=>g.dispose());
 for(let i=0;i<Math.floor(plan.length/12);i++)for(const side of [-1,1]){
  const f=track.frame(i/Math.floor(plan.length/12)),p=f.p.clone().addScaledVector(f.n,side*(track.width/2+4.8));
  if(plan.distance(p.x,p.z)<track.width/2+3.8)continue;
  safeBox(.13,5.4,.13,p.x,2.7,p.z,ink);safeBox(1.4,.12,.5,p.x,5.4,p.z,lampMaterial);
  // Independent, reproducible patches on each side: gaps, pairs and deeper pockets.
  const seed=i*31+(side===1?17001:29003);
  if(random(seed)>.12)for(let j=0;j<3+Math.floor(random(seed+1)*4);j++){
   const t=f.p.clone().addScaledVector(f.n,side*(track.width/2+6.5+random(seed+j*7+2)*11)).addScaledVector(f.tan,(random(seed+j*7+3)-.5)*17);
   tree(t.x,t.z,seed+j*11);
  }
  if(random(seed+99)>.48){const t=f.p.clone().addScaledVector(f.n,side*(track.width/2+6.2+random(seed+100)*1.6)).addScaledVector(f.tan,(random(seed+101)-.5)*6),base=new T.Matrix4().compose(t,new T.Quaternion().setFromAxisAngle(up,Math.atan2(f.tan.x,f.tan.z)+(random(seed+102)-.5)*.45),new T.Vector3(1,1,1));
   if(localDetail(unit,stone,0,.25,0,1.4,.5,2.6,base)){plantBeds++;
    localDetail(unit,soil,0,.51,0,1.2,.08,2.4,base);
    // Alternate low hedges, flowering beds and upright ornamental foliage.
    for(let k=0;k<8;k++){const x=Math.sin(k*2.4)*.43,z=-1+k*.28,y=i%3===0?.9:1.15,rotation=new T.Matrix4().makeRotationY(k*2.4);const mx=base.clone().multiply(new T.Matrix4().makeTranslation(x,y,z)).multiply(rotation).multiply(new T.Matrix4().makeScale(i%3===2?.35:.8,i%3===2?1.35:.85,1));add(leafGeo,leaves[i%3===1?3+k%2:k%3],mx,false);}
   }
  }
  if(i%3===0){safeBox(1.6,.12,.5,p.x,.55,p.z+1.8,soil);safeBox(.45,.85,.45,p.x,.43,p.z-1.2,green);}
  for(let j=0;j<3;j++){const origin=p.clone().addScaledVector(f.tan,(j-1)*3.2).addScaledVector(f.n,side*(random(seed+j+700)-.5));if(plan.distance(origin.x,origin.z)<track.width/2+3.6)continue;const person=createPedestrian(i*3+j+side,{skin:skinColors,shirt:personColors,dark:ink}),walker=person.group;walker.position.copy(origin);walker.rotation.y=Math.atan2(f.tan.x,f.tan.z);group.add(walker);walkers.push({mesh:walker,limbs:person.limbs,arms:person.arms,origin,tan:f.tan.clone(),phase:i+j});}
  if(i%12===5){const location=f.p.clone().addScaledVector(f.n,side*(track.width/2+8)),base=new T.Matrix4().compose(location,new T.Quaternion().setFromAxisAngle(up,Math.atan2(f.tan.x,f.tan.z)),new T.Vector3(1,1,1));
   if(detailBox(2.4,.18,6,0,2.8,0,roofBlue,base)){busStops++;for(const z of [-2.6,2.6])detailBox(.15,2.8,.15,.9,1.4,z,ink,base);detailBox(.5,.2,4,.6,.6,0,stone,base);localDetail(boardGeo,busSign,-.9,2.2,2.7,2, .55,.01,base);
    for(let j=0;j<9;j++){const position=location.clone().addScaledVector(f.tan,(j-4)*.75).addScaledVector(f.n,-side*(1.3+j%2*.65));if(plan.distance(position.x,position.z)<track.width/2+3)continue;const transform=new T.Matrix4().compose(position,new T.Quaternion().setFromAxisAngle(up,Math.atan2(-f.n.x*side,-f.n.z*side)),new T.Vector3(1,.92+j%3*.07,1));add(queueGeometry,queueMaterial,transform,false,true,new T.Color().setHSL(j*.17,.14,.85));waitingPeople++;}
   }
  }
 }
 const detailBatches=[];
 for(const batch of batches.values()){const mesh=new T.InstancedMesh(batch.g,batch.m,batch.transforms.length);batch.transforms.forEach((mx,i)=>mesh.setMatrixAt(i,mx));if(batch.colors.some(Boolean))batch.colors.forEach((c,i)=>mesh.setColorAt(i,c||new T.Color('white')));mesh.castShadow=batch.shadow;mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.name='City spatial batch';if(batch.detail){detailBatches.push(mesh);mesh.visible=false;}group.add(mesh);}
 group.userData.clutterFootprints=clutterFootprints;
 group.userData.treePositions=treePositions;
 group.userData.cityStats={buildings:plan.plots.length,detailed,trees,plantBeds,pedestrians:walkers.length+waitingPeople,busStops,waitingPeople,...clutterStats,...specialStats};
 return {group,plan,stats:group.userData.cityStats,update(dt,camera){if(camera)for(const mesh of detailBatches)mesh.visible=mesh.boundingSphere.center.distanceTo(camera.position)<110+mesh.boundingSphere.radius;for(const w of walkers){w.mesh.visible=!camera||w.origin.distanceTo(camera.position)<110;if(!w.mesh.visible)continue;w.phase+=dt;const offset=Math.sin(w.phase*.35)*1.2,next=w.origin.clone().addScaledVector(w.tan,offset);if(plan.distance(next.x,next.z)>track.width/2+3)w.mesh.position.copy(next);animatePedestrian(w);}}};
}
