const {Pool} = require("pg")
require("dotenv").config()

const pool = new Pool({//connecting to the database(DATABASE_URL from .env)
    connectionString: process.env.DATABASE_URL
})

//error listener
// .on means run this function if "error" happens 
pool.on("error", (err, client) => {
    console.error("Unexpected error on idle client", err)
})

module.exports = pool

// Pool is a class — a blueprint for creating a "connection pool," which is a manager that keeps several database connections open and ready to reuse, rather than opening a brand-new connection every single time your app needs to talk to Postgres