import * as T from 'three';
// Filled surfaces stay intact. Derivatives keep the triangle ink about one pixel wide.
export function fineWireframe(root){
 const enabled={value:0},geometries=new Map(),materials=new Set();
 root.traverse(o=>{
  if(!o.isMesh||o.isSkinnedMesh)return;
  const list=[o.material].flat();
  // Alpha-cut foliage and glass would expose the rectangular card geometry.
  if(list.some(m=>m.transparent||m.alphaTest>0))return;
  let g=geometries.get(o.geometry);
  if(!g){g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();const count=g.attributes.position.count,bary=new Float32Array(count*3);for(let i=0;i<count;i++)bary[i*3+i%3]=1;g.setAttribute('inkBarycentric',new T.BufferAttribute(bary,3));geometries.set(o.geometry,g);}
  o.geometry=g;
  for(const m of list){if(materials.has(m))continue;materials.add(m);const previous=m.onBeforeCompile,key=m.customProgramCacheKey();
   m.onBeforeCompile=shader=>{previous.call(m,shader);shader.uniforms.fineInkEnabled=enabled;
    shader.vertexShader='attribute vec3 inkBarycentric; varying vec3 vInkBarycentric; varying float vInkDistance;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvInkBarycentric=inkBarycentric;');
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvInkDistance=length(mvPosition.xyz);');
    shader.fragmentShader='uniform float fineInkEnabled; varying vec3 vInkBarycentric; varying float vInkDistance;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`#include <opaque_fragment>
vec3 inkAA=smoothstep(vec3(0.0),fwidth(vInkBarycentric)*0.65,vInkBarycentric);
float inkLine=1.0-min(min(inkAA.x,inkAA.y),inkAA.z);
float inkDistance=1.0-smoothstep(35.0,110.0,vInkDistance);
gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(0.0),inkLine*fineInkEnabled*inkDistance*0.55);`);
   };m.customProgramCacheKey=()=>key+'-fine-wire-v1';m.needsUpdate=true;
  }
 });
 return {set(value){enabled.value=value?1:0;},geometries};
}
