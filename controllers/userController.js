const {userSchema} = require("../validation/userSchema")
const crypto = require("crypto")
const util = require("util")

// Promisify scrypt so we can use `await scrypt(...)`
const scrypt = util.promisify(crypto.scrypt)

/**
 * Creates a random salt and hashes the password.
 * Returns a string formatted as "salt:hashedKey".
 */

//creates a salt, hashes the password, and returns the stored hash string.
async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex") //creates a random salt(random character)
    const derivedKey = await scrypt(password, salt, 64)
    return `${salt}:${derivedKey.toString("hex")}` //When we registered the user, we saved the password as salt:hashedKey (separated by a colon :).
// During Registration (hashPassword)
// Input: Takes the new password chosen during registration (password) + a brand new random salt (crypto.randomBytes(16)).
// Process: Runs scrypt for 64 bytes.
// Output: Returns the binary Buffer, converted to a hex string, and saved as `${salt}:${derivedKey.toString("hex")}`
}

//hashes the submitted password with the stored salt and compares the result.
async function comparePassword(inputPassword, storedHash) {
    const [salt, key] = storedHash.split(":") // storedHash.split(":") takes that string and splits it into two variables: salt: The random salt created when the user first registered. key: The original hashed key that was generated during registration.
    const derivedKey = await scrypt(inputPassword, salt, 64) //To verify if the login password is correct, we pass the newly inputted password into scrypt using the exact same salt and length (64) that we retrieved from storedHash. //derivedKey is the new result from hashing inputPassword with the original salt.
    return key === derivedKey.toString("hex") //We convert derivedKey to a hex string: derivedKey.toString("hex"). //We check: key === derivedKey.toString("hex")
// During Login (comparePassword)
// Input: Takes the password typed into the login form (inputPassword) + the stored salt retrieved from the user's saved hash.
// Process: Runs scrypt for 64 bytes.
// Output: Returns the binary Buffer, converted to a hex string, and checks if it matches the stored key (key === derivedKey.toString("hex")).
}

    exports.register = async (req, res) => {
        // 1. Ensure req.body is defined
        if(!req.body) req.body = {}
        // 2. Validate request body against userSchema
        const {error, value} = userSchema.validate(req.body, {abortEarly: false})
        // 3. If validation fails, stop early with 400
        if(error) {
            return res.status(400).json({//400 bad client request
            message: error.details.map((d) => d.message).join(", "), 
// .join(", ")==example
//const errors = ["Email is required", "Password is too short"];
// .join(", ") turns that array into a readable message for the client:
// const errorMessage = errors.join(", "); 
// Result: "Email is required, Password is too short"
     })
        }
        // 4. Use value.name, value.email, value.password after validation
        // Destructure name, email, and password from the sanitized, Joi-validated data (not raw req.body)
        // Joi automatically cleans up the data during validation (for example, using .trim() to remove extra spaces or .lowercase() on email). Taking values from value ensures you use that cleaned data instead of whatever raw text was sent in Postman!
       
        // When Joi validates req.body, it returns an object that looks like this: { error, value }.
        // error: Contains any validation error details if the input was invalid.
        // value: Contains the cleaned, validated object output by Joi.
        // const {name, email, password} = value
        //     // is the same as
        //     // const name = value.name;
        //     // const email = value.email;
        //     // const password = value.password;
    //4. Hash password after validation succeeds
        const hashedPassword = await hashPassword(value.password)//password + salt mix and hash -> turn to unreadable string
    
    //5. Create user without plain text password
    const newUser = {
        name:value.name, 
        email:value.email, 
        hashedPassword} //put these 3 into newUser

    global.users.push(newUser)// Push newUser into the global.users array
    global.user_id = newUser // 1 item from array // whoever is currently logged in

    // global is a Node.js built-in object(global namespace in app.js)
// Just like __dirname and __filename are automatically available in every Node file, global is too — it's Node's version of the "global namespace." Anything you attach to global becomes accessible from any file in your entire Node process, without needing to require() or import it anywhere.

// global.users = [
//   { name: "Eriko", email: "eriko@example.com", password: "1234" },
//   { name: "Pu-chan", email: "puchan@example.com", password: "5678" }
// ];

// global.user_id = { name: "Pu-chan", email: "puchan@example.com", password: "5678" };
// // ^ this is the SAME object as global.users[1] — just referenced separately
    
    res.status(201).json({//Send back newUser's name and email to postman //201 created -"a new thing was created.
        name: newUser.name,
        email: newUser.email
    })
}

async function logon(req, res) {
    const {email, password} = req.body || {}// read email and password from postman
    const user = global.users.find((user) => user.email === email?.trim().toLowerCase())//1. Find user by email first
    //2. Safely check password against stored hash
    const goodCredentials = user && await comparePassword(password, user.hashedPassword)
// How goodCredentials Works
// Find User: Look for a user matching email. If found, user contains { name, email, hashedPassword } (where hashedPassword is salt:key).
// Short-Circuit Check (user && ...): If no user was found (user is undefined), JS stops immediately and sets goodCredentials to undefined (falsy) without crashing.
// Password Verification: If the user was found, comparePassword(password, user.hashedPassword) runs:
// It extracts the salt and original key from user.hashedPassword.
// It hashes the inputted password using that salt.
// If the generated key matches the stored key, comparePassword returns true.
// So goodCredentials becomes true only if both the user exists and the password matches!
    
if(goodCredentials){//if matched, send back user's name and email to postman
        global.user_id = user
        res.status(200).json ({//200 success - matched
            name: user.name, //Jim,
            email: user.email})
    }else{//if not matched, send back error
        res.status(401).json({//401 Unauthorized - Client error — specifically about authentication failing. 
            message: "Email or password is invalid"
        })
    }}

function logoff(req, res) {
    global.user_id = null //Setting it to null clears login — there's no longer a "current user."
    res.status(200).json({//200 success - null
        message: "Successfully logged off"
    })
}
module.exports = {logon,logoff, register: exports.register}

// util.promisify() transforms old-school callback functions into modern async/await functions. //util.promisify(), which lets us use await with scrypt. //Safely hashes passwords so raw passwords are never saved in the database.

// scrypt takes a plain text password (like "mySecret123") and turns it into a long, scrambled string of random-looking characters (a hash).

// crypto is a built-in module (library) that provides cryptographic functions. It gives you tools for security tasks like:
// -Hashing passwords (using algorithms like scrypt, pbkdf2, etc.)
// -Generating random data (like secret tokens or random salts using crypto.randomBytes())
// -Encrypting and decrypting data
// -Creating digital signatures


// 1. 「ハッシュ化」そのものとは？
// 入力された文字列を、数学的な計算を使って元に戻せない特殊な文字列に変換することです。
// 入力: mySecret123
// ハッシュ化後: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

// ポイント:
// 同じ入力からは必ず同じ文字列が生成されます。
// 一方通行（不可逆）なので、ハッシュ後の文字列から元の mySecret123 を復元することは誰にもできません。
// 2. 「違うワードを付け加える」＝ ソルト（Salt）
//「違うワードを付け加える」というのは、セキュリティ業界で「ソルト（塩を振る）」と呼ばれる技術です。
// もし単純に mySecret123 をハッシュ化するだけだと、ハッカーがあらかじめ作っておいた「よくあるパスワードのハッシュ値一覧表（レインボーテーブル）」と照合して、元のパスワードを破られてしまいます。

// そこで、ハッシュ化する前にランダムな文字列（塩）を付け加えます。

// JavaScript
// // 1. ランダムな文字列（塩）をつくる
// ソルト = "a8f9x2"
// // 2. パスワードにくっつける
// 結合データ = "mySecret123" + "a8f9x2"
// // 3. それをまとめてハッシュ化する！
// 最終ハッシュ = scrypt(結合データ)

// crypto.randomBytes(16) でランダムな塩をつくり、scryptでハッシュ化している
// const salt = crypto.randomBytes(16).toString("hex");
// const derivedKey = await scrypt(password, salt, 64);

// ハッシュ化: パスワードを二度と復元できないランダムな文字列に変換すること。
// 違うワードを付け加える（ソルト）: ハッシュ化する前にランダムな文字を足して、ハッカーの解読を防ぐテクニック。
// この2つを組み合わせることで、「データベースが漏洩しても元のパスワードが絶対にバレない」強いセキュリティを作っています！

// 1. Register
// Receive password.
// Create a random salt.
// Pass password + salt into scrypt -> creates hash.
// Save salt + hash in the database (never save the raw password).

// 2. Log On
// Receive login password.
// Fetch the user's saved salt and saved hash.
// Pass login password + saved salt into scrypt -> creates a new hash.
// Check: Does new hash === saved hash?
// Yes: Log in successful!
// No: Incorrect password!