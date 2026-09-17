import * as T from 'three';
export function illustratedHorizon(scene){
 const group=new T.Group();group.name='Horizon and ink clouds';scene.add(group);
 const cloudGeometry=new T.IcosahedronGeometry(1,1),edges=new T.WireframeGeometry(cloudGeometry),cloudMaterial=new T.MeshBasicMaterial({color:'#fff3df',fog:false}),lineMaterial=new T.LineBasicMaterial({color:0x000000,transparent:true,opacity:.28,fog:false});
 for(let i=0;i<24;i++){const a=i*2.39996,r=680+(i%4)*140,cluster=new T.Group();cluster.position.set(Math.cos(a)*r,150+(i%5)*30,Math.sin(a)*r);
  for(let j=0;j<4;j++){const cloud=new T.Mesh(cloudGeometry,cloudMaterial);cloud.position.set(j*27-40,Math.sin(j*2+i)*9,Math.cos(j+i)*13);cloud.scale.set(29+j%2*12,14+j%3*4,22);cloud.add(new T.LineSegments(edges,lineMaterial));cluster.add(cloud);}group.add(cluster);
 }
 const hillGeo=new T.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI/2),hills=new T.MeshStandardMaterial({color:'#8baba4',roughness:1});
 for(let i=0;i<34;i++){const a=i/34*Math.PI*2,h=55+(i%7)*11,mesh=new T.Mesh(hillGeo,hills);mesh.position.set(Math.cos(a)*1060,-6,Math.sin(a)*1060);mesh.scale.set(170+i%3*35,h,160+i%4*20);group.add(mesh);}
 return group;
}
