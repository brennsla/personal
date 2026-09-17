import * as THREE from 'three';
export function nearestTrackPoint(curve, point, samples=260){let best={t:0,d:Infinity,point:null};for(let i=0;i<samples;i++){const t=i/samples,p=curve.getPointAt(t),d=p.distanceToSquared(point);if(d<best.d)best={t,d,point:p}}return best}
export function frameAt(curve,t){const tangent=curve.getTangentAt((t+1)%1).setY(0).normalize();return{tangent,normal:new THREE.Vector3(-tangent.z,0,tangent.x),point:curve.getPointAt((t+1)%1)}}
