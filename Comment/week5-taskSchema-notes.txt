const Joi = require("joi")
// Schema for CREATING a task (POST)
const taskSchema =  Joi.object({
    title: Joi.string().trim().min(3).max(30).required(),//Creating a task - Required, trimmed string between 3 and 30 characters.
    isCompleted: Joi.boolean().default(false).not(null), //Creating a task - Optional boolean, defaults to false if omitted, and cannot be null.
})
//isCompleted must be true or false(valid). If omitted (undefined): Defaults automatically to false. can not accept ex: { "title": "Buy milk", "isCompleted": null }-this is invalid

//====.not()null)=====
// { "isCompleted": true } : valid
// { "isCompleted": false } : valid
// Property omitted (e.g. { "title": "Buy milk" }): Valid -> Defaults to false
//{ "isCompleted": null } : invalid


// Schema for UPDATING a task (PATCH)
const patchTaskSchema = Joi.object({
    title: Joi.string().trim().min(3).max(30), //Updating a task - Optional (so partial updates work), but if provided, must follow the string rules.
    isCompleted: Joi.boolean().not(null)//Updating a task - Optional boolean, cannot be null (notice no .default(false) here, so updating title alone won't accidentally overwrite isCompleted).if try to update only title, isCompleted will not overwrite to false.
}).min(1) /// Requires at least 1 field in the request body

module.exports = {taskSchema, patchTaskSchema}


// What happens if you DO put .default(false) on patchTaskSchema:
// Suppose you have an existing task in your database:

// JavaScript
// { id: 1, title: "Buy groceries", isCompleted: true }

// Now, the user sends a PATCH request to update only the title:
// JSON
// { "title": "Buy organic groceries" }
// If Joi sees .default(false) on isCompleted, Joi thinks: "The user didn't send isCompleted, so I'll insert false for them!"

// Joi transforms the request body into:
// JavaScript
// { "title": "Buy organic groceries", "isCompleted": false }
// ❌ The Bug: Even though the user just wanted to fix a typo in the title, their completed task (isCompleted: true) was accidentally flipped back to false!

// What happens when you OMIT .default(false) (The correct way):
// With patchTaskSchema defined like this:
// JavaScript
// isCompleted: Joi.boolean().not(null)

// When the user sends:
// JSON
// { "title": "Buy organic groceries" }
// Joi checks the payload:

// title: Valid string.
// isCompleted: Not provided, so Joi leaves it undefined (does not insert any default value).

// Now your server code safely updates only the title field without overwriting isCompleted!

// Summary Rule of Thumb
// Creation Schema (taskSchema): Use .default(false) because a brand-new task needs a starting completion status if the user doesn't provide one.
// Update Schema (patchTaskSchema): Omit .default() so fields that aren't sent in the request are left alone.