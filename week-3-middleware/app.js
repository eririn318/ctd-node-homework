const express = require("express");
const dogsRouter = require("./routes/dogs");
const path = require("path")
const {randomUUID} = require("crypto") //to create ID

const app = express();

// Assignment 3b and 3c ask you to add middleware in this file.

// built-in middleware
app.use(express.json()) // POST /adopt can read req.body
app.use("/images", express.static(path.join(__dirname, "public/images"))) // dog images can be served from week-3-middleware/public/images//__dirname is the file's actual location on disk(the absolute folder path of the file currently running)
//path.join combines path segments together correctly — handling slashes properly across different operating systems (Mac/Linux use /, Windows uses \)
//path.join takes __dirname (the folder app.js is in) and appends "public/images" onto the end of it, producing the full, correct absolute path — regardless of OS or what directory you ran the command from.

//__dirname = /Users/mac13/Desktop/CodeTheDream-2026/node-homework/week-3-middleware
//look for "public/images"
//request: GET http://localhost:3000/images/dachshund.png in postman
//get dachshund.png

// express.static() — serves outgoing files that already exist on disk
// It's for when a client makes a GET request asking for a file that already exists in your project folder (like an image), and Express just reads that file off disk and sends it back as the response.




//request ID middleware — custom middleware
app.use((req,res,next)=>{
  req.requestId = randomUUID()//Generate a random unique ID, and store it as a new property (requestId) directly on the req object.
  res.setHeader("X-Request-Id", req.requestId)
  next()
})
// 1.someone request GET /dogs
// 2.req.requestId = randomUUID() runs → a new random ID is generated and attached to req
// 3.res.setHeader("X-Request-Id", req.requestId) runs → that ID gets queued as a header on the (still unfinished) response
// 4.next() is called → control moves to whatever's registered next (logging middleware, then eventually the /dogs route handler
// 5.Eventually the /dogs route handler runs, sends the actual response (e.g., res.json(dogs)in dogs.js-dogs is dog data) → THIS is when the response, including that queued X-Request-Id header, actually gets sent back over the network to postman (dog data and header generated id send back to postman)

// req is the same shared object passed through the entire chain for that one request — every middleware and route handler that runs afterward can read req.requestId and get the exact same ID value.
// all .req.requestId below is same ID


app.use((req, res, next) => {
  const timeStamp = new Date().toISOString()
  console.log(`[${timeStamp}]: ${req.method} ${req.url} (${req.requestId})`)
  next()
 })

app.use("/", dogsRouter);// Do not remove this line

`if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}`

// 404 handler — catches any request that didn't match a real route
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    requestId: req.requestId
  })})
// Error handler — must be LAST, and must have 4 parameters
// A route matched, but something failed while processing it
app.use((err, req, res, next) => {//error-handling middleware specifically counting 4 parameter(err, req, res, next)
  res.status(500).json({
    error: "Internal Server Error",
    requestId: req.requestId
  })
})

module.exports = app;

// express.json() → incoming JSON data (like form fields, text data) → parses it → available on req.body.
// express.static() → outgoing static files (images, CSS, etc.) already stored in your project → serves them directly when requested by URL.

// The structure that makes something "middleware"
// jsapp.use((req, res, next) => {
//   // whatever goes here
// });

// custom middlware:
// app.use((req, res, next) => { //whatever you write inside
//   console.log(req.method, req.url);
//   next();
// });

//built-in middleware:Express wrote the code inside the { } for you. You never see it; you just call the function express.json()