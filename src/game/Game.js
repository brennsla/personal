import {GraphicsTrial} from './GraphicsTrial.js';
import {worldLife} from '../world/WorldLife.js';
import {realMaterials} from '../world/RealMaterials.js';
import {landscapeAtmosphere} from '../world/LandscapeAtmosphere.js';
import * as THREE from 'three';
import {beginFinishCoast,advanceFinishCoast} from './FinishCoast.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {daylightEnvironment,polishWorld,smokeTexture} from '../world/RenderPolish.js';
import {vehicleContact} from './Collision.js';
import {QualifyingLap,qualifyingOrder} from './Qualifying.js';
import {gridSlot} from './StartingGrid.js';
import {advanceProgress} from './RaceProgress.js';
import {Turbo} from './Turbo.js';
import {Track} from '../world/Track.js';
import {ScenicEnvironment} from '../world/ScenicEnvironment.js';
import {CIRCUITS} from '../world/Circuits.js';
import {Environment} from '../world/Environment.js';
import {AIVehicle} from '../vehicles/AIVehicle.js';
import {CarController} from './CarController.js';
import {CameraController} from './CameraController.js';
import {HUD} from '../ui/HUD.js';
import {frameAt} from '../utils/trackMath.js';
import {loadVehicleModel as defaultLoadVehicle} from '../vehicles/VehicleCatalog.js';

