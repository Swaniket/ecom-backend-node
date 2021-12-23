const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv/config");

const { UserModel } = require("../models/user");

const router = express.Router();

// Get all the Users (without the passwordHash field)
// GET: api/v1/users
router.get("/", async (req, res) => {
  const userList = await UserModel.find().select("-passwordHash");
  if (!userList) res.status(500).json({ success: false });

  res.send(userList);
});

// Get a user by ID (without the passwordHash field)
// GET: api/v1/users/:id
router.get("/:id", async (req, res) => {
  const user = await UserModel.findById(req.params.id).select("-passwordHash");
  if (!user) return res.status(500).json({ message: "User not found!" });

  return res.status(200).send(user);
});

// Add a new User (Used by Admin)
// POST: api/v1/users
router.post("/", async (req, res) => {
  const salt = process.env.PASSWORD_HASH_SALT;
  const hashedPassword = await bcrypt.hashSync(
    req.body.password,
    parseInt(salt)
  );

  let newUser = new UserModel({
    name: req.body.name,
    email: req.body.email,
    passwordHash: hashedPassword,
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });

  newUser = await newUser.save();
  if (!newUser) return res.status(400).send("User cannot be created!");

  return res.send(newUser);
});

// Update User by ID (Optional Password Update)
// PUT: api/v1/users/:id
router.put("/:id", async (req, res) => {
  let newPassword;
  const salt = process.env.PASSWORD_HASH_SALT;
  const existingUser = await UserModel.findById(req.params.id);

  // Making the password field optional
  req.body.password
    ? (newPassword = await bcrypt.hashSync(req.body.password, parseInt(salt)))
    : (newPassword = existingUser.passwordHash);

  const updatedUser = await UserModel.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      email: req.body.email,
      passwordHash: newPassword,
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
      street: req.body.street,
      apartment: req.body.apartment,
      zip: req.body.zip,
      city: req.body.city,
      country: req.body.country,
    },
    { new: true }
  );

  if (!updatedUser) return res.status(400).send("The User cannot be updated!");

  return res.send(updatedUser);
});

// User Registration
// POST: api/v1/users/register
router.post("/register", async (req, res) => {
  const salt = process.env.PASSWORD_HASH_SALT;
  const hashedPassword = await bcrypt.hashSync(
    req.body.password,
    parseInt(salt)
  );

  let newUser = new UserModel({
    name: req.body.name,
    email: req.body.email,
    passwordHash: hashedPassword,
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });

  newUser = await newUser.save();
  if (!newUser) return res.status(400).send("User cannot be created!");

  return res.send(newUser);
});

// User Sign In with email & password
// POST: api/v1/users/login
router.post("/login", async (req, res) => {
  // Check if the user exists in DB
  const secret = process.env.JWT_SECRET;
  const user = await UserModel.findOne({ email: req.body.email });

  if (!user) return res.status(400).send("User not found");

  if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
    const token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
      },
      secret,
      {
        expiresIn: "1d",
      }
    );
    res.status(200).send({ user: user.email, token: token });
  } else res.status(400).send("Password is Wrong");
});

// Get the count users
// GET: api/v1/users/get/count
router.get("/get/count", async (req, res) => {
  const userCount = await UserModel.countDocuments();
  if (!userCount) res.status(500).json({ success: false });
  res.send({ userCount: userCount });
});

// Delete an User by ID
// DELETE: api/v1/users/:id
router.delete("/:id", (req, res) => {
  UserModel.findByIdAndRemove(req.params.id)
    .then((deletedUser) => {
      if (deletedUser) {
        return res
          .status(200)
          .json({ success: true, message: "The user is removed!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "User not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

module.exports = router;
