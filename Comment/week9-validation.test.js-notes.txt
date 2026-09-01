const {userSchema} = require("../validation/userSchema")
const{taskSchema, patchTaskSchema} = require("../validation/taskSchema")

describe("user object validation tests", () => {//describe ① groups related tests together 
        it("1. doesn't permit a trivial password", () => {//it ② one specific, single test case

        const {error} = userSchema.validate(
            {name: "Bob", email: "bob@sample.com", password: "password"}, // if you use "password" as password is weak 
            {abortEarly: false}, //Joi validation will check all errors, not just the first one found
            )
          expect(//expect ③ actually checks/verifies the result -> pass or fail happens here   
            error.details.find((detail) => detail.context.key == "password"),//to be find weak password

                // error.details is an array of every validation problem found.
                // .find(...) looks through that array for one whose context.key is "password"
                // -> this checks that the weak password specifically triggered an error
        
            ).toBeDefined();
                // if a password-related error IS found -> find() returns an object (not undefined) -> test PASSES
                // if a password-related error is NOT found -> find() returns undefined -> test FAILS
         });
         
       it("2. requires that an email be specified", () => {
            const {error} = userSchema.validate(
                {name: "Bob", password: "Pa$$word20"},
                {abortEarly: false},
            )
              expect(  
            error.details.find((detail) => detail.context.key == "email"),
        ).toBeDefined();
       });

        it("3. does not accept an invalid email", () => {
             const {error} = userSchema.validate(
                {name: "Bob", email: "bob-sample.com", password: "Pa$$word20"},
                {abortEarly: false},
            )
                 expect(  
            error.details.find((detail) => detail.context.key == "email"),
        ).toBeDefined();
       });

        it("4. requires a password", () => {
             const {error} = userSchema.validate(
                {name: "Bob", email: "bob@sample.com"},
                {abortEarly: false},
            )
                 expect(  
            error.details.find((detail) => detail.context.key == "password"),
        ).toBeDefined();
       });

        it("5. requires name", () => {
             const {error} = userSchema.validate(
                {email: "bob@sample.com", password: "Pa$$word20"},
                {abortEarly: false},
            )
                 expect(  
            error.details.find((detail) => detail.context.key == "name"),
        ).toBeDefined();
       });

        it("6. The name must be valid (3 to 30 characters)", () => {
             const {error} = userSchema.validate(
                {name: "B", email: "bob@sample.com", password: "Pa$$word20"},
                {abortEarly: false},
            )
                 expect(  
            error.details.find((detail) => detail.context.key == "name"),
        ).toBeDefined();
       });

        it("7. If validation is performed on a valid user object, error comes back falsy", () => {
             const {error} = userSchema.validate(
                {name: "Bob", email: "bob@sample.com", password: "Pa$$word20"},
                {abortEarly: false},
            )
                 expect(error).toBeFalsy();
       });
    

    describe("task object validation tests", () => {
        it("8. requires a title", () => {
                // validate an object with NO title at all
              const {error} = taskSchema.validate(
                {},
                {abortEarly: false},
            )
            expect(  
            error.details.find((detail) => detail.context.key == "title"),
        ).toBeDefined();
       });
        it("9. If an isCompleted value is specified, it must be valid", () => {
                  // isCompleted should be a boolean (true/false) -- here we intentionally
                  // pass a string instead, to make sure validation catches the wrong type
            
            const {error} = taskSchema.validate(
                {title: "first task", isCompleted: "not-a-boolean"},
                {abortEarly: false},
            )
            expect(  
            error.details.find((detail) => detail.context.key == "isCompleted"),
        ).toBeDefined();
       });
        it("10. If an isCompleted value is not specified but the rest of the object is valid, a default of false is provided by validation", () => {
                 const {value} = taskSchema.validate(
                {title: "first task"},
                {abortEarly: false},
            )
            expect(value.isCompleted).toBe(false);
       });
        it("11. If isCompleted in the provided object has the value true, it remains true after validation", () => {
            const {value} = taskSchema.validate(
                {title: "first task", isCompleted: true},
                {abortEarly: false},
            )
            expect(value.isCompleted).toBe(true)
       });

    })
//======taskSchema validation explanation======
// 8. title is missing -> only a "title" error occurs.
//    isCompleted (false) and priority (medium) are filled in automatically
//    by their default values, so they don't cause any errors.

// 9. title is valid. isCompleted is given a string -> causes an error.
//    priority is omitted, but its default value (medium) fills in automatically,
//    so it doesn't cause an error.

// 10. title is valid. priority is omitted -> its default value (medium) fills in.
//     isCompleted is also omitted -> this test confirms its default value of false
//     is filled in automatically.

// 11. title is valid. priority is omitted -> its default value (medium) fills in.
//     isCompleted is explicitly set to true -> this test confirms that value
//     stays true (isn't overwritten by validation).

    describe("patchTaskSchema validation tests", () => {

        //non required value, but minimum of 1 required(.min(1) in patchSchema)
        it("12. does not require a title", () => {
            const {error} = patchTaskSchema.validate(
                {isCompleted: true},
                {abortEarly: false},
            )
            expect(error).toBeFalsy()//error comes back null or undefined = falsy = no error
            
       });
        it("13. If no value is provided for isCompleted this remains undefined in the returned value", () => {
                // patchTaskSchema's isCompleted has NO .default(...), unlike taskSchema's.
                // This matters for real PATCH requests: if a field is left out, it means
                // "don't touch this field" -- it should NOT get auto-filled with false,
                // or an unrelated update (e.g. changing priority) could accidentally
                // reset isCompleted back to false.
            
            const {value} = patchTaskSchema.validate(
                {},
                {abortEarly: false},
            )
            expect(value.isCompleted).toBeUndefined()//isCompleted is undefined(not provided)--// confirms no default was applied
       });

    })
})



// =======example of error.details, context.key=======
// error.details = [
//   {
//     message: "\"password\" length must be at least 8 characters long",
//     path: ["password"],
//     type: "string.min",
//     context: { key: "password", label: "password", ... }
//   },
//   {
//     message: "\"email\" must be a valid email",
//     path: ["email"],
//     type: "string.email",
//     context: { key: "email", label: "email", ... }
//   }
// ]



//===========what is describe, it, expect?==============
// describe = groups related tests together — like a chapter title, shows up as a heading in test reports
// it = one specific test case — its name should describe, in plain English, exactly what's being checked
// expect = the actual assertion — compares the real value against what you expect, and this is where pass/fail is decided
