const swaggerAutogen = require("swagger-autogen")();
const doc = {
  // 1. Metadata for the top of the Swagger page
  info: {
    title: "Task Manager API",
    description:
      "Interactive API Documentation for Code the Dream Node.js Class",
    version: "1.0.0",
  },
  // 2. Dynamic Host (Where the API is hosted)
  host:
    process.env.NODE_ENV === "production"
      ? "ctd-node-homework-10.onrender.com"
      : "localhost:3000",
  // 3. Protocol (How to connect)
  schemes: process.env.NODE_ENV === "production" ? ["https"] : ["http"],

  securityDefinitions: {
    CSRFToken: {
      type: "apiKey",
      name: "X-CSRF-Token",
      in: "header",
    },
  },
  security: [
    {
      CSRFToken: [],
    },
  ],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./app.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);
