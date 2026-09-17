import './landing.css';
export function showLanding(root){return new Promise(resolve=>{
 const el=document.createElement('section');el.className='title-screen';
 el.innerHTML='<header>CIDADE / DESERTO / PRAIA</header><div class="title-lines" aria-hidden="true"></div><main><span class="title-kicker">TRÊS CENÁRIOS. UM DESAFIO.</span><h1>SUV<br><em>CHALLENGE</em></h1><p>Escolha seu SUV. Conquiste seu lugar no grid.<br>Dispute as ruas, as dunas e a costa.</p><button type="button">ENTRAR NA GARAGEM <span>→</span></button><small>GARAGEM → CLASSIFICAÇÃO → CORRIDA</small></main><footer><span>SUV CHALLENGE TOUR</span><span>WASD / SETAS · DIRIGIR</span></footer>';
 root.append(el);const button=el.querySelector('button');button.onclick=()=>{el.remove();resolve();};button.focus();
});}
