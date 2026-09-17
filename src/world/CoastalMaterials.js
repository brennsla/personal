import * as T from 'three';

// Small, deterministic, locally generated surface maps; no network dependencies.
export function coastalMaterials(){
 function surface(color,kind,roughness,scale){
  const size=128,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const noise=((x*73+y*151+x*y*19)%101)/100;
   let value=210+noise*35;
   if(kind==='sand')value=208+noise*24+12*Math.sin(y*.36+Math.sin(x*.08));
   if(kind==='stone'&&(y%32<2||x%64<2))value=135;
   const p=(y*size+x)*4;data.set([value,value,value,255],p);
  }
  const map=new T.DataTexture(data,size,size);map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(scale,scale);map.colorSpace=T.SRGBColorSpace;map.needsUpdate=true;map.anisotropy=4;
  const relief=map.clone();relief.colorSpace=T.NoColorSpace;relief.needsUpdate=true;
  return new T.MeshStandardMaterial({color,map,bumpMap:relief,bumpScale:kind==='sand'?.035:.018,roughness});
 }
 return {plaster:surface(0xe7ddc9,'plaster',.88,4),stone:surface(0xcac0ab,'stone',.94,2),sand:surface(0xe2cb9e,'sand',.98,12),wetSand:surface(0xb5a27e,'sand',.42,5),glass:new T.MeshStandardMaterial({color:0x60858e,metalness:.48,roughness:.2}),water:surface(0x389caa,'sand',.22,18)};
}

export function enrichCoast(env,materials){
 // Narrow shore strips follow a softly irregular shoreline, wholly east of the circuit.
 function strip(a,b,mat,height){const pos=[],uv=[],indices=[];for(let i=0;i<=96;i++){const z=-275+i*4.5,wave=Math.sin(z*.045)*1.2+Math.sin(z*.13)*.3;for(const x of [a,b]){pos.push(x+wave,height,z);uv.push((x-a)/8,i/8);}if(i<96){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const m=new T.Mesh(geo,mat);m.receiveShadow=true;env.group.add(m);}
 strip(447,460,materials.sand,.025);strip(460,467,materials.wetSand,.03);strip(467,492,materials.water,.02);
 // Salt-tolerant planting in repeated small beds, away from all racing surfaces.
 for(let i=0;i<24;i++){const z=-235+i*14;env.place(430,z,2.8,g=>{
  g.name='coastal-planting';env.box(3.4,.25,4.5,0,.12,0,0x9b947f,g);env.box(3.1,.06,4.2,0,.26,0,0x675b41,g);
  for(let j=0;j<7;j++){const x=Math.sin(j*23+i)*1.1,zz=Math.cos(j*31+i)*1.6;const shrub=env.mesh(new T.IcosahedronGeometry(.48,1),[0x567044,0x71834f,0x3e6548][j%3],g);shrub.position.set(x,.65,zz);shrub.scale.set(1,.75,1);}
  for(let j=0;j<8;j++){const leaf=env.mesh(new T.ConeGeometry(.12,.8,3),0x8b995c,g);leaf.position.set(Math.sin(j)*1.3,.65,Math.cos(j)*1.7);leaf.rotation.z=Math.sin(j)*.35;}
 });}
 env.group.userData.coastalSurfacePass=true;
}
