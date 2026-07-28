
function authMiddleware (req, res, next){//A request comes in.
if(!global.user_id) {//Check global.user_id.
    return res.status(401).json({//If nobody is logged in → send 401(Client is not authenticated)
        message: "Unauthorized"
    })
}
   next()//If someone is logged in → call next(). next() passes the request to the next middleware or route handler.
}

module.exports = authMiddleware


