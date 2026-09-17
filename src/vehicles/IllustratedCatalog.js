import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {prepareVehicle} from './prepareVehicle.js';
import {applyAtlasPaint} from './AtlasPaint.js';
import {wheelPivots} from './WheelPivots.js';
export const ILLUSTRATED_VEHICLES={
 defender:{name:'Defender 90',className:'4×4 · ILUSTRADO',url:new URL('../assets/range-rover-ccby.glb',import.meta.url).href,length:4.55,topSpeed:51.8,acceleration:15.6,handling:.88},
 bairro:{name:'Bairro 4×4',className:'SUV · LOW POLY',url:new URL('../assets/illustrated-cars/bairro.glb',import.meta.url).href,length:4.65,topSpeed:52,acceleration:17,handling:.92},
 picape:{name:'Sertão',className:'PICAPE · LOW POLY',url:new URL('../assets/illustrated-cars/picape.glb',import.meta.url).href,length:4.8,topSpeed:52,acceleration:16,handling:.9},
 avenida:{name:'Avenida',className:'SUV · LOW POLY',url:new URL('../assets/illustrated-cars/avenida.glb',import.meta.url).href,length:4.85,topSpeed:55,acceleration:16,handling:.86},
 expedicao:{name:'Expedição',className:'PICAPE · LOW POLY',url:new URL('../assets/illustrated-cars/expedicao.glb',import.meta.url).href,length:4.95,topSpeed:53,acceleration:16,handling:.87},
 passeio:{name:'Passeio',className:'SEDÃ · LOW POLY',url:new URL('../assets/illustrated-cars/passeio.glb',import.meta.url).href,length:4.5,topSpeed:54,acceleration:17,handling:.94},
 esporte:{name:'Horizonte',className:'COUPÉ · LOW POLY',url:new URL('../assets/illustrated-cars/esporte.glb',import.meta.url).href,length:4.45,topSpeed:56,acceleration:18,handling:.95},
 bus:{name:'Circular SP',className:'ÔNIBUS · RGSDEV',url:new URL('../assets/illustrated-cars/bus.glb',import.meta.url).href,length:8.4,topSpeed:46,acceleration:12,handling:.8,bodyPaint:true},
 van:{name:'Expresso Van',className:'VAN · RGSDEV',url:new URL('../assets/illustrated-cars/van.glb',import.meta.url).href,length:5.2,topSpeed:51,acceleration:15,handling:.87,bodyPaint:true}
};
const cache=new Map(),loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
export async function loadIllustratedVehicle(id,color=0xffffff){const def=ILLUSTRATED_VEHICLES[id]||ILLUSTRATED_VEHICLES.defender;if(!cache.has(def.url))cache.set(def.url,loader.loadAsync(def.url));const asset=await cache.get(def.url);const root=applyAtlasPaint(prepareVehicle(asset.scene,def,color),color,def.url);wheelPivots(root);return root;}
