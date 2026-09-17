import * as T from 'three';
import {beachBenchmark} from './BeachBenchmark.js';
const rand=n=>{const x=Math.sin(n*127.1+78.23)*43758.5453;return x-Math.floor(x);};
export class ScenicEnvironment{
 constructor(scene,track,theme){this.group=new T.Group();scene.add(this.group);this.track=track;this.theme=theme;this.footprints=[];this.samples=Array.from({length:1800},(_,i)=>track.curve.getPointAt(i/1800));this.materials=new Map();
  const ground=this.mesh(new T.PlaneGeometry(6500,6500),theme==='desert'?0xcda86e:0xd6c393);ground.rotation.x=-Math.PI/2;ground.position.y=-.025;
  if(theme==='desert'){this.desert();this.dawnSky();}else this.beach();this.furniture();
 }
 mat(color){if(!this.materials.has(color))this.materials.set(color,new T.MeshStandardMaterial({color,roughness:.85}));return this.materials.get(color);}
 mesh(geometry,color,parent=this.group){const m=new T.Mesh(geometry,this.mat(color));m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 box(w,h,d,x,y,z,c,parent=this.group){const m=this.mesh(new T.BoxGeometry(w,h,d),c,parent);m.position.set(x,y,z);return m;}
 clear(x,z,r){return this.samples.every(p=>(p.x-x)**2+(p.z-z)**2>(this.track.width/2+r+8)**2);}
 place(x,z,r,build){if(!this.clear(x,z,r))return;const g=new T.Group();g.position.set(x,0,z);this.group.add(g);this.footprints.push({x,z,r});build(g);}
 desert(){
  for(let i=0;i<150;i++){const x=(rand(i)-.5)*2200,z=(rand(i+200)-.5)*2200,r=14+rand(i+400)*50;this.place(x,z,r,g=>{const dune=this.mesh(new T.SphereGeometry(r,16,8,0,Math.PI*2,0,Math.PI/2),i%3?0xd4ad72:0xbe8853,g);dune.scale.y=.12+rand(i+17)*.28;});}
  for(let i=0;i<100;i++){const x=(rand(i+900)-.5)*1900,z=(rand(i+1100)-.5)*1900,r=3+rand(i+1200)*12;this.place(x,z,r,g=>{const rock=this.mesh(new T.DodecahedronGeometry(r,0),i%2?0x9d6343:0xb37950,g);rock.scale.y=1+rand(i+40)*2;rock.position.y=r*.5;});}
  for(let i=0;i<32;i++){const a=i/32*Math.PI*2,x=Math.cos(a)*1400,z=Math.sin(a)*1400;const mesa=this.mesh(new T.CylinderGeometry(45,85,75+i%5*18,7),0xa66d4e);mesa.position.set(x,30,z);}
  for(let i=0;i<140;i++){const f=this.track.frame(i/140),p=f.p.clone().addScaledVector(f.n,(i%2?1:-1)*(20+rand(i)*60));this.place(p.x,p.z,2,g=>{this.box(.35,3.4,.4,0,1.7,0,0x527048,g);for(const side of [-1,1]){this.box(1,.25,.3,side*.5,1.6,0,0x527048,g);this.box(.25,1.2,.3,side*.9,2.05,0,0x527048,g);}});}
 }
 palm(g){const points=[new T.Vector3(0,0,0),new T.Vector3(.1,2,0),new T.Vector3(.5,4,0),new T.Vector3(.9,6,0)];this.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),10,.17,6,false),0x79634a,g);
  for(let j=0;j<8;j++){const a=j*Math.PI/4,positions=[],indices=[];for(let k=0;k<=8;k++){const t=k/8,r=t*3.1,width=Math.sin(t*Math.PI)*.48;for(const s of [-1,1])positions.push(.9+Math.cos(a)*r-Math.sin(a)*width*s,6+Math.sin(t*Math.PI)*.7-t*.8,Math.sin(a)*r+Math.cos(a)*width*s);if(k<8){const q=k*2;indices.push(q,q+1,q+2,q+1,q+3,q+2);}}const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();const leaf=this.mesh(geometry,j%2?0x527b3b:0x366941,g);leaf.material.side=T.DoubleSide;}
 }
 dawnSky(){const sky=new T.Mesh(new T.SphereGeometry(2400,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 dir;
void main(){
 vec3 d=normalize(dir);
 vec3 c=mix(vec3(.92,.57,.37),vec3(.22,.29,.49),smoothstep(-.04,.65,d.y));
 float sun=smoothstep(.99965,.9999,dot(d,normalize(vec3(-110.,24.,-190.))));
 gl_FragColor=vec4(mix(c,vec3(1.,.85,.57),sun),1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`}));sky.castShadow=false;sky.receiveShadow=false;this.group.add(sky);}
 beach(){
  const ocean=new T.Mesh(new T.PlaneGeometry(4000,6500),new T.MeshPhysicalMaterial({color:0x279ca9,roughness:.24,metalness:.12,clearcoat:.5}));ocean.rotation.x=-Math.PI/2;ocean.position.set(2465,-.015,0);ocean.receiveShadow=true;this.group.add(ocean);
  for(let i=0;i<5;i++){const surf=this.box(2.5,.009,6000,468+i*4,.002,0,i%2?0x86c9c5:0xc6e5d9);surf.castShadow=false;}
  for(let i=0;i<120;i++){const x=i%2?444:420,z=-900+Math.floor(i/2)*30;if(z>=-255&&z<=125)continue;this.place(x,z,4,g=>this.palm(g));}
  for(let i=0;i<38;i++){const z=-620+i*34;this.place(451,z,4,g=>{const umbrella=this.mesh(new T.ConeGeometry(2.5,1,10),[0xe8ece0,0xe49b52,0x599cbe][i%3],g);umbrella.position.y=2.8;this.box(.06,2.4,.06,0,1.2,0,0xd0b98b,g);this.box(.8,.15,2.1,1,.25,0,0xf4e5c0,g);});}
  // Regular inland blocks, with service streets between rows. Never build east of the promenade.
  for(let row=0;row<28;row++)for(let col=0;col<18;col++){
   const x=360-col*55,z=-1050+row*78,i=row*18+col;
   if(x>280&&z> -275&&z<150)continue;
   this.place(x,z,24,g=>{
    const h=12+Math.floor(rand(i+90)*7)*3,w=22+rand(i)*8,d=24;
    const facade=[0xd9d3c3,0xb6c4c2,0xe4dacc,0xbdc3cd][i%4];
    this.box(w,h,d,0,h/2,0,facade,g);
    this.box(w+1,.4,d+1,0,h,0,0x777d7d,g);
    this.box(w+5,.12,d+5,0,.03,0,0xb0aaa0,g);
    for(let floor=0;floor<Math.floor(h/3)-1;floor++)for(let j=-2;j<=2;j++){
     for(const side of [-1,1])this.box(2,1.6,.08,j*4,4.4+floor*3,side*(d/2+.05),0x426473,g);
    }
    for(const side of [-1,1]){
     this.box(w-2,2.5,.09,0,1.5,side*(d/2+.06),0x334e56,g);
     this.box(w, .5,1.4,0,3.1,side*(d/2+.5),[0x327c83,0xb26449,0xd3ae65][i%3],g);
    }
   });
  }
 }
 furniture(){if(this.theme==='beach')beachBenchmark(this);for(let i=0;i<100;i++){const f=this.track.frame(i/100);for(const side of [-1,1]){const p=f.p.clone().addScaledVector(f.n,side*(this.track.width/2+10));this.place(p.x,p.z,.2,g=>{this.box(.15,.9,.15,0,.45,0,0xf4eee0,g);this.box(.18,.2,.18,0,.72,0,0x514e48,g);});}}}
}
