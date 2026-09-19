import * as THREE from 'three';
import {nearestTrackPoint} from '../utils/trackMath.js';
import {vehicleContact} from './Collision.js';
import {steeringStep} from './Steering.js';
import {touchControls} from '../ui/TouchControls.js';
export class CarController{
 constructor(car,track,stats={},root){
  this.gentleSteering=stats.gentleSteering===true;
  Object.assign(this,{car,track,speed:0,steer:0,turbo:0,boosting:false,keys:{},topSpeed:stats.topSpeed||37,acceleration:stats.acceleration||12,handling:stats.handling||.9});
  this.onDown=e=>{this.keys[e.code]=true;if(/Arrow|Space/.test(e.code))e.preventDefault()};this.onUp=e=>this.keys[e.code]=false;this.onBlur=()=>this.keys={};
  addEventListener('keydown',this.onDown);addEventListener('keyup',this.onUp);addEventListener('blur',this.onBlur);
  this.touchKeys={};this.touch=root?touchControls(root,this.touchKeys):null;
 }
 update(dt){
  const k={...this.keys};for(const code in this.touchKeys)k[code]=k[code]||this.touchKeys[code];
  const gas=k.KeyW||k.ArrowUp,brake=k.KeyS||k.ArrowDown;
  this.boosting=!!((k.ShiftLeft||k.ShiftRight)&&this.turbo>0&&this.speed>2);
  if(this.boosting)this.turbo=Math.max(0,this.turbo-dt);
  const limit=this.topSpeed+(this.boosting?14:0);
  if(gas)this.speed+=this.acceleration*dt;if(this.boosting)this.speed+=18*dt;
  if(brake)this.speed-=22*dt;
  if(k.Space)this.speed*=Math.exp(-1.4*dt);
  const drag=(1.25+Math.abs(this.speed)*.024)*dt;
  this.speed=Math.sign(this.speed)*Math.max(0,Math.abs(this.speed)-drag);
  if(this.speed>limit)this.speed=Math.max(limit,this.speed-14*dt);
  this.speed=Math.max(-6,Math.min(this.speed,this.topSpeed+14));
  const target=(k.KeyA||k.ArrowLeft?1:0)-(k.KeyD||k.ArrowRight?1:0);
  const response=steeringStep(this.steer,target,this.speed,this.handling,dt,this.gentleSteering);this.steer=response.steer;
  this.car.rotation.y+=response.yaw*dt;
  this.car.translateZ(-this.speed*dt);
  const near=nearestTrackPoint(this.track.curve,this.car.position,1000),dist=Math.sqrt(near.d),halfWidth=(this.car.userData.hitbox?.width||2)/2,edge=this.track.width/2-halfWidth;
  if(dist>edge){const direction=this.car.position.clone().sub(near.point).setY(0).normalize();this.car.position.copy(near.point).addScaledVector(direction,edge);this.speed*=Math.exp(-4*dt);}
  this.car.rotation.z=0;this.car.position.y=.092;return near.t;
 }
 resolveCollisions(vehicles){for(const v of vehicles){const c=vehicleContact(this.car,v.car);if(!c)continue;this.car.position.x+=c.normal.x*(c.overlap+.01);this.car.position.z+=c.normal.z*(c.overlap+.01);const closing=Math.max(0,this.speed-v.currentSpeed);this.speed-=Math.min(Math.max(this.speed,0)*.3,closing*.4+.4);v.bump?.(Math.max(1,closing*.3));}}
 dispose(){this.touch?.dispose();removeEventListener('keydown',this.onDown);removeEventListener('keyup',this.onUp);removeEventListener('blur',this.onBlur);}
}
