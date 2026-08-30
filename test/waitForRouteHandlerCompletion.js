
//=======waitForRouteHandlerCompletion======== 
// to make sure create, index, show etc runs and finish test, so it won't move on to next test without finishing test
const waitForRouterHandlerCompletion = async (func, req, res) => {
    let next
    const promise = new Promise((resolve, reject)=> {
        // Prepare a "next" function. If create() calls next(error)
        next = jest.fn((error)=> {
            if(error) return reject(error)// called WITH an error -> treat as failed
                resolve()// called with NO error -> treat as done/success
        })
        // If res.json() or res.send() gets called and the response "finishes"
        res.on("finish", () => {//if response is sent, success
            resolve()// -> treat as done/success

        })
    })
    await func(req, res, next) // actually call create(req, res, next)
    await promise // wait here until either next() or a finished response happens above
    return next  // return next() so the test can later check whether it was called
}

//==============waitForRouterHandlerCompletion=============
// func(req, res, next) is called → "please make this dish" (place the order)
// res.on("finish", ...) → "let me know once the plate (res) comes out finished" — sets up one lookout
// next = jest.fn(...) → "and if it can't be made and you call next(error), let me know that too" — sets up a second lookout
// await promise → "wait right here until either signal comes in"

module.exports = waitForRouterHandlerCompletion