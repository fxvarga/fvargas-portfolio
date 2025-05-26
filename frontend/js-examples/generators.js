function *createFlow(){
  yield 5
  yield 6
  yield 7
  yield 8
}
const returnNextElement = createFlow();
console.assert(returnNextElement.next() == 5)