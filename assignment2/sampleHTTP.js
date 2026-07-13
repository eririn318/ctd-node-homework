const http = require("http")
// Without http, your JavaScript file would have no way to receive network requests at all — it'd just be a script that runs and exits


//#1 t builds a server object and hands it back to you (stored in server)
// this function runs every time someone makes a request
const server = http.createServer((req, res) =>{//call createServer, get back a server object
if (req.method === "GET" && req.url === "/time") {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      time: new Date().toString(),
    }),
  );
} else if (req.method === "GET" && req.url === "/timePage") {
  const htmlString = `
<!DOCTYPE html>
<html>
<body>
<h1>Clock</h1>
<button id="getTimeBtn">Get the Time</button>
<p id="time"></p>
<script>
document.getElementById('getTimeBtn').addEventListener('click', async () => {
  const res = await fetch('/time');
  const timeObj = await res.json();
  console.log(timeObj);
  const timeP = document.getElementById('time');
  timeP.textContent = timeObj.time;
});
</script>
</body>
</html>
`;
  res.writeHead(200, { "Content-type": "text/html; charset=utf-8" });
  res.end(htmlString);//.end is how you finish and send that response.
}else if (req.method === "POST" && req.url === "/echo"){
    let body  = "" //start with an empty string. This will accumulate the incoming data as it streams in.
    //"data" is an event that fires when you get a postman request
    req.on("data", (chunk) => {//chunk is the parameter that receives whatever data came with that particular "data" event — in this case, a piece of the raw bytes/string being sent.
        body += chunk//e.g. body becomes '{"message":"Hello from Postman"}' 
    } )
    req.on("end", () =>{

        const parseBody = JSON.parse(body)//body is currently just a raw string (e.g. '{"message":"Hello from Postman"}'). JSON.parse converts that string into an actual JS object you can work with.
        // now { "message":"Hello from Postman" } as a real object
        res.writeHead(200, {"Content-Type": "application/json"})
        res.end(
        //end is the receiving side (Node) recognizing "the request is fully received" and notifying your listener.
        // build the response object, wrapping the parsed body inside a weReceived key, then convert that back into a string (since res.end() needs a string, not an object) to send back.
        JSON.stringify(
            { "weReceived": parseBody })//build response object → convert to string → send to Postman
            //sends '{"weReceived":{{"message":"Hello from Postman"}}' to postman
    )
})  
}
})

// #2 start the server
const port = 8000
server.listen(8000)//call .listen() on that server object, to start the server
console.log(`Server running on port ${port}`)


// chunk is a piece (or the whole, if it's small) of whatever you typed into the Postman request body.
// When you type this into Postman's body field:
// json{"message": "Hello from Postman"}
// And hit Send, Postman sends that as raw data over the network to your server. Node receives it as a stream and fires "data" events as pieces arrive — each piece is a chunk.

// "data" part
// receives (pieces of) the Postman request
// req.on("data", (chunk) => { body += chunk; }) collects the incoming request body from Postman, possibly across multiple chunks, accumulating it into the body string.


// "data" and "end" is Node
// "data" eventFired by Node, automatically, as pieces of the request body arrive
// "end" eventFired by Node, automatically, once the request body is fully received