import * as T from 'three';
export const LANDMARK_LOTS=[['obelisco',36,36,.06],['bienal',104,44,.24],['pinacoteca',70,38,.56],['oca',78,78,.74],['stadium',190,150,.92]];
// Authored game-scale interpretations, not surveyed replicas.
export function drawLandmark(p,base,{box,detail,mat,sign}){
 if(!LANDMARK_LOTS.some(l=>l[0]===p.archetype))return false;
 const white=mat('#eeeae0'),grey=mat('#aaaeb0'),dark=mat('#42545c'),brick=mat('#ad7256'),grass=mat('#4c965c');
 const sphere=new T.SphereGeometry(1,20,10,0,Math.PI*2,0,Math.PI/2),round=new T.CylinderGeometry(1,1,1,12),arch=new T.TorusGeometry(1,.13,5,12,Math.PI);
 const D=(g,m,x,y,z,w,h,d)=>detail(g,m,x,y,z,w,h,d,base);
 const B=(w,h,d,x,y,z,m)=>box(w,h,d,x,y,z,m,base);
 B(p.w,.18,p.d,0,0,0,grey);
 if(p.archetype==='obelisco'){
  for(let i=0;i<4;i++)B(21-i*3,.65,21-i*3,0,i*.65+.4,0,white);
  D(new T.CylinderGeometry(2,4.1,1,4).rotateY(Math.PI/4),white,0,33,0,1,60,1);
  D(new T.ConeGeometry(2,6,4).rotateY(Math.PI/4),white,0,66,0,1,1,1);
  B(10,.8,10,0,3,0,white);B(7,.3,7,0,3.55,0,white);
  for(const x of [-4,4])B(1.4,3,.15,x,4,5,brick);
 }else if(p.archetype==='oca'){
  D(sphere,white,0,.2,0,34,19,34);
  // Dark portholes around the lower curved wall.
  const porthole=new T.SphereGeometry(1,8,6);for(let i=0;i<16;i++){const a=i/16*Math.PI*2;D(porthole,dark,Math.sin(a)*33,3.8,Math.cos(a)*33,1.7,1.7,1.7);}
  B(6,3.5,2,0,1.9,33, dark);
 }else if(p.archetype==='bienal'){
  B(98,10,36,0,9,0,dark);
  for(const y of [4,9,14])B(102,.65,40,0,y,0,white);
  for(let x=-46;x<=46;x+=4){B(.22,9.5,.24,x,9,18.1,grey);B(.3,4,.3,x,2,15,white);}
  for(let x=-42;x<=42;x+=14)B(6,6,.4,x,8,18.5,mat(['#cb714f','#87a9b7','#dda940'][Math.abs(x/14)%3]));
 }else if(p.archetype==='pinacoteca'){
  B(66,15,32,0,7.5,0,brick);B(69,.7,34,0,15.3,0,white);B(68,.55,33,0,7,0,grey);
  for(let x=-29;x<=29;x+=5.8){B(.8,15,.65,x,7.5,16.3,brick);for(const y of [3,10]){B(2.4,3,.2,x+2,y,16.4,dark);D(arch,white,x+2,y+1.5,16.5,1.2,1.2,1);}}
  B(12,2,4,0,16,0,brick);for(let i=0;i<5;i++)B(12+i*1.4,.25,1.4,0,.2+i*.25,18+(4-i)*1.2,white);
 }else{
  B(105,.05,68,0,.15,0,grass);
  for(const z of [-34,34])B(105,.03,.18,0,.2,z,white);for(const x of [-52.5,0,52.5])B(.18,.03,68,x,.2,0,white);
  const center=new T.TorusGeometry(9,.12,4,28).rotateX(Math.PI/2);D(center,white,0,.22,0,1,1,1);
  for(let i=0;i<44;i++){const a=i/44*Math.PI*2,x=Math.cos(a),z=Math.sin(a);for(let tier=0;tier<4;tier++)B(11,2.6,9,x*(65+tier*5),2+tier*3,z*(44+tier*5),tier%2?white:mat('#637f9e'));B(13,.7,12,x*85,16,z*63,grey);}
  for(const x of [-52,52]){B(.16,2.5,7.3,x,1.4,0,white);B(2,.14,7.3,x,2.6,0,white);}
  for(const x of [-80,80])for(const z of [-57,57]){B(.6,30,.6,x,15,z,grey);B(7,3,1,x,30,z,white);}
 }
 const label={obelisco:'OBELISCO • IBIRAPUERA',bienal:'PAVILHÃO DA BIENAL',oca:'OCA • IBIRAPUERA',pinacoteca:'PINACOTECA',stadium:'ESTÁDIO PAULISTA'}[p.archetype];
 D(new T.PlaneGeometry(1,1),sign(label,'#eeeeea','#42545c'),0,2.5,p.d/2-1,Math.min(25,p.w*.7),2,.01);
 return true;
}
