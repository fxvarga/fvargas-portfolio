// we have two identical dom trees A and B
// for domTree A we have the location of an element createa function to find the same element
// in domTreeB
// elements have parent
// parent going to have children
const { JSDOM } = require('jsdom');

// Create a simulated DOM environment
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.document = dom.window.document;

function reversePath( element, root){
  const pathArray = []
  let pointer = element;
  console.log(pointer.parent)
  while(pointer.parent !== null){
    const currentIndex = [...pointer.parent.children].indexOf(pointer)
    pathArray.push(currentIndex)
    pointer = pointer.parent
  }
  pointer = root
  while(pathArray.length>0){
    const currentIndex = pathArray.pop();
    pointer = pointer.children[currentIndex]
  }
  return pointer;
}
