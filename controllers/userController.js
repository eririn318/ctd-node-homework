

function register(req, res) {
    const {name, email, password} = req.body //read name, email, password from body in postman
    const newUser = {name, email, password} //put these 3 into newUser
    global.users.push(newUser)// Push newUser into the global.users array
    global.user_id = newUser // 1 item from array // whoever is currently logged in
    
// global.users = [
//   { name: "Eriko", email: "eriko@example.com", password: "1234" },
//   { name: "Pu-chan", email: "puchan@example.com", password: "5678" }
// ];

// global.user_id = { name: "Pu-chan", email: "puchan@example.com", password: "5678" };
// // ^ this is the SAME object as global.users[1] — just referenced separately
    
    res.status(201).json({//Send back newUser's name and email to postman
        name: newUser.name,
        email: newUser.email
    })
 
}

function logon(req, res) {
    const {email, password} = req.body // read email and password from postman
    const user = global.users.find((user) => user.email === email && user.password === password)//find matching email and password
    if(user){//if matched, send back user's name and email to postman
        global.user_id = user
        res.status(200).json ({
            name: user.name, //Jim,
            email: user.email})
    }else{//if not matched, send back error
        res.status(401).json({
            message: "Email or password is invalid"
        })
    }}

function logoff(req, res) {
    global.user_id = null //Setting it to null clears login — there's no longer a "current user."
    res.status(200).json({
        message: "Successfully logged off"
    })
}
module.exports = {register,logon,logoff}