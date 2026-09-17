import './style.css';
import './illustrated.css';
import * as T from 'three';
import {Game} from './game/Game.js';
import {showMainMenu} from './ui/MainMenu.js';
import {showLanding} from './ui/Landing.js';
import {buildTerrainCity} from './street-study/TerrainCity.js';
import {paleStyle} from './street-study/PaleStyle.js';
import {ILLUSTRATED_VEHICLES,loadIllustratedVehicle} from './vehicles/IllustratedCatalog.js';
import {inkComposer} from './street-study/InkComposer.js';
import {fineWireframe} from './street-study/FineWireframe.js';
import {illustratedHorizon} from './street-study/IllustratedHorizon.js';
import {turboWind} from './ui/TurboWind.js';
import {cityWeather} from './street-study/CityWeather.js';
import {spinWheels} from './vehicles/WheelPivots.js';
const root=document.querySelector('#app');document.body.classList.add('pale-edition');
async function launch(){
 root.replaceChildren();const selection=await showMainMenu(root,{illustrated:true,styleModel:model=>{paleStyle(model);fineWireframe(model).set(true);},vehicles:ILLUSTRATED_VEHICLES,loadVehicle:loadIllustratedVehicle,createComposer:inkComposer});
 selection.illustrated=true;
 selection.loadVehicle=loadIllustratedVehicle;
 selection.rivalPool=Object.keys(ILLUSTRATED_VEHICLES).map((id,i)=>[id,[0xffffff,0xeed2cc,0xd4e3d0,0xd3e1ed,0xe0d8ec][i%5]]);
 selection.stats={...selection.stats,gentleSteering:true};
 selection.environmentFactory=(scene,track)=>{
  const environment={group:new T.Group(),illustrated:true};
  scene.userData.environmentReady=buildTerrainCity(scene,track).then(city=>{environment.group=city.group;scene.userData.illustratedCity=city;});
  return environment;
 };
 selection.styleScene=game=>{
  paleStyle(game.scene);game.renderer.toneMapping=T.NoToneMapping;game.scene.environment=null;
  game.composer.dispose();game.composer=inkComposer(game.renderer,game.scene,game.camera);
  fineWireframe(game.scene).set(true);
  illustratedHorizon(game.scene);
  const inkToggle=document.createElement('button');inkToggle.textContent='CONTORNOS: ON';inkToggle.style.cssText='position:absolute;bottom:12px;right:12px;z-index:25;padding:8px;font:12px system-ui';inkToggle.onclick=()=>{const pass=game.composer.passes[1];pass.enabled=!pass.enabled;inkToggle.textContent='CONTORNOS: '+(pass.enabled?'ON':'OFF');};game.root.append(inkToggle);
  game.scene.background=new T.Color('#95c8e5');game.scene.fog=new T.Fog('#b3d1dc',420,1600);game.camera.far=Math.max(game.camera.far,2400);game.camera.updateProjectionMatrix();
  const wind=turboWind(game.root),render=game.composer.render.bind(game.composer);game.composer.render=(...args)=>{const active=game.controller.boosting&&!game.finished;game.composer.setTurbo?.(active?1:0);wind.set(active);return render(...args);};
  game.sun.color.set('#fff2db');game.sun.intensity=1.5;game.sunOffset.set(-65,95,-70);
  game.scene.children.filter(o=>o.isHemisphereLight).forEach(o=>{o.color.set('#e7eef0');o.groundColor.set('#9b9889');o.intensity=.65;});
  const weather=cityWeather(game,selection.timeOfDay==='night');
  game.scene.userData.illustratedUpdate=dt=>{game.scene.userData.illustratedCity?.update(dt,game.camera);weather.update(dt);spinWheels(game.player,game.controller.speed*dt);};
  game.scene.userData.illustratedUpdate(0);
 };
 const game=new Game(root,selection,launch);game.start();
}
const landing=showLanding(root);
root.querySelector('.title-screen header').textContent='SÃO PAULO / EDIÇÃO ILUSTRADA';
root.querySelector('.title-kicker').textContent='UMA CIDADE. UMA NOVA PERSPECTIVA.';
root.querySelector('.title-screen main p').textContent='Tons suaves. Disputas intensas. Escolha seu SUV e conquiste seu lugar no grid.';
landing.then(launch);
