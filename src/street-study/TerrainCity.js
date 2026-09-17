import * as T from 'three';
import {buildIllustratedCity} from './IllustratedCity.js';
import {terrainStudyField} from './TerrainStudyField.js';
import {STUDY_SIZE,STUDY_SEGMENTS,planStudyStreets,planStudyInfill,studyStreetMesh,studyInfill} from './TerrainNeighborhoods.js';
import {terrainTrees} from './TerrainTrees.js';

export async function buildTerrainCity(scene,track){
 const city=await buildIllustratedCity(scene,track),streets=planStudyStreets(city.plan),lots=planStudyInfill(city.plan,streets),plan={...city.plan,plots:[...city.plan.plots,...lots]},field=terrainStudyField(plan,track.width);
 const matrix=new T.Matrix4(),position=new T.Vector3(),scale=new T.Vector3(),rotation=new T.Quaternion();
 city.group.traverse(o=>{
  if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);
   // Replace only the old background plane and disconnected side-road tiles.
   if((scale.x>2000&&scale.z>2000)||(Math.abs(scale.y-.015)<.0001&&scale.x>=10&&scale.z>=10)){scale.set(0,0,0);matrix.compose(position,rotation,scale);}
   else matrix.elements[13]+=field.height(position.x,position.z);
   o.setMatrixAt(i,matrix);
  }o.instanceMatrix.needsUpdate=true;o.computeBoundingSphere();}
  else if(o.parent===city.group&&o.isGroup)o.position.y+=field.height(o.position.x,o.position.z);
 });
 const geometry=new T.PlaneGeometry(STUDY_SIZE,STUDY_SIZE,STUDY_SEGMENTS,STUDY_SEGMENTS).rotateX(-Math.PI/2),p=geometry.attributes.position;
 for(let i=0;i<p.count;i++)p.setY(i,field.height(p.getX(i),p.getZ(i))-.1);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const terrain=new T.Mesh(geometry,new T.MeshStandardMaterial({color:'#8ea67e',roughness:1}));terrain.name='Hilly São Paulo terrain';terrain.receiveShadow=true;
 const roads=studyStreetMesh(streets,field),infill=studyInfill(lots,field),groves=terrainTrees(city.plan,streets,lots,field,city.group.userData.treePositions);
 roads.update(1);infill.update(1);groves.update(1);city.group.add(terrain,roads.mesh,infill.group,groves.group);
 city.plan=plan;city.terrainField=field;city.stats={...city.stats,infillLots:lots.length,extraTrees:groves.trees.length,streetCells:streets.roads.size};city.group.userData.cityStats=city.stats;
 return city;
}
