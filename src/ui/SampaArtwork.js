// Lightweight original vector artwork; no downloads or extra WebGL context.
export function sampaArtwork(){
 const buildings=Array.from({length:23},(_,i)=>{
  const x=i*51-20,h=75+(i*47%180),y=390-h,w=35+i%3*6;
  const windows=Array.from({length:Math.floor(h/22)-1},(_,row)=>Array.from({length:3},(_,col)=>`<path d="M${x+7+col*10} ${y+14+row*22}v10"/>`).join('')).join('');
  return `<g><path fill="${['#ddd5bc','#a8c0ba','#eee5cf','#c0bab6'][i%4]}" d="M${x} 405V${y}h${w}v${405-y}Z"/><path fill="#7c9994" d="m${x+w} ${y} 10 8v${397-y}h-10Z"/><g stroke="#617d7b" stroke-width="3">${windows}</g></g>`;
 }).join('');
 const trees=Array.from({length:15},(_,i)=>{const x=i*78,y=410+(i%3)*15;return `<g transform="translate(${x} ${y})"><path d="M0 22v-55m0 30-18-20m18 13 19-23"/><path fill="${['#98ad79','#c5bb72','#709b88'][i%3]}" d="M-29-33q-20-25 3-40 4-24 29-17 23-5 30 18 23 17 3 39-21 19-38 2-15 10-27-2Z"/></g>`}).join('');
 return `<svg class="sampa-art" viewBox="0 0 1200 850" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustração de uma corrida em São Paulo, com o MASP, o Obelisco, prédios e árvores">
 <defs><linearGradient id="sr-sky" x2="0" y2="1"><stop stop-color="#9bcacb"/><stop offset="1" stop-color="#f7deb0"/></linearGradient><pattern id="sr-grain" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".5" fill="#203832" opacity=".15"/></pattern></defs>
 <path fill="url(#sr-sky)" d="M0 0h1200v850H0z"/><circle cx="870" cy="175" r="96" fill="#f8df9b"/>
 <g fill="#f8f0da" stroke="#344d4b" stroke-width="1.5"><path d="M185 135q-20-25 17-32 13-35 49-12 33-18 49 15 36-2 37 29Z"/><path d="M677 78q-12-19 13-26 23-35 47-4 27-9 39 14 29-4 33 16Z"/><path d="M994 233q-13-18 11-28 16-32 46-7 26-10 38 17 31-5 35 18Z"/></g>
 <path d="M0 349Q160 237 302 340T596 315T907 332T1200 290V500H0Z" fill="#90aaa0" stroke="#526d67"/>
 <g stroke="#344d4b" stroke-width="1.4" stroke-linejoin="round">${buildings}
 <path fill="#f4e4c5" d="m907 375 13-201 8-38 8 38 13 201Z"/><path d="m928 136 8 38 13 201h-21Z" fill="#c4b89a"/>
 <path fill="#db7660" d="M609 449V323h18v126m234 0V323h18v126"/><path fill="#d65f4d" d="M600 324h288v17H600Z"/>
 
 <path fill="#a9b8ab" d="M630 342h228v65H630Z"/><path d="M630 365h228m-228 20h228m-200-43v65m29-65v65m29-65v65m29-65v65m29-65v65m29-65v65" fill="none"/>
 ${trees}
 <path fill="#d8ceb1" d="M0 460q510-38 1200 16v374H0Z"/>
 <path fill="#677a78" d="M660 450h115Q822 530 1200 646V850H40q622-218 620-400Z"/>
 <path d="M660 450Q687 614 40 850m735-400q47 80 425 196" stroke="#f6e9cb" stroke-width="10" fill="none"/>
 <path d="M716 468q-5 152-306 382" stroke="#f4dfad" stroke-width="6" stroke-dasharray="33 31" fill="none"/>
 <g transform="translate(707 520) scale(.52)">${car('#db866a')}</g>
 <g transform="translate(861 615) scale(.78)">${car('#a5bfaa')}</g>
 <g transform="translate(460 700) rotate(-9)">${car('#f3d594')}</g>
 <g stroke="#f8e9c8" stroke-width="3"><path d="m182 760-82 29m674-16 106 26m-717-58-64 22"/></g>
 <g transform="translate(1005 418) rotate(4)"><path d="M10 0v118m116-118v118" stroke-width="5"/><rect width="139" height="66" rx="4" fill="#466f63"/><text x="12" y="27" fill="#f8edce" stroke="none" font-family="sans-serif" font-size="15" font-weight="700">SÃO PAULO</text><text x="12" y="48" fill="#f8edce" stroke="none" font-family="sans-serif" font-size="12">A CIDADE É A PISTA →</text></g>
 </g><path fill="url(#sr-grain)" d="M0 0h1200v850H0z"/></svg>`;
}
function car(paint){return `<ellipse cy="101" rx="130" ry="27" fill="#263d3a" opacity=".25"/><g stroke="#263d3a" stroke-width="3" stroke-linejoin="round"><path fill="#293b3b" d="M-106 30h37v72q-18 16-37 0Zm170 0h38v72q-19 16-38 0Z"/><path fill="${paint}" d="m-112 65 7-83 27-74 132-9 46 65 13 101-16 27H-92Z"/><path fill="#364d4c" d="m-78-83 126-9 34 52-167 10Z"/><path fill="#b7cebf" d="m-64-76 100-6 24 35-133 7Z"/><path fill="#4e6863" d="m-64-76 14 36 110-7-24-35Z"/><path d="m-106 2 211-9m-173 18 144-5 5 58-151 5Z" fill="none"/><path fill="#d46755" d="m-106 5 43-2v23l-43 2Zm172-7 41-2 2 23-43 3Z"/><path fill="#344b49" d="m-108 65 221-5-12 22-198 6Z"/><path fill="#f8e8c9" d="M-26 34h58v20h-58Z"/><path d="m-84-96 125-8m-116 86 143-8" stroke-width="7"/><path fill="${paint}" d="M-115-31h-20v19h25m208-35h19v19h-16"/></g>`;}
