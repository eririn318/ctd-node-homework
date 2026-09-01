const jwt = require("jsonwebtoken")// library to verify (and sign) JWTs
const {StatusCodes} = require("http-status-codes")// gives readable names for HTTP status codes (e.g. StatusCodes.UNAUTHORIZED = 401)


// Small reusable helper: sends a 401 response with a consistent error message.
// Called from every failure path below, so we don't repeat this code 3 times.
const send401 = (res) => {
    res.status(StatusCodes.UNAUTHORIZED).json({
        message: "No user is authenticated."
    })
}

// This is the actual Express middleware function.
// Middleware runs BEFORE the route handler (e.g. before taskController.index).
// It must either reject the request (401) or call next() to let it continue.
module.exports = async(req, res, next) => {
 console.log("JWT MIDDLEWARE RUNNING");
  // Step 1: try to read the "jwt" cookie sent with this request.
  // "?." (optional chaining) prevents a crash if req.cookies is undefined.
    const token = req?.cookies?.jwt;
    console.log("JWT COOKIE:", token ? "EXISTS" : "MISSING");
    // Step 2: if there's no cookie at all, no one is logged in -> reject right away.
    if(!token) {
        return send401(res)
    }

  // Step 3: verify the token's signature against our secret key.
  // This checks two things: (a) was it really signed by our server,
  // and (b) has it expired yet? If valid, "decoded" contains the original
  // payload we signed earlier: { id, csrfToken }.


// ====(err, decoded)===== -> callback function passed to jwt.verify
// jwt.verify calls this AFTER it finishes checking the token
// - if verification fails: err has the error info, decoded is undefined
// - if verification succeeds: err is null, decoded has the token's payload (id, csrfToken, etc.)
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            console.log("JWT VERIFY ERROR:", err ? err.message : "NO ERROR");

        // Step 4: if verification failed (bad signature, tampered, expired) -> reject.
        if(err) {
            return send401(res)
        }

         console.log("JWT VERIFIED");
    console.log("CSRF HEADER EXISTS:", !!req.get("X-CSRF-TOKEN"));

    // Step 5: token is valid, so store this user's id on req.user.
    // Any route handler further down the chain (task routes, etc.) can now
    // read req.user.id to know exactly who made THIS request.
        req.user = {id: decoded.id}

         // Step 5: if the request method is included in this list
        if(["POST", "PATCH", "PUT", "DELETE", "CONNECT"].includes(req.method)){
            
            
      // Step 7: compare the CSRF token from the request header
      // against the CSRF token stored inside the verified JWT.
      // An attacker forging a cross-site request has no way to know this
      // value, so a mismatch strongly suggests a CSRF attempt -> reject.
            if (req.get("X-CSRF-TOKEN") != decoded.csrfToken) {
                return send401(res)
            }
        }
        // Step 8: everything passed -> let the request continue to its route handler.
        next() //if the token is good
    })
}