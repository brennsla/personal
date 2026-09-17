import * as T from 'three';
import {randomWindowLights,vehicleNightLights,streetLampLights} from './NightLights.js';
export function rainTarget(phase,progress,laps,finished){return phase==='race'&&!finished&&progress/Math.max(1,laps)>.3&&progress/Math.max(1,laps)<.8?1:0;}
export function cityWeather(game,night){
 const count=750,points=new Float32Array(count*6),seeds=Array.from({length:count},(_,i)=>({x:Math.sin(i*127.1)*32,z:Math.cos(i*87.7)*32,y:(i*.731)%20})),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(points,3));
 const material=new T.LineBasicMaterial({color:night?'#bfd4ec':'#dfebee',transparent:true,opacity:0,depthWrite:false}),rain=new T.LineSegments(geometry,material);rain.frustumCulled=false;rain.name='Cidade da Garoa';game.scene.add(rain);
 const clear=new T.Color(night?'#18263f':'#95c8e5'),overcast=new T.Color(night?'#263347':'#9baeb9');let intensity=0;
 const hemi=game.scene.children.filter(o=>o.isHemisphereLight);
 if(night){randomWindowLights(game.scene,game.scene.userData.illustratedCity?.plan.plots||[]);game.scene.traverse(o=>{if(o.isMesh)for(const m of [o.material].flat()){if(m.isMeshBasicMaterial&&m.fog===false)m.color.set('#71829d');}});vehicleNightLights(game.player,true);for(const a of game.ai||[])vehicleNightLights(a.car);}
 const streetLights=night?streetLampLights(game.scene):null;
 return {update(dt){streetLights?.update(game.player.position);const target=rainTarget(game.phase,game.playerProgress,game.laps,game.finished);intensity=T.MathUtils.damp(intensity,target,1.1,dt);rain.visible=intensity>.01;rain.position.copy(game.player.position);material.opacity=intensity*(night?.4:.28);
  if(rain.visible){for(let i=0;i<count;i++){const s=seeds[i];s.y=(s.y-dt*15+20)%20;points.set([s.x,s.y,s.z,s.x+.15,s.y-.6,s.z+.08],i*6);}geometry.attributes.position.needsUpdate=true;}
  game.scene.background.copy(clear).lerp(overcast,intensity);game.scene.fog.color.copy(game.scene.background);game.sun.intensity=(night?.72:1.7)*(1-intensity*.25);hemi.forEach(h=>h.intensity=night?.6:.75);game.scene.fog.far=T.MathUtils.lerp(night?1250:1600,800,intensity);
 }};
}
