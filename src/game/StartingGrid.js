import {frameAt} from '../utils/trackMath.js';

// Two columns, with a full vehicle length of free space between rows.
export function gridSlot(track,index){
 const lane=index%2===0?-3:3;
 const t=1-(14+Math.floor(index/2)*11+(index%2)*2)/track.curve.getLength();
 const frame=frameAt(track.curve,t);
 return {t,lane,position:frame.point.addScaledVector(frame.normal,lane),heading:Math.atan2(-frame.tangent.x,-frame.tangent.z)};
}
