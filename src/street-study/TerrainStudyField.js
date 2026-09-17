import {MathUtils} from 'three';
export function terrainStudyField(plan,width){
 const raw=(x,z)=>{const ridge=(cx,cz,sx,sz,h)=>h*Math.exp(-(((x-cx)/sx)**2+((z-cz)/sz)**2));return 7+ridge(-280,-180,300,310,74)+ridge(330,100,280,360,59)+ridge(-260,410,270,200,33)-ridge(0,160,170,230,18)+4*Math.sin(x/140)*Math.cos(z/170);};
 const natural=(x,z)=>raw(x,z)*MathUtils.smoothstep(plan.distance(x,z),width/2+15,width/2+100);
 const plots=plan.plots.map(p=>({...p,elevation:natural(p.x,p.z)*MathUtils.smoothstep(plan.distance(p.x,p.z)-p.r,width/2+15,width/2+30)})),cache=new Map();
 function height(x,z){const key=x.toFixed(2)+','+z.toFixed(2);if(cache.has(key))return cache.get(key);if(plan.distance(x,z)<=width/2+15)return 0;const base=natural(x,z);let best=null,distance=Infinity;for(const p of plots){const d=Math.hypot(x-p.x,z-p.z)-p.r;if(d<distance){distance=d;best=p;}}const value=best&&distance<9?MathUtils.lerp(best.elevation,base,MathUtils.smoothstep(distance,0,9)):base;cache.set(key,value);return value;}
 return {height,plots,natural};
}
