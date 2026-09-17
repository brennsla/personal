import * as THREE from 'three';

export function prepareVehicle(source,definition,color){
 const model=source.clone(true);if(definition.removeBakedShadow){const removed=[];model.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)&&/^shadow$/i.test(o.material.name))removed.push(o);});removed.forEach(o=>o.removeFromParent());}model.rotation.y=Math.PI;model.updateMatrixWorld(true);
 let bounds=new THREE.Box3().setFromObject(model,true),size=bounds.getSize(new THREE.Vector3());
 // All vehicles face -Z; some source assets have their long axis along X.
 if(size.x>size.z){model.rotation.y+=Math.PI/2;model.updateMatrixWorld(true);bounds.setFromObject(model,true);size=bounds.getSize(new THREE.Vector3());}
 model.scale.setScalar((definition.length||4.55)/size.z);model.updateMatrixWorld(true);
 bounds.setFromObject(model,true);const center=bounds.getCenter(new THREE.Vector3());
 model.position.set(-center.x,-bounds.min.y,-center.z);
 model.updateMatrixWorld(true);
 const paintMaterials=[],tint=new THREE.Color(color);
 model.traverse(o=>{
  if(!o.isMesh)return;o.castShadow=o.receiveShadow=true;
  const original=Array.isArray(o.material)?o.material:[o.material];
  const materials=original.map(m=>{
   const copy=m.clone(),name=`${o.name} ${m.name}`.toLowerCase();
   const blocked=/glass|window|tyre|tire|wheel|rubber|lamp|light|chrome|interior|seat|dashboard|grill|carbon|trim/.test(name);
   if(definition.bodyPaint&&/body/.test(m.name)&&!/black|white/.test(m.name)){
    const base=m.color.clone(),control=new THREE.Color();const set=control.set.bind(control);control.set=value=>{set(value);copy.color.copy(control.equals(new THREE.Color(0xffffff))?base:control);return control;};control.set(tint);paintMaterials.push({color:control});
   }else if(copy.userData.paintAtlasColor){
    copy.color.set(0xffffff);const control=new THREE.Color(color);copy.userData.paintTint=control;paintMaterials.push({color:control});
   }else if(!blocked&&copy.color){
    // Standard material tint multiplies the original base color and texture.
    // Keep the source material and its maps untouched; white restores its exact base color.
    const base=m.color.clone(),control=new THREE.Color();
    const set=control.set.bind(control);
    control.set=(value)=>{set(value);copy.color.copy(base).multiply(control);return control;};
    control.set(tint);
    paintMaterials.push({color:control});
   }
   return copy;
  });o.material=Array.isArray(o.material)?materials:materials[0];
 });
 const root=new THREE.Group();root.add(model);root.updateMatrixWorld(true);
 bounds.setFromObject(root,true);size=bounds.getSize(new THREE.Vector3());
 // Do not rotate unverified source wheel pivots: that moves tires off the ground.
 root.wheels=[];root.userData.vehicle=definition;root.userData.paintMaterials=paintMaterials;
 root.userData.hitbox={width:size.x*.94,length:size.z*.97};
 root.userData.dimensions=size.toArray();return root;
}
