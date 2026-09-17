import * as T from 'three';
const headGeo=new T.SphereGeometry(.15,8,6),torsoGeo=new T.CapsuleGeometry(.17,.36,3,8),limbGeo=new T.CapsuleGeometry(.055,.43,2,6),shoeGeo=new T.BoxGeometry(.13,.1,.24),hairGeo=new T.SphereGeometry(.158,8,6,0,Math.PI*2,0,Math.PI*.58);
export function createPedestrian(index,palette){
 index=Math.abs(index);
 const group=new T.Group(),skin=palette.skin[index%palette.skin.length],shirt=palette.shirt[index%palette.shirt.length],dark=palette.dark;
 const body=new T.Mesh(torsoGeo,shirt);body.position.y=1.02;body.scale.z=.7;group.add(body);
 const head=new T.Mesh(headGeo,skin);head.position.y=1.49;head.scale.y=1.12;group.add(head);
 const hair=new T.Mesh(hairGeo,dark);hair.position.y=1.53;group.add(hair);
 const limbs=[],arms=[];
 for(const side of [-1,1]){const hip=new T.Group();hip.position.set(side*.095,.79,0);group.add(hip);const leg=new T.Mesh(limbGeo,dark);leg.position.y=-.29;leg.scale.y=1.35;hip.add(leg);const shoe=new T.Mesh(shoeGeo,dark);shoe.position.set(0,-.72,.045);hip.add(shoe);limbs.push(hip);
  const shoulder=new T.Group();shoulder.position.set(side*.20,1.23,0);group.add(shoulder);const arm=new T.Mesh(limbGeo,shirt);arm.position.y=-.24;shoulder.add(arm);const hand=new T.Mesh(headGeo,skin);hand.scale.setScalar(.38);hand.position.y=-.53;shoulder.add(hand);arms.push(shoulder);
 }
 group.scale.setScalar(.94+(index%4)*.035);
 group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 return {group,limbs,arms};
}
export function animatePedestrian(w){for(let j=0;j<2;j++){const swing=Math.sin(w.phase*3.7+j*Math.PI)*.30;w.limbs[j].rotation.x=swing;if(w.arms)w.arms[j].rotation.x=-swing*.8;}}
