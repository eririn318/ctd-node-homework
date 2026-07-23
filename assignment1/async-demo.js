const fs = require("fs"); //Node's built-in file system module. It gives you tools like readFile, writeFile, etc., to interact with files on your computer
const path = require("path"); //Node's built-in path module. It helps you build file paths safely, without worrying about differences between operating systems (like / on Mac/Linux vs \ on Windows)

// Write a sample file for demonstration
const filePath = path.join(__dirname, "sample-files", "sample.txt");

// path.join(__dirname, 'sample-files', 'sample.txt')
// produces:
// /Users/erikos/node-homework/assignment1/sample-files/sample.txt

// path.join(__dirname, 'sample-files', 'sample.txt')
// This combines pieces into one full, correct file path. Let's break down each argument:

// __dirname → the folder your current script (async-demo.js) lives in. We covered this earlier — it's Node's built-in variable for "where am I right now."
// 'sample-files' → the name of the folder you want to go into
// 'sample.txt' → the name of the file you want to create/read inside that folder

//creates the file at that path (or overwrites it if it already exists), and writes the text 'Hello, async world!' into it.
//writeFileSync = the synchronous version of writing a file — meaning it finishes completely before your code moves to the next line, unlike the async

// Why we specifically chose writeFileSync here:
// Since we need sample.txt to definitely exist before our callback/promise/async-await examples try to read it, using the synchronous version guarantees the file is fully written before any code below it runs. If we used the async version instead, there's a small risk the read attempts could start before the write finishes (since async operations don't block)
fs.writeFileSync(filePath, "Hello, async world!");

// 1. Callback style
fs.readFile(filePath, "utf8", (err, data) => {
  //utf8 is the encoding — it tells Node how to interpret the raw bytes in the file and turn them into readable text.
  if (err) {
    console.log("Callback error", err.message);
    return;
  } else {
    console.log("Callback read", data);
  }
});

//call back part:
// (err, data) => {
//   console.log('Callback read:', data);
// }
// It's the function being passed into fs.readFile, to be run later, once the file has actually finished being read. fs.readFile is the "outer" function — it starts the file-reading process, and when it's done, it calls your callback function and hands it two values:

// err → if something went wrong (e.g., file doesn't exist), this holds the error info; otherwise it's null
// data → the actual file contents (as a string, since we specified 'utf8')

// Callback hell example (test and leave it in comments):

/*
Callback Hell Example:
If we needed to read multiple files in sequence using callbacks,
we'd have to nest each new operation inside the previous callback:

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) return console.log(err);
  fs.readFile(anotherFile, 'utf8', (err, data2) => {
    if (err) return console.log(err);
    fs.readFile(thirdFile, 'utf8', (err, data3) => {
      if (err) return console.log(err);
      console.log(data, data2, data3);
    });
  });
});

This nested structure is called "callback hell" — each new async step
adds another layer of indentation, making the code hard to read,
hard to maintain, and hard to handle errors consistently.
*/

// 2. Promise style
function readFilePromise(filePath) {
  //(resolve, reject) is parameter, filled in by JAVASCRIPT (from the Promise constructor)
  return new Promise((resolve, reject) => {
    //Promise is JavaScript
    //new Promise(...) is created immediately, and its logic starts running right away.
    // Inside that Promise, we call fs.readFile, passing it a callback:
    fs.readFile(filePath, "utf8", (err, data) => {
      //fs.readFile — this IS from Node //This is the actual built-in function, part of the fs module. It's the thing doing the real work of reading the file, and it uses the old callback style: (err, data) => {...}.
      //(err,data) is parameter
      // fs.readFile tries to read sample.txt
      // if it fails -> err gets the error info, data stays empty
      // if it succeeds -> data gets the file's text content ("Hello, async world!"), err stays null
      if (err) {
        // If the file read fails:
        // -> err gets filled in by Node (with the error info)
        // -> we then call reject(err), which makes the Promise "rejected"
        reject(err);
        return;
      }
      //  If the file read succeeds:
      // -> data gets filled in by Node (with the file's contents)
      // -> we then call resolve(data), which makes the Promise "fulfilled"
      resolve(data);
    });
  });
}

readFilePromise(filePath) //calling function
  //after the function call
  .then((data) => {
    //.then(...) → runs only when the Promise was resolved — and the data you see inside .then() is exactly what was passed into resolve(data)
    console.log("Promise read:", data);
  })
  .catch((err) => {
    //.catch(...) → runs only when the Promise was rejected — and the err you see inside .catch() is exactly what was passed into reject(err)
    console.log("Promise error:", err.message);
  });

// 3. Async/Await style
async function readFileAsync() {
  try {
    const data = await readFilePromise(filePath);
    console.log("Async/Await read:", data);
  } catch (err) {
    console.log("Async/Await error:", err.message);
  }
}

readFileAsync();

// fs.writeFile(...) → asynchronous version (needs a callback, doesn't block, continues running other code while it works)
// fs.writeFileSync(...) → synchronous version (blocks/pauses everything until the write is fully done, then moves to the next line)

//====err, data (values) are passed as arguments into resolve/reject (functions)===
// function sayHello(name) {
//   console.log('Hello, ' + name);
// }

// sayHello('Eriko'); // calling a normal function

// new Promise((resolve, reject) => {
//   reject(err); // calling reject — same exact concept, just resolve/reject came in as parameters instead of being declared with `function`
// });
