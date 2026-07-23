const os = require("os"); //for platform, cpus, and totalmem. --- Node module, giving you information about the computer Node is running on: what platform it is (Mac/Windows/Linux), CPU details, memory
const path = require("path");
const fs = require("fs"); //for existsSync/mkdirSync --- Node's built-in modules, giving you tools to create, read, write, delete, and check files/folders on your computer

// sample-files folder already exist? If not, create it.
// fs.existsSync(path) → returns true/false, checking synchronously whether something exists at that path
// fs.mkdirSync(path, { recursive: true }) → creates the folder synchronously; recursive: true means it'll also create any missing parent folders along the way, and won't throw an error if the folder already exists
const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  //checks whether a file or folder exists at that path. Returns true or false
  fs.mkdirSync(sampleFilesDir, { recursive: true }); //creates a new folder (directory) at that path.
}

// OS module
console.log("Platform: ", os.platform());
console.log("CPU: ", os.cpus()[0].model);
console.log("Total Memory: ", os.totalmem());

// Path module
const joinedPath = path.join("sample-files", "folder", "file.txt"); // example file (does not exist) --- example which was just a demonstration string.

console.log("Joined path: ", joinedPath);
// fs.promises API
async function writeAndReadDemo() {
  const demoPath = path.join(sampleFilesDir, "demo.txt");
  try {
    //fs.promise --- It's manually wrapped fs.readFile in a new Promise(...) ourselves. With fs.promises, Node has already done that wrapping internally — you just call fs.promises.readFile(...) and it directly gives you back a Promise, ready to await or .then()
    await fs.promises.writeFile(demoPath, "Hello from fs.promises!");
    const content = await fs.promises.readFile(demoPath, "utf8");
    console.log("fs.promises read: ", content); // this line waits until writeFile finishes
  } catch (err) {
    console.log("fs.promise error", err.message);
  }
}

writeAndReadDemo();

// Streams for large files- log first 40 chars of each chunk
