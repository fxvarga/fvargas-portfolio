function createNewFunction(array){
  let  i = 0;
  function inner(){
    const element = array[i];
    i++;
    return element
  }
  return inner;
}
const createNextElement = createNewFunction([6,7,8,9])
// this works because of closures, which is that createNextElement
// has a "backpack" with surrounding variables
console.assert(createNextElement() === 6)
console.assert(createNextElement() === 7)
console.assert(createNextElement() === 8)
console.assert(createNextElement() === 9)


function createNewFlow(array){
  let i = 0;
  const inner = {
    next: ()=>{
      const element = array[i];
      i++;
      return element
    }
  }
  return inner;
}
const createNexElementFlow = createNewFlow([6,7,8,9])
console.assert(createNexElementFlow.next()=== 6)
console.assert(createNexElementFlow.next()=== 7)
console.assert(createNexElementFlow.next()=== 8)
console.assert(createNexElementFlow.next()=== 9)