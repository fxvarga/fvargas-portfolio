// Problems
// --------
// reverse a string
// remove duplicates in a string
// flatten an array of arrays
// implement bind
// implement debounce
// implement throttle


function reverseFun(originalString){
  return originalString.split("").reverse().join("");
}
function removeDuplicates(originalString){
  let mySet = new Set(originalString.split(" "));
  return [...mySet].join(" ")
}
function removeDuplicateObjects(originalObject){
  let mySet = new Set(Object.entries(originalObject));
  return Object.fromEntries(mySet)
}
function flattenArray(originalArray){
  return originalArray.reduce((acc, value)=>{
    if(Array.isArray(value)){
      return acc.concat(flattenArray(value));
    } else{
      return acc.concat(value)
    }
  }, [])
}
Function.prototype.myBind  = function(context){
  fn = this;
  return function() {
    return fn.call(context)
  }
}
function debounce(fn, timer){
  let timeoutId = null
  return function(){
    if(timeoutId){
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(()=>{
      fn.apply(this,arguments);
      timeoutId = null
    },timer)

  }
}
function throttle(fn, timer){
  let timeoutId = null
  return function(){
    if(timeoutId){
      return
    }
    timeoutId = setTimeout(()=>{
      fn.apply(this,arguments);
      timeoutId = null
    },timer)

  }
}
const myString = "Hello";
console.assert(reverseFun(myString) == "olleH", "Test failed for reversing string")

const myDupString = "The test is going to to fail fail no more" ;
console.assert(removeDuplicates(myDupString) == "The test is going to fail no more",  "Test failed for removing dups from a string")

const myObject = {
  some:"key",
  some:"key",
  other:"key"
}
//need to stringify to check values else objects will compre reference
console.assert(JSON.stringify(removeDuplicateObjects(myObject)) == JSON.stringify({some:'key', other:'key'}))

const myArray = [1,2,3,[4,5,6],7,[8,[9,10]]]
const expectArray = [1,2,3,4,5,6,7,8,9,10]

console.assert(flattenArray(myArray).entries == expectArray.entries, `The test for flattening array failed ${flattenArray(myArray)} not ${myArray}` );

function foo(){
  return this.bar;
}
const baz = foo.myBind( {bar:23});
console.assert(baz() == 23, "Test failed to bind bar");

// we need to implement a function that will capture the last call within x ms
let tracker = 0;
let otherTracker = 0;
function myFun(x){
  tracker += x
}

function myOtherFun(x){
  otherTracker += x
}
const debouncedFn =  debounce(myFun, 100)

debouncedFn(1);
debouncedFn(10);
debouncedFn(8);

setTimeout(() =>{
  debouncedFn(2)
},120)
setTimeout(()=>{
  console.assert(tracker == 8, "Failed to test debounce");
},200)
// this works because of the event loop
setTimeout(()=>{
  console.assert(tracker == 10, "Failed to test debounce");
},300)

// we need to implement a funtion that will capture the first call within x ms
const throttledFn = throttle(myOtherFun,100)

throttledFn(1);
throttledFn(10);
throttledFn(8);

setTimeout(()=>{
  throttledFn(1000);
}, 120)
setTimeout(()=>{
  console.assert(otherTracker == 1, "failed to test throttle");
},200)
// this works because of the event loop
setTimeout(()=>{
  console.assert(otherTracker == 1001, "failed to test throttle");
},300)