
const somePromise = new Promise((resolve, reject)=>{
  let myVal = 10
  setTimeout(()=>{
    myVal +=100
    resolve(myVal)
  })
})

const assertVal = 110;
let myVal = somePromise.then((value)=>{
  console.assert(value === assertVal );
})


let newMyal = await somePromise
console.log(newMyal)