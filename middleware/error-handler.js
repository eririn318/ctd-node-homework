const errorHandler = (err, req, res, next) => {
    if (err.name === "PrismaClientInitializationError"){
        console.error("Couldn't connect to the database. Is it running?")
}
    res.status(500).json({message: err.message})
}
module.exports = errorHandler





