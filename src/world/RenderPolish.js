import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Shared daylight reflections, generated locally so the standalone game stays offline.
export function daylightEnvironment(renderer){
  const data=new Float32Array(128*64*4);
  for(let y=0;y<64;y++)for(let x=0;x<128;x++){
    const v=y/63,sky=v<.5,t=sky?v*2:(v-.5)*2;
    const c=new THREE.Color().lerpColors(new THREE.Color(sky?0x83b5da:0xbfc4bc),new THREE.Color(sky?0xdde1d9:0x44503d),t);
    const glow=Math.exp(-((x-25)**2/70+(y-24)**2/12))*2;
    const i=(y*128+x)*4;data.set([c.r+glow,c.g+glow*.78,c.b+glow*.45,1],i);
  }
  const texture=new THREE.DataTexture(data,128,64,THREE.RGBAFormat,THREE.FloatType);
  texture.mapping=THREE.EquirectangularReflectionMapping;texture.needsUpdate=true;
  const pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromEquirectangular(texture);
  texture.dispose();pmrem.dispose();return target;
}

export function polishWorld(group){
  group.updateMatrixWorld(true);
  const batches=new Map();
  group.traverse(mesh=>{
    if(!mesh.isMesh||mesh.isInstancedMesh||Array.isArray(mesh.material)||mesh.material.transparent||mesh.material.isShaderMaterial)return;
    // Batch by material AND spatial cell to retain useful frustum culling.
    const p=mesh.getWorldPosition(new THREE.Vector3()),key=`${mesh.material.uuid}:${Math.floor(p.x/100)}:${Math.floor(p.z/100)}`;
    if(!batches.has(key))batches.set(key,[]);batches.get(key).push(mesh);
  });
  for(const meshes of batches.values()){
    if(meshes.length<2)continue;
    const pieces=meshes.map(m=>{const g=m.geometry.clone();g.applyMatrix4(m.matrixWorld);return g.index?g.toNonIndexed():g;});
    const geometry=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());if(!geometry)continue;
    const combined=new THREE.Mesh(geometry,meshes[0].material);
    combined.castShadow=meshes.some(m=>m.castShadow);combined.receiveShadow=true;
    meshes.forEach(m=>m.removeFromParent());group.add(combined);
  }
}

export function smokeTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const q=canvas.getContext('2d'),g=q.createRadialGradient(32,32,2,32,32,31);
  g.addColorStop(0,'rgba(220,225,230,.65)');g.addColorStop(.4,'rgba(220,225,230,.3)');g.addColorStop(1,'rgba(220,225,230,0)');
  q.fillStyle=g;q.fillRect(0,0,64,64);return new THREE.CanvasTexture(canvas);
}
