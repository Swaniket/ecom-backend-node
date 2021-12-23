const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");

const productsRouter = require("./routes/products");
const categoriesRouter = require("./routes/categories");
const usersRouter = require("./routes/users");
const ordersRouter = require("./routes/orders");

const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler")
require("dotenv/config");

const app = express();
const api = process.env.API_URL;

// Cors Setup
app.use(cors());
app.options("*", cors);

// Middlewares
app.use(express.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use(errorHandler);
app.use('/public/uploads', express.static(__dirname + '/public/uploads'))

// Routers
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/products`, productsRouter);
app.use(`${api}/users`, usersRouter);
app.use(`${api}/orders`, ordersRouter);

// Mongoose Config
mongoose
  .connect(process.env.DATABASE_CONNECTION_STRING)
  .then(() => {
    console.log("MongoDB is Connected!");
  })
  .catch((err) => {
    console.log(`MongoDB Connection Failed! ERROR: ${err}`);
  });

// Server Running
app.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});
