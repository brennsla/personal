export function beginFinishCoast(car,track,t,speed){
 return {remaining:3.5,t,speed:Math.max(0,speed),offset:car.position.clone().sub(track.frame(t).p)};
}
export function advanceFinishCoast(state,car,track,dt){
 const step=Math.min(dt,state.remaining);state.remaining=Math.max(0,state.remaining-step);
 state.speed*=Math.exp(-step*.65);state.t=(state.t+state.speed*step/track.curve.getLength())%1;
 const f=track.frame(state.t);state.offset.multiplyScalar(Math.exp(-step*.6));car.position.copy(f.p).add(state.offset);car.position.y=.092;
 const target=Math.atan2(-f.tan.x,-f.tan.z),delta=Math.atan2(Math.sin(target-car.rotation.y),Math.cos(target-car.rotation.y));car.rotation.y+=delta*(1-Math.exp(-step*3));
 return state.remaining===0;
}
