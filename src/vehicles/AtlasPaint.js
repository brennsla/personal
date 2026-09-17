import * as T from 'three';
// Recolor a texture copy, never the source atlas. No additional GPU shader code.
export function recolorAtlasPixels(pixels,body,target){
 const source=new T.Color().fromArray(body),bodySRGB=source.clone().convertLinearToSRGB(),targetSRGB=target.clone().convertLinearToSRGB();
 for(let i=0;i<pixels.length;i+=4){
  const r=pixels[i]/255,g=pixels[i+1]/255,b=pixels[i+2]/255;
  const distance=Math.hypot(r-bodySRGB.r,g-bodySRGB.g,b-bodySRGB.b);
  if(distance>=.085)continue;
  const blend=1-T.MathUtils.smoothstep(distance,.035,.085),shade=T.MathUtils.clamp((r+g+b)/Math.max(.01,bodySRGB.r+bodySRGB.g+bodySRGB.b),.7,1.25);
  for(const [j,c]of [targetSRGB.r,targetSRGB.g,targetSRGB.b].entries())pixels[i+j]=Math.round(T.MathUtils.lerp(pixels[i+j],Math.min(255,c*shade*255),blend));
 }
 return pixels;
}
const cache=new Map();
export function applyAtlasPaint(root,color,key){
 const target=new T.Color(color),original=target.equals(new T.Color(0xffffff));
 root.traverse(o=>{if(!o.isMesh)return;for(const m of [o.material].flat()){
  const body=m.userData.paintAtlasColor;if(!body)continue;
  // Remove the opt-in metadata even for Original: use the proven standard shader.
  delete m.userData.paintAtlasColor;delete m.userData.paintTint;m.color.set(0xffffff);
  if(original||!m.map?.image)return;
  const cacheKey=key+':'+target.getHexString();let texture=cache.get(cacheKey);
  if(!texture){const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(m.map.image,0,0,512,512);const data=context.getImageData(0,0,512,512);recolorAtlasPixels(data.data,body,target);context.putImageData(data,0,0);texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.flipY=m.map.flipY;texture.wrapS=m.map.wrapS;texture.wrapT=m.map.wrapT;texture.offset.copy(m.map.offset);texture.repeat.copy(m.map.repeat);cache.set(cacheKey,texture);}
  m.map=texture;m.needsUpdate=true;
 }});
 return root;
}
