import * as T from 'three';
import {illustratedMaterials} from './IllustratedMaterials.js';
export const PALE_FRAGMENT=`
// Desaturate and gently lift source textures without replacing their UVs/maps.
float paleLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
vec3 paleBase = clamp(mix(vec3(paleLuma), diffuseColor.rgb, 1.12),0.0,1.0);
float paleLift = mix(0.015, 0.07, smoothstep(0.04, 0.5, paleLuma));
diffuseColor.rgb = mix(paleBase, vec3(0.97, 0.95, 0.90), paleLift);
`;
export function paleStyle(root){
 const style=illustratedMaterials(root,{edges:false});style.set(true);
 const seen=new Set();for(const entry of style.entries)for(const m of [entry.mesh.material].flat()){
  if(seen.has(m))continue;seen.add(m);
  m.onBeforeCompile=shader=>{
   const marker='#include <map_fragment>';if(!shader.fragmentShader.includes(marker))throw Error('Pale style: incompatible Three.js shader');
   let paint='';
   if(m.userData.paintAtlasColor){
    shader.uniforms.atlasBody={value:new T.Color().fromArray(m.userData.paintAtlasColor)};
    shader.uniforms.atlasTint={value:m.userData.paintTint};
    shader.fragmentShader='uniform vec3 atlasBody; uniform vec3 atlasTint;\n'+shader.fragmentShader;
    // Compare perceptual colors: linear-space distances confuse dark blue paint with black tires.
    paint=`float paintMask=1.0-smoothstep(.035,.075,distance(sqrt(max(diffuseColor.rgb,vec3(0.0))),sqrt(atlasBody)));float paintActive=step(.01,distance(atlasTint,vec3(1.0)));float paintShade=clamp(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))/max(.02,dot(atlasBody,vec3(.2126,.7152,.0722))),.6,1.3);diffuseColor.rgb=mix(diffuseColor.rgb,atlasTint*paintShade,paintMask*paintActive);`;
   }
   shader.fragmentShader=shader.fragmentShader.replace(marker,marker+paint+PALE_FRAGMENT);
  };
  m.customProgramCacheKey=()=> 'suv-pale-toon-v4'+Boolean(m.userData.paintAtlasColor);m.needsUpdate=true;
 }
 return style;
}
