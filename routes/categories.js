const express = require("express");
const { CategoryModel } = require("../models/category");

const router = express.Router();

// Get all the categories
// GET: api/v1/categories
router.get("/", async (req, res) => {
  const categoryList = await CategoryModel.find({});

  if (!categoryList) return res.status(500).json({ success: false });

  return res.status(200).send(categoryList);
});

// Get a perticular category by ID
// GET: api/v1/categories/:id
router.get("/:id", async (req, res) => {
  const category = await CategoryModel.findById(req.params.id);

  if (!category) return res.status(500).json({ success: false });

  return res.status(200).send(category);
});

// Add a new Category
// POST: api/v1/categories
router.post("/", async (req, res) => {
  let category = new CategoryModel({
    name: req.body.name,
    icon: req.body.icon,
    color: req.body.color,
  });

  category = await category.save();

  if (!category) return res.status(400).send("The Category cannot be created!");

  return res.send(category);
});

// Update a Category by ID
// PUT: api/v1/categories/:id
router.put("/:id", async (req, res) => {
  const updatedCategory = await CategoryModel.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
    },
    { new: true }
  );

  if (!updatedCategory)
    return res.status(400).send("The Category cannot be updated!");

  return res.send(updatedCategory);
});

// Delete a category
// DELETE: api/v1/categories/:id
router.delete("/:id", (req, res) => {
  CategoryModel.findByIdAndRemove(req.params.id)
    .then((deletedCategory) => {
      if (deletedCategory) {
        return res
          .status(200)
          .json({ success: true, message: "The category is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Category not found!" });
      }
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

module.exports = router;
