import './touch-controls.css';

// Separate from keyboard state: releasing one input never releases the other.
export function touchControls(root, keys) {
  const panel=document.createElement('div');
  panel.className='touch-controls';
  panel.setAttribute('aria-label','Controles de corrida');
  panel.innerHTML='<div class="touch-steering"><button data-key="KeyA" aria-label="Virar à esquerda">◀</button><button data-key="KeyD" aria-label="Virar à direita">▶</button></div><div class="touch-pedals"><button data-key="ShiftLeft">TURBO</button><button data-key="Space">DERRAPAR</button><button data-key="KeyS">FREAR</button><button data-key="KeyW">ACELERAR</button></div>';
  root.append(panel);
  const pointers=new Map();
  const sync=()=>{
    for(const button of panel.querySelectorAll('button')){
      const active=[...pointers.values()].includes(button);
      keys[button.dataset.key]=active;
      button.classList.toggle('pressed',active);
      button.setAttribute('aria-pressed',String(active));
    }
  };
  const reset=()=>{pointers.clear();sync();};
  const release=e=>{pointers.delete(e.pointerId);sync();};
  for(const button of panel.querySelectorAll('button')){
    button.type='button';
    button.addEventListener('pointerdown',e=>{
      e.preventDefault();pointers.set(e.pointerId,button);
      button.setPointerCapture(e.pointerId);sync();
    });
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
    button.addEventListener('contextmenu',e=>e.preventDefault());
  }
  const visibility=()=>{if(document.hidden)reset();};
  const media=matchMedia('(any-pointer: coarse)');
  const change=()=>{panel.hidden=!media.matches;reset();};
  media.addEventListener('change',change);change();
  addEventListener('blur',reset);document.addEventListener('visibilitychange',visibility);
  return {dispose(){reset();media.removeEventListener('change',change);removeEventListener('blur',reset);document.removeEventListener('visibilitychange',visibility);panel.remove();}};
}