export class Game{
  constructor(root,selection,onReturn){
    this.root=root;this.selection=selection;this.onReturn=onReturn;this.running=true;this.scene=new THREE.Scene();
    const sky=(CIRCUITS[selection.circuit]||CIRCUITS.city).sky;this.scene.background=new THREE.Color(sky);this.scene.fog=new THREE.Fog(sky,400,1800);
    this.camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,2600);
    this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setSize(innerWidth,innerHeight);
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
    this.environmentTarget=daylightEnvironment(this.renderer);this.scene.environment=this.environmentTarget.texture;this.scene.environmentIntensity=.75;
    this.scene.userData.environmentFactory=selection.environmentFactory;
    root.append(this.renderer.domElement);this.setup();
    this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.16,.45,1.15);this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());
    this.graphicsTrial=selection.illustrated?null:new GraphicsTrial(this);
    if(selection.illustrated){this.bloom.enabled=false;this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));}
    Promise.all(this.pendingModels).then(()=>{if(this.running)selection.styleScene?.(this);}).catch(()=>{});
    this.onResize=()=>this.resize();this.onDebug=e=>{if(e.code==='KeyG'){this.cam.toggle();this.track.setDebug(this.cam.debug);this.box.visible=this.cam.debug}};addEventListener('resize',this.onResize);addEventListener('keydown',this.onDebug);
  }
  setup(){
    const loadVehicleModel=this.selection.loadVehicle||defaultLoadVehicle;
    const dawn=this.selection?.circuit==='desert';
    const coastal=this.selection?.circuit==='beach';
    this.scene.add(new THREE.HemisphereLight(dawn?0x8795bf:0xaeb9db,dawn?0x65505a:0x273525,dawn?.95:1.65));
    this.sunOffset=new THREE.Vector3(-110,dawn?24:95,-190);if(dawn)this.scene.environmentIntensity=.4;
    if(coastal){this.sunOffset.set(-150,75,-120);this.scene.environmentIntensity=.65;this.renderer.toneMappingExposure=1.03;this.scene.fog=new THREE.Fog(0xb8ccd0,320,1550);}
    const sun=new THREE.DirectionalLight(dawn?0xffad78:0xffb55f,dawn?3.4:5.2);sun.position.copy(this.sunOffset);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.00025;sun.shadow.camera.near=1;sun.shadow.camera.far=760;sun.shadow.camera.left=sun.shadow.camera.bottom=-75;sun.shadow.camera.right=sun.shadow.camera.top=75;sun.shadow.normalBias=.025;this.sun=sun;this.scene.add(sun,sun.target);
    this.track=new Track(this.scene,this.selection.circuit);const environment=(this.selection.circuit==='city'||this.selection.circuit==='city-night')?new Environment(this.scene,this.track):new ScenicEnvironment(this.scene,this.track,this.selection.circuit);landscapeAtmosphere(this.scene,environment,this.track,this.selection.circuit);if(this.selection.circuit==='city-night'){this.scene.fog=new THREE.Fog(0x080f20,180,1500);this.sun.color.set(0x9cb9ec);this.sun.intensity=1.1;this.scene.environmentIntensity=.3;this.scene.children.filter(o=>o.isHemisphereLight).forEach(o=>o.intensity=.55);}
    realMaterials(environment);this.worldLife=worldLife(this.scene,this.track,this.selection.circuit);
    polishWorld(environment.group);polishWorld(this.track.group);
    this.player=new THREE.Group();this.player.wheels=[];this.scene.add(this.player);
    if(this.selection.circuit==='city-night'){const target=new THREE.Object3D();target.position.set(0,0,-35);this.player.add(target);for(const side of [-1,1]){const headlight=new THREE.SpotLight(0xffedce,100,85,.48,.65,1);headlight.position.set(side*.75,1,-1.8);headlight.target=target;this.player.add(headlight);}}
    this.setupSmoke();this.pendingModels=[this.scene.userData.environmentReady||Promise.resolve()];this.loaded=false;
    this.pendingModels.push(loadVehicleModel(this.selection.id,this.selection.color).then(model=>{this.player.add(model);this.player.userData.hitbox=model.userData.hitbox;this.player.wheels=model.wheels||[]}));
    const slot=gridSlot(this.track,0),gridT=slot.t;this.player.position.copy(slot.position);this.player.position.y=.092;this.player.rotation.y=slot.heading;
    this.controller=new CarController(this.player,this.track,this.selection.stats,this.root);this.cam=new CameraController(this.camera,this.renderer,this.player);this.cam.update(10,0);
    this.ai=[];const pool=(this.selection.rivalPool||[['police',0xffffff],['hummer',0x426144],['renegade',0xffffff],['modern',0xffffff],['orange',0xffffff],['duster',0xffffff],['luxury',0xd33c2f],['trail',0xe58824],['defender',0x2468a8]]).filter(([id])=>id!==this.selection.id);const rivals=Array.from({length:(this.selection.racers||2)-1},(_,i)=>pool[i%pool.length]);
    rivals.forEach(([id,c],i)=>{const car=new THREE.Group();car.wheels=[];this.scene.add(car);this.pendingModels.push(loadVehicleModel(id,c).then(model=>{car.add(model);car.userData.hitbox=model.userData.hitbox;car.wheels=model.wheels||[]}));const slot=gridSlot(this.track,i+1);const rival=new AIVehicle(car,this.track,slot.t,(34+i*.45)*1.4,slot.lane);rival.update(0);rival.modelId=id;this.ai.push(rival)});
    this.box=new THREE.BoxHelper(this.player,0x50ff90);this.box.visible=false;this.scene.add(this.box);
    this.hud=new HUD(this.root,this.track,()=>this.returnToMenu());this.turboItems=new Turbo(this.scene,this.track,this.controller,this.root);this.clock=new THREE.Clock();this.elapsed=0;this.countdown=3.7;this.raceStarted=false;this.finished=false;this.prevT=gridT;this.playerProgress=gridT-1;this.lap=1;this.position=1;this.frameTimes=[];this.laps=this.selection.laps||1;this.totalCars=this.ai.length+1;this.hud.configure(this.totalCars,this.laps);this.phase='qualifying';this.qualifying=new QualifyingLap(gridT);this.ai.forEach(a=>a.car.visible=false);this.turboItems.items.forEach(i=>i.mesh.visible=false);this.turboItems.el.hidden=true;this.hud.setQualifying(true);Promise.all(this.pendingModels).then(()=>{this.loaded=true}).catch(e=>{console.error(e);this.hud.setLoadingError(()=>this.returnToMenu())});
  }
  start(){this.animate()}
  animate(){
    if(!this.running)return;this.raf=requestAnimationFrame(()=>this.animate());this.sun.target.position.copy(this.player.position);this.sun.position.copy(this.player.position).add(this.sunOffset);const realDt=this.clock.getDelta(),dt=Math.min(.04,realDt);this.graphicsTrial?.update(realDt);if(this.graphicsTrial?.paused){this.composer.render();return;}this.worldLife?.update(dt);this.frameTimes.push(realDt*1000);if(this.frameTimes.length>120)this.frameTimes.shift();
    if(!this.loaded){this.cam.update(dt,0);this.composer.render();return}
    if(!this.raceStarted){this.hud.update(0,this.position,1,0,this.prevT,false,0,this.phase==='qualifying'?[]:this.ai.map(a=>a.t));this.countdown-=dt;this.hud.setCountdown(this.countdown);this.cam.update(dt,0);if(this.countdown<=0){this.raceStarted=true;this.goTime=.65;this.clock.getDelta();this.hud.setCountdown(0)}this.composer.render();return}
    if(this.phase==='qualifying-result'){this.composer.render();return}
    if(this.finished){if(this.finishCoast){const done=advanceFinishCoast(this.finishCoast,this.player,this.track,dt);this.controller.speed=this.finishCoast.speed;for(const a of this.ai)a.update(dt,[]);if(done){this.finishCoast=null;this.controller.speed=0;this.hud.showFinish(this.position,this.elapsed);}}this.updateSmoke(dt);this.cam.update(dt,this.controller.speed);this.composer.render();return}
    if(this.goTime>0){this.goTime-=dt;if(this.goTime<=0)this.hud.setCountdown(-1)}
    if(this.phase==='qualifying'){this.tickQualifying(dt);return;}
    this.elapsed+=dt;let t=this.prevT;const steps=Math.ceil(dt/(1/120));for(let step=0;step<steps;step++){const h=dt/steps;t=this.controller.update(h);for(const a of this.ai)a.update(h,[this.player,...this.ai.filter(b=>b!==a).map(b=>b.car)]);for(let i=0;i<this.ai.length;i++)for(let j=i+1;j<this.ai.length;j++){const a=this.ai[i],b=this.ai[j],contact=vehicleContact(a.car,b.car);if(contact){a.displace(contact.normal,(contact.overlap+.01)*.5);b.displace({x:-contact.normal.x,z:-contact.normal.z},(contact.overlap+.01)*.5);a.bump(4);b.bump(2);}}this.controller.resolveCollisions(this.ai);}this.playerProgress+=advanceProgress(this.prevT,t);this.lap=Math.min(this.laps,Math.floor(Math.max(0,this.playerProgress))+1);this.updateSmoke(dt);this.turboItems.update(dt,this.player);
    const playerProgress=this.playerProgress;this.position=1+this.ai.filter(a=>a.totalProgress>playerProgress).length;
    if(this.playerProgress>=this.laps){this.finished=true;this.finishCoast=this.selection.illustrated?beginFinishCoast(this.player,this.track,t,this.controller.speed):null;this.controller.boosting=false;this.hud.update(this.controller.speed,this.position,this.laps,this.elapsed,t,this.cam.debug,Math.round(1/dt),this.ai.map(a=>a.t));if(!this.finishCoast){this.controller.speed=0;this.hud.showFinish(this.position,this.elapsed);}this.composer.render();return}
    this.prevT=t;this.cam.update(dt,this.controller.speed);this.box.update();
    this.hud.update(this.controller.speed,this.position,this.lap,this.elapsed,t,this.cam.debug,Math.round(1/dt),this.ai.map(a=>a.t));this.composer.render();
    if(this.cam.debug&&this.frameTimes.length){const sorted=[...this.frameTimes].sort((a,b)=>a-b),mean=sorted.reduce((a,b)=>a+b,0)/sorted.length;this.hud.el.querySelector('#fps').textContent=`${Math.round(1000/mean)} FPS · p95 ${sorted[Math.floor(sorted.length*.95)].toFixed(1)} ms`;}
  }

  tickQualifying(dt){
    const steps=Math.max(1,Math.ceil(dt/(1/120)));
    for(let i=0;i<steps;i++){const t=this.controller.update(dt/steps);this.prevT=t;if(this.qualifying.update(t,dt/steps)){this.finishQualifying();break;}}
    this.updateSmoke(dt);this.cam.update(dt,this.controller.speed);this.box.update();
    this.hud.update(this.controller.speed,1,1,this.qualifying.time,this.prevT,this.cam.debug,Math.round(1/Math.max(dt,.001)),[]);
    this.hud.el.querySelector('.goal strong').textContent=this.qualifying.started?'VOLTA CRONOMETRADA':'CRUZE A LINHA PARA INICIAR';
    this.composer.render();
  }
  finishQualifying(){
    this.phase='qualifying-result';this.controller.speed=0;this.controller.keys={};
    // Opponent solo times derived from their actual clear-track pace, without traffic.
    const length=this.track.curve.getLength();this.gridOrder=qualifyingOrder(this.qualifying.time,this.ai.map(a=>length/a.speed));
    this.hud.showQualifying(this.gridOrder,this.ai,()=>this.beginRace());
  }
  beginRace(){
    this.gridOrder.forEach((entry,index)=>{const slot=gridSlot(this.track,index);
      if(entry.id==='player'){this.player.position.copy(slot.position);this.player.position.y=.092;this.player.rotation.set(0,slot.heading,0);this.prevT=slot.t;this.playerProgress=slot.t-1;this.position=index+1;}
      else{const a=this.ai[entry.id];a.t=a.previousT=slot.t;a.lap=0;a.lane=a.targetLane=slot.lane;a.passCooldown=0;a.currentSpeed=0;a.hit=0;a.car.visible=true;a.update(0);}
    });
    this.controller.speed=0;this.controller.steer=0;this.controller.keys={};this.controller.turbo=0;this.controller.boosting=false;
    this.smoke.forEach(p=>{p.visible=false;p.userData.life=0;});this.smokeTimer=0;
    this.phase='race';this.finished=false;this.elapsed=0;this.lap=1;this.raceStarted=false;this.countdown=3.7;this.goTime=0;
    this.hud.setQualifying(false);this.turboItems.el.hidden=false;this.turboItems.items.forEach(i=>{i.cooldown=0;i.mesh.visible=true;});
    this.cam.update(10,0);this.clock.getDelta();
  }

  resize(){this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);this.composer.setSize(innerWidth,innerHeight);this.graphicsTrial?.resize()}
  setupSmoke(){this.smoke=[];this.smokeCursor=0;this.smokeTimer=0;const texture=smokeTexture();for(let i=0;i<28;i++){const puff=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:0xd9dee3,transparent:true,opacity:0,depthWrite:false}));puff.visible=false;puff.userData.life=0;this.scene.add(puff);this.smoke.push(puff)}}
  updateSmoke(dt){for(const puff of this.smoke){if(puff.userData.life<=0)continue;puff.userData.life-=dt;puff.position.y+=dt*.85;puff.scale.addScalar(dt*1.45);puff.material.opacity=Math.max(0,puff.userData.life*.48);if(puff.userData.life<=0)puff.visible=false}const sliding=Math.abs(this.controller.steer)>.58&&Math.abs(this.controller.speed)>11;if(!sliding){this.smokeTimer=0;return}this.smokeTimer-=dt;if(this.smokeTimer>0)return;this.smokeTimer=.07;for(const side of[-.82,.82]){const puff=this.smoke[this.smokeCursor++%this.smoke.length],position=this.player.localToWorld(new THREE.Vector3(side,.05,1.42));puff.position.copy(position);puff.scale.setScalar(.58);puff.material.opacity=.22;puff.userData.life=.42;puff.visible=true}}
  returnToMenu(){if(!this.running)return;this.running=false;cancelAnimationFrame(this.raf);removeEventListener('resize',this.onResize);removeEventListener('keydown',this.onDebug);this.controller.dispose();this.cam.orbit.dispose();this.graphicsTrial?.dispose();this.environmentTarget.dispose();this.renderer.dispose();this.composer.dispose?.();this.root.replaceChildren();this.onReturn?.()}
}
