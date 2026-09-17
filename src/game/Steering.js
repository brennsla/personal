import {MathUtils} from 'three';
export function steeringStep(current,target,speed,handling,dt,gentle=false){
 const response=gentle?(target===0?8:3.2):9;
 const steer=MathUtils.damp(current,target,response,dt);
 const controlled=gentle?steer*(.6+.4*Math.abs(steer)):steer;
 const angle=controlled*(gentle?.34:.5)/(1+Math.abs(speed)*(gentle?.048:.035));
 const yaw=MathUtils.clamp(speed/2.7*Math.tan(angle)*handling,gentle?-.72:-1.05,gentle?.72:1.05);
 return {steer,yaw};
}
