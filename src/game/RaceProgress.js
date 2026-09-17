export const FINISH_T=0;
export function advanceProgress(previous,current){let delta=current-previous;if(delta<-.5)delta+=1;if(delta>.5)delta-=1;return delta;}
