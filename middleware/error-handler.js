const errorHandler = (err, req, res, next) => {
    res.status(500).json({message: err.message})
}

module.exports = errorHandler


// ================What is next?===============
// next is a function that Express automatically passes into every middleware function as one of its parameters. Calling it — next() — tells Express: "I'm done with my part, move on to whatever comes next in the chain."



//===================next()===================
// If your function calls res.send() / res.json() → it's the final checkpoint (the gate) — don't call next(), because the journey is over, a response was already sent.
// If your function does not send a response (it just logs, checks, or adds data) → it must call next(), or the request just stops there forever, like a traveler stuck at security with nobody waving them through.


// A middleware that logs and moves on (checkpoint, not the gate):
// function logger(req, res, next) {
//   console.log(req.method, req.url); // does a task
//   next(); // waves the request through to whatever's next
// }


// A route handler that's the final stop (the gate):
// app.get("/time", (req, res) => {
//   res.status(200).json({ time: new Date().toString() }); // responds — journey over
// });


// Putting them together in order
// app.use(logger);              // checkpoint 1: logs, then next()
// app.get("/time", timeHandler); // checkpoint 2 (final): responds, no next()




//===================when to call next()===================
// Doesn't send a response → call next(), regardless of whether it's registered via app.use(), app.get(), router.post(), etc.
// Does send a response → don't call next(), regardless of how it's registered.