import * as THREE from 'three';
export class Turbo {
 constructor(scene,track,controller,root){
  this.controller=controller;this.time=0;this.items=[];
  const geometry=new THREE.OctahedronGeometry(.65),material=new THREE.MeshStandardMaterial({color:0x54e4ff,emissive:0x13aedd,emissiveIntensity:2,metalness:.4,roughness:.2});
  for(let i=0;i<16;i++){const f=track.frame((.055+i/16)%1),mesh=new THREE.Mesh(geometry,material);mesh.position.copy(f.p).addScaledVector(f.n,[-5,0,5][i%3]);mesh.position.y=1;scene.add(mesh);this.items.push({mesh,cooldown:0});}
  this.el=document.createElement('div');this.el.className='turbo-meter';this.el.style.cssText='position:fixed;bottom:70px;right:28px;padding:14px 18px;background:#08222ddb;border:1px solid #53dfff;color:white;min-width:200px;pointer-events:none;font:16px sans-serif';
  this.el.innerHTML='<b>TURBO · SHIFT</b><div style="height:7px;background:#ffffff26;margin-top:10px"><div class="charge" style="height:100%;background:#54e4ff;width:0%"></div></div><small>COLETE OS CRISTAIS AZUIS</small>';root.append(this.el);
 }
 update(dt,car){this.time+=dt;for(const item of this.items){item.cooldown=Math.max(0,item.cooldown-dt);item.mesh.visible=item.cooldown===0;item.mesh.rotation.y+=dt*1.5;item.mesh.position.y=1+Math.sin(this.time*3)*.16;if(item.cooldown===0&&Math.hypot(car.position.x-item.mesh.position.x,car.position.z-item.mesh.position.z)<1.8){this.controller.turbo=Math.min(6,this.controller.turbo+2);item.cooldown=14;item.mesh.visible=false;}}
  this.el.querySelector('.charge').style.width=`${this.controller.turbo/6*100}%`;this.el.querySelector('small').textContent=this.controller.boosting?'TURBO ATIVADO':this.controller.turbo>0?'SEGURE SHIFT PARA USAR':'COLETE OS CRISTAIS AZUIS';
 }
}
