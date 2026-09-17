import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
export const INK_FRAGMENT=`
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform vec2 resolution;
uniform float cameraNear;
uniform float cameraFar;
varying vec2 vUv;
float viewDepth(vec2 uv){float z=texture2D(tDepth,uv).x;return cameraNear*cameraFar/(cameraFar-z*(cameraFar-cameraNear));}
void main(){
 vec4 color=texture2D(tDiffuse,vUv);float d=viewDepth(vUv);
 vec2 px=0.38/resolution;
 float x=viewDepth(vUv+vec2(px.x,0.0))+viewDepth(vUv-vec2(px.x,0.0))-2.0*d;
 float y=viewDepth(vUv+vec2(0.0,px.y))+viewDepth(vUv-vec2(0.0,px.y))-2.0*d;
 // Curvature of linear depth suppresses outlines on smooth road surfaces.
 float edge=smoothstep(0.007,0.024,(abs(x)+abs(y))/max(d,1.0));
 edge*=1.0-smoothstep(130.0,360.0,d);
 if(d>cameraFar*0.98)edge=0.0;
 gl_FragColor=vec4(mix(color.rgb,vec3(0.0),edge),color.a);
}`;
export function inkComposer(renderer,scene,camera){
 const size=renderer.getDrawingBufferSize(new T.Vector2());
 const target=new T.WebGLRenderTarget(size.x,size.y,{type:T.HalfFloatType});target.depthTexture=new T.DepthTexture(size.x,size.y,T.UnsignedIntType);
 const composer=new EffectComposer(renderer,target);
 const pass=new ShaderPass({uniforms:{tDiffuse:{value:null},tDepth:{value:null},resolution:{value:size.clone()},cameraNear:{value:camera.near},cameraFar:{value:camera.far}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:INK_FRAGMENT});
 const render=pass.render.bind(pass);pass.render=(r,write,read,...rest)=>{pass.uniforms.tDepth.value=read.depthTexture;pass.uniforms.resolution.value.set(read.width,read.height);pass.uniforms.cameraNear.value=camera.near;pass.uniforms.cameraFar.value=camera.far;render(r,write,read,...rest);};
 composer.addPass(new RenderPass(scene,camera));composer.addPass(pass);
 const turbo=new ShaderPass({uniforms:{tDiffuse:{value:null},strength:{value:0}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`uniform sampler2D tDiffuse;uniform float strength;varying vec2 vUv;void main(){vec2 delta=vUv-vec2(.5,.47);float mask=smoothstep(.18,.57,length(delta));vec4 c=texture2D(tDiffuse,vUv);for(int i=1;i<6;i++)c+=texture2D(tDiffuse,vUv-delta*float(i)*.008*strength*mask);gl_FragColor=c/6.0;}`});
 turbo.enabled=false;composer.addPass(turbo);composer.setTurbo=value=>{turbo.enabled=value>0;turbo.uniforms.strength.value=value;};composer.addPass(new OutputPass());
 const dispose=composer.dispose.bind(composer);composer.dispose=()=>{for(const p of composer.passes)p.dispose?.();dispose();};return composer;
}
