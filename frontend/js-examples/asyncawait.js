//this emulates async await
function doWhenDataReceived(value){
  returnNextElement.next(value)
}
function* createFlow(){
  const data = yield fetch("http://www.google.com")
  console.log(data)
}
const returnNextElement = createFlow();
const futureData = returnNextElement.next();
futureData.then(doWhenDataReceived)

// here is the clean asyn await
async function myFun(){
  console.log("Me first")
  const data = await fetch("http://www.google.com")
  console.log(data)
}
myFun()
console.log("Me second")



