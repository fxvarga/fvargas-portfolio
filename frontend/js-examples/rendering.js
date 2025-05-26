const raf = require('raf');
//requestAnimationFrame
function moveElement(duration, distance, element){
  const start = performance.now();
  function move(currentTime){
    const elapsed = currentTime - start;
    const progress  = elapsed / duration;
    const amountToMove = progress*distance;
    console.log(`Moving ${amountToMove}`)
    if(amountToMove<distance){
      raf(move)
    }
  }
  raf(move)
}
moveElement(3000, 1000, {})