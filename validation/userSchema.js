const Joi = require("joi")

    const userSchema = Joi.object({
        email: Joi.string().trim().lowercase().email().required(),
        name: Joi.string().trim().min(3).max(30).required(),
        password: Joi.string().min(8).invalid("password", "123456", "12345678").required() //guarantees it is a string and not a trivial/short input.//"non-trivial" means that an application or piece of code is more complex than a basic or minimal example. //.invalid if password is "123456" or "12345678"
   
    })

module.exports = {userSchema}