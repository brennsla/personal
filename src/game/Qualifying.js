import {advanceProgress} from './RaceProgress.js';
export class QualifyingLap{
 constructor(t){this.previous=t;this.progress=0;this.time=0;this.started=false;this.done=false;}
 update(t,dt){const delta=advanceProgress(this.previous,t);
  if(!this.started&&this.previous>.9&&t<.1&&delta>0){this.started=true;this.progress=t;this.time=dt*t/delta;}
  else if(this.started&&!this.done){this.progress+=delta;this.time+=dt;if(this.progress>=1){this.time-=dt*(this.progress-1)/Math.max(delta,1e-9);this.done=true;}}
  this.previous=t;return this.done;
 }
}
export function qualifyingOrder(playerTime,aiTimes){return [{id:'player',time:playerTime},...aiTimes.map((time,i)=>({id:i,time}))].sort((a,b)=>a.time-b.time);}
