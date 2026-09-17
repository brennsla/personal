import * as THREE from 'three';

// One tile represents one 3 m floor and 3 m frontage, rather than an entire tower.
export function apartmentMaterial(color){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const q=canvas.getContext('2d');q.fillStyle='#'+new THREE.Color(color).getHexString();q.fillRect(0,0,256,256);
 q.fillStyle='#565b59';q.fillRect(35,28,187,184);q.fillStyle='#d6d2c7';q.fillRect(39,32,179,176);
 const glass=q.createLinearGradient(0,36,0,202);glass.addColorStop(0,'#829ca5');glass.addColorStop(.5,'#445c66');glass.addColorStop(1,'#24353e');q.fillStyle=glass;q.fillRect(45,38,167,164);
 q.fillStyle='#b6b3a8';q.fillRect(123,38,4,164);q.fillRect(45,120,167,3);
 q.fillStyle='rgba(238,223,195,.48)';q.fillRect(48,42,24,156);q.fillStyle='rgba(12,24,28,.3)';q.fillRect(46,186,164,15);
 q.fillStyle='#bbb8ae';q.fillRect(24,210,211,7);q.fillStyle='rgba(0,0,0,.16)';q.fillRect(24,217,211,6);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;
 return new THREE.MeshStandardMaterial({map,roughness:.68,metalness:.06});
}
export function facadeBox(width,height,depth){const g=new THREE.BoxGeometry(width,height,depth),uv=g.attributes.uv;for(let face=0;face<6;face++)for(let j=0;j<4;j++){const k=face*4+j;uv.setXY(k,uv.getX(k)*(face<2?depth:width)/3,uv.getY(k)*(face===2||face===3?depth:height)/3);}return g;}
