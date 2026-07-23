const EventEmitter = require("events")
const emitter = new EventEmitter()
//Node looks at all the listeners registered for "time" (via .on("time", ...)) and calls each of them synchronously, immediately, passing currentTime in as the argument. 
//A listener is just a function that you tell Node: "run this function later, when a specific event happens."
//emitter.on(...) — registering the listener
emitter.on("time", (message)=> {
    console.log("Time received:", message)
})

if (require.main === module) {
// This checks: if require.main === module is a Node.js pattern that checks: "is this file being run directly (like node events.js), or is it being imported by another file?"

// Run node assignment2/events.js directly → require.main === module is true.
// Some other file does require("./events") → require.main === module is false.

    setInterval(() => {//grabs the current date/time as a readable string, e.g. "Thu Jul 09 2026 14:32:01 GMT-0700...
        const currentTime = new Date().toString()
        emitter.emit("time", currentTime) 
        //.emit fires the "time" event and passes currentTime along as the message argument
        // That message parameter is just whatever value gets passed as the second argument to .emit(). In this case, message becomes currentTime
    },5000)
}
module.exports = emitter

// setInterval(callback, 5000) runs callback every 5000ms (5 seconds), forever, until the process is killed.

//.on(eventName, function) means: "whenever the event named 'time' happens on this emitter, run this function."
//.emit(eventName, data) means: "the event named 'time' is happening RIGHT NOW — go run every listener that's registered for it, and hand them this data."


//output:
//Time received Thu Jul 09 2026 16:56:20 GMT-0700 (Pacific Daylight Time) every 5 seconds until ctrl+c