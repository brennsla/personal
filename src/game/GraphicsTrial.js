import * as T from 'three';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';

export function coatedPaint(material){
 if(!material.isMeshStandardMaterial||material.isMeshPhysicalMaterial||material.map||!/paint/i.test(material.name))return null;
 const result=new T.MeshPhysicalMaterial();T.MeshStandardMaterial.prototype.copy.call(result,material);
 result.clearcoat=.85;result.clearcoatRoughness=.18;result.roughness=Math.max(.22,Math.min(.4,material.roughness));return result;
}

export class GraphicsTrial{
 constructor(game){
  this.game=game;this.high=false;this.paused=false;this.paints=[];this.samples=[];this.timer=0;
  this.ao=new SSAOPass(game.scene,game.camera,innerWidth,innerHeight,16);this.ao.kernelRadius=5;this.ao.minDistance=.001;this.ao.maxDistance=.035;this.ao.enabled=false;
  // Transparent clouds/smoke and the sky must not write false occluders.
  const render=this.ao.render.bind(this.ao);
  this.ao.render=(...args)=>{const hidden=[];game.scene.traverse(o=>{if(o.visible&&(o.isSprite||o.isSky||o.isMesh&&(Array.isArray(o.material)?o.material.some(m=>m.transparent):o.material.transparent))){hidden.push(o);o.visible=false;}});try{render(...args);}finally{for(const o of hidden)o.visible=true;}};
  game.composer.insertPass(this.ao,1);
  this.fxaa=new ShaderPass(FXAAShader);this.fxaa.enabled=false;game.composer.addPass(this.fxaa);
  this.originalEnvironment=game.scene.environment;
  const sky=game.scene.children.find(o=>o.isSky);
  if(sky){const capture=new T.Scene(),copy=sky.clone();capture.add(copy);const floor=new T.Mesh(new T.PlaneGeometry(8000,8000),new T.MeshBasicMaterial({color:0x535b50}));floor.rotation.x=-Math.PI/2;floor.position.y=-20;capture.add(floor);const pmrem=new T.PMREMGenerator(game.renderer);this.reflections=pmrem.fromScene(capture,.04,.1,5000);pmrem.dispose();floor.geometry.dispose();floor.material.dispose();}
  this.panel=document.createElement('div');this.panel.style.cssText='position:absolute;bottom:14px;left:50%;transform:translateX(-50%);z-index:30;background:#102029ed;color:white;padding:9px 12px;border:1px solid #6b858b;border-radius:9px;font:12px sans-serif;display:flex;gap:10px;align-items:center';
  this.toggle=document.createElement('button');this.toggle.textContent='GRÁFICOS: ORIGINAL';this.toggle.onclick=()=>this.setHigh(!this.high);
  this.freeze=document.createElement('button');this.freeze.textContent='PAUSAR COMPARAÇÃO';this.freeze.onclick=()=>{this.paused=!this.paused;this.freeze.textContent=this.paused?'CONTINUAR':'PAUSAR COMPARAÇÃO';this.samples=[];};
  this.stats=document.createElement('span');this.panel.append(this.toggle,this.freeze,this.stats);game.root.append(this.panel);
  Promise.all(game.pendingModels).then(()=>{if(!game.running)return;for(const vehicle of [game.player,...game.ai.map(a=>a.car)])vehicle.traverse(o=>{if(!o.isMesh)return;const old=o.material,list=Array.isArray(old)?old:[old],upgraded=list.map(m=>coatedPaint(m)||m);if(upgraded.some((m,i)=>m!==list[i]))this.paints.push({mesh:o,original:old,high:Array.isArray(old)?upgraded:upgraded[0]});});this.setHigh(this.high);}).catch(()=>{});
  this.resize();
 }
 setHigh(value){this.high=value;this.ao.enabled=this.fxaa.enabled=value;this.game.scene.environment=value&&this.reflections?this.reflections.texture:this.originalEnvironment;for(const p of this.paints)p.mesh.material=value?p.high:p.original;this.toggle.textContent=value?'GRÁFICOS: ALTA · EXPERIMENTAL':'GRÁFICOS: ORIGINAL';this.samples=[];}
 resize(){const size=this.game.renderer.getDrawingBufferSize(new T.Vector2());this.fxaa.material.uniforms.resolution.value.set(1/size.x,1/size.y);this.ao.setSize(Math.round(size.x*.65),Math.round(size.y*.65));}
 update(dt){if(!this.game.loaded)return;this.samples.push(dt*1000);if(this.samples.length>120)this.samples.shift();this.timer+=dt;if(this.timer>.5){this.timer=0;const sorted=[...this.samples].sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length/2)]||0;this.stats.textContent=`${median.toFixed(1)} ms/frame${this.paused?' · pausado':''}`;}}
 dispose(){this.ao.dispose();this.fxaa.dispose();this.reflections?.dispose();for(const p of this.paints){const before=Array.isArray(p.original)?p.original:[p.original];for(const m of Array.isArray(p.high)?p.high:[p.high])if(!before.includes(m))m.dispose();}this.panel.remove();}
}
