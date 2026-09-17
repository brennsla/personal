import * as T from 'three';

// Original textures and UV transforms are shared, never repainted or mutated.
// Geometry-based architectural ink avoids an extra full-scene normal/depth pass.
export function illustratedMaterials(root,{edges:drawEdges=true}={}){
 const ramp=new T.DataTexture(new Uint8Array([105,105,105,255,240,240,240,255]),2,1);
 ramp.minFilter=ramp.magFilter=T.NearestFilter;ramp.generateMipmaps=false;ramp.needsUpdate=true;
 const cache=new Map(),entries=[],lines=[],edgeCache=new Map();root.updateMatrixWorld(true);
 function convert(original){
  if(cache.has(original))return cache.get(original);
  const m=new T.MeshToonMaterial({color:original.color?.clone()||new T.Color('white'),map:original.map||null,
   gradientMap:ramp,alphaMap:original.alphaMap||null,alphaTest:original.alphaTest||0,
   transparent:original.transparent,opacity:original.opacity,side:original.side,
   vertexColors:original.vertexColors,depthWrite:original.depthWrite,
   emissive:original.emissive?.clone()||new T.Color('black'),emissiveMap:original.emissiveMap||null,
   emissiveIntensity:original.emissiveIntensity??1});
  m.userData={...original.userData};cache.set(original,m);return m;
 }
 root.traverse(o=>{if(!o.isMesh)return;const original=o.material;
  entries.push({mesh:o,original,toon:Array.isArray(original)?original.map(convert):convert(original)});
  const mats=Array.isArray(original)?original:[original];
  // No triangle-wireframe foliage: outline only crisp, opaque architectural edges.
  if(!drawEdges||o.isInstancedMesh||mats.some(m=>m.transparent||m.alphaTest>0)||o.geometry.attributes.position.count>20000)return;
  let edges=edgeCache.get(o.geometry);if(!edges){edges=new T.EdgesGeometry(o.geometry,38);edgeCache.set(o.geometry,edges);}
  const p=edges.attributes.position,v=new T.Vector3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);lines.push(v.x,v.y,v.z);}
 });
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(lines,3));
 const ink=new T.LineSegments(geometry,new T.LineBasicMaterial({color:0x39454c,transparent:true,opacity:.38,depthWrite:false}));
 ink.name='Architectural ink';ink.renderOrder=2;
 for(const edge of edgeCache.values())edge.dispose();
 return {ink,entries,set(enabled){for(const e of entries)e.mesh.material=enabled?e.toon:e.original;},setInk(enabled){ink.visible=enabled;}};
}
