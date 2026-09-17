// Separating-axis test for two ground-plane oriented vehicle rectangles.
export function vehicleContact(a,b){
 const axes=o=>[{x:Math.cos(o.rotation.y),z:-Math.sin(o.rotation.y)},{x:Math.sin(o.rotation.y),z:Math.cos(o.rotation.y)}];
 const aa=axes(a),bb=axes(b),ha=a.userData.hitbox||{width:1.85,length:4.4},hb=b.userData.hitbox||{width:1.85,length:4.4},delta={x:a.position.x-b.position.x,z:a.position.z-b.position.z};
 let overlap=Infinity,normal;
 for(const n of [...aa,...bb]){const dot=(u,v)=>u.x*v.x+u.z*v.z,ra=Math.abs(dot(n,aa[0]))*ha.width/2+Math.abs(dot(n,aa[1]))*ha.length/2,rb=Math.abs(dot(n,bb[0]))*hb.width/2+Math.abs(dot(n,bb[1]))*hb.length/2,d=dot(delta,n),depth=ra+rb-Math.abs(d);if(depth<=0)return null;if(depth<overlap){overlap=depth;normal={x:n.x*(d<0?-1:1),z:n.z*(d<0?-1:1)};}}
 return {overlap,normal};
}
