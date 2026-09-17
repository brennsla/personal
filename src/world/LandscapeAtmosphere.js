import {windowLights} from './WorldLife.js';
import * as T from 'three';
import {Sky} from 'three/addons/objects/Sky.js';

export function landscapeAtmosphere(scene,environment,track,id){
 if(environment.illustrated)return;
 const night=id==='city-night',city=id==='city'||night,beach=id==='beach';
 // Replace the old decorative sky rather than layering two domes.
 const remove=[];environment.group.traverse(o=>{if(o.isMesh&&(o.material.isShaderMaterial||o.geometry.type==='CircleGeometry'&&o.material.fog===false))remove.push(o);});remove.forEach(o=>o.removeFromParent());
 if(!night){const sky=new Sky();sky.scale.setScalar(2200);const u=sky.material.uniforms;u.turbidity.value=beach?3.5:6;u.rayleigh.value=2;u.mieCoefficient.value=.004;u.mieDirectionalG.value=.82;u.sunPosition.value.set(-110,id==='desert'?12:85,-190);scene.add(sky);}
 else{
  scene.background=new T.Color(0x080f20);
  const stars=[];for(let i=0;i<850;i++){const a=i*2.39996,y=.15+((i*71)%800)/900,r=Math.sqrt(1-y*y);stars.push(Math.cos(a)*r*1900,y*1900,Math.sin(a)*r*1900);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(stars,3));scene.add(new T.Points(geometry,new T.PointsMaterial({color:0xc6d6ef,size:2.2,fog:false})));
  const moon=new T.Mesh(new T.SphereGeometry(14,20,12),new T.MeshBasicMaterial({color:0xd5dfec,fog:false}));moon.position.set(-800,650,-1200);scene.add(moon);
  windowLights(environment.group);
  const lampMat=new T.MeshStandardMaterial({color:0xffe3ae,emissive:0xffc578,emissiveIntensity:2});
  for(let i=0;i<100;i++){const f=track.frame(i/100);for(const side of [-1,1]){const p=f.p.clone().addScaledVector(f.n,side*(track.width/2+4));const pole=new T.Mesh(new T.CylinderGeometry(.1,.15,6,6),new T.MeshStandardMaterial({color:0x525b67}));pole.position.copy(p);pole.position.y=3;scene.add(pole);const lamp=new T.Mesh(new T.BoxGeometry(1.4,.16,.5),lampMat);lamp.position.copy(p);lamp.position.y=6;scene.add(lamp);}}
 }
 // Continuous outer terrain, with flat race districts retained to avoid burying existing roads.
 const geo=new T.PlaneGeometry(4200,4200,150,150);geo.rotateX(-Math.PI/2);const a=geo.attributes.position,colors=[];
 for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i),r=Math.hypot(x,z);let h;
  if(beach){const cap=Math.max(0,Math.abs(z)-720)/180;h=Math.min(1,cap)*Math.max(0,100+55*Math.sin(x*.007)+35*Math.cos(z*.009));if(x>850)h=-8;else if(Math.abs(z)<720)h=-2;}
  else {const fade=T.MathUtils.smoothstep(r,city?740:690,city?1050:1000);h=fade*((city?65:130)+(city?45:95)*Math.sin(x*.004)*Math.cos(z*.005)+35*Math.sin(x*.011+z*.007))-2;}
  a.setY(i,h);const c=new T.Color(beach?0x647b50:city?0x426449:0xb88b62);c.multiplyScalar(.78+Math.max(0,h)/550);colors.push(c.r,c.g,c.b);
 }
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const terrain=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:1}));terrain.receiveShadow=true;scene.add(terrain);
 return {night,terrain};
}
