import './landing.css';
import {sampaArtwork} from './SampaArtwork.js';
export function showLanding(root){return new Promise(resolve=>{
 document.title='Sampa Rush';
 const el=document.createElement('section');el.className='title-screen sampa-landing';
 el.innerHTML=`<div class="sampa-poster">${sampaArtwork()}</div><header><span class="sampa-mark">SR /</span><span>SÃO PAULO · BRASIL</span><span class="sampa-edition">CORRIDA ILUSTRADA</span></header><main><span class="title-kicker">ENTRE NO RITMO DA CIDADE</span><h1>SAMPA<br><em>RUSH<span>↗</span></em></h1><p class="sampa-tagline">A cidade é a pista.</p><p>Entre ladeiras, concreto e garoa.<br>Escolha seu carro. Encontre sua linha.</p><button type="button">ENTRAR NA GARAGEM <span>↗</span></button><small>01 GARAGEM <i>→</i> 02 CLASSIFICAÇÃO <i>→</i> 03 CORRIDA</small></main><footer><span>FEITO PARA SE PERDER NA CIDADE.<br><b>E SE ENCONTRAR NA CORRIDA.</b></span><span>${matchMedia('(any-pointer: coarse)').matches?'CONTROLES POR TOQUE · JOGUE NA HORIZONTAL':'WASD / SETAS · DIRIGIR · SHIFT / TURBO'}</span></footer>`;
 root.append(el);const button=el.querySelector('button');button.onclick=()=>{el.remove();resolve();};button.focus({preventScroll:true});
});}
