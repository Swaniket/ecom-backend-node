const express = require("express");
const mongoose = require("mongoose");

const { ProductModel } = require("../models/product");
const { CategoryModel } = require("../models/category");
const { uploadOptions } = require("../helpers/uploader");

const router = express.Router();

// Get all the products
// GET: api/v1/products OR api/v1/products?categories=category1,category2
router.get("/", async (req, res) => {
  let filter = {};

  if (req.query.categories) {
    filter = { category: req.query.categories.split(",") };
  }

  const productList = await ProductModel.find(filter).populate("category");
  if (!productList) res.status(500).json({ success: false });
  res.send(productList);
});

// Get a product by ID
// GET: api/v1/products/:id
router.get("/:id", async (req, res) => {
  /* 
  populate('category'):
  It's used for get the details of the category instead of just sending back the ID
  */
  const product = await ProductModel.findById(req.params.id).populate(
    "category"
  );
  if (!product) res.status(500).json({ success: false });
  res.send(product);
});

// Create a new product
// POST: api/v1/products
router.post("/", uploadOptions.single("image"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send("No file attached!");

  // This will result path like this http://localhost:3000/public/uploads/
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
  const fileName = req.file.filename;

  // Check if the category is correct or not
  const category = await CategoryModel.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid Category!");

  const product = new ProductModel({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: `${basePath}${fileName}`,
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
  });

  newProduct = await product.save();

  if (!newProduct)
    return res.status(500).send("The product cannot be created!");

  return res.send(newProduct);
});

// Update a Product by ID
// PUT: api/v1/products/:id
router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).send("Invalid Product ID");

  const category = await CategoryModel.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid Category!");

  const product = await ProductModel.findById(req.params.id);
  if (!product) return res.status(400).send("Invalid Product!");

  const imageFile = req.file;

  // Either imagePath will the old image path or the new image path that the user will upload
  let imagePath;
  if (imageFile) {
    const imageFileName = imageFile.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    imagePath = `${basePath}${imageFileName}`;
  } else {
    imagePath = product.image;
  }

  const updatedProduct = await ProductModel.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: imagePath,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  );

  if (!updatedProduct)
    return res.status(500).send("The product cannot be updated!");

  return res.send(updatedProduct);
});

// Delete a Product by ID
// DELETE: api/v1/products/:id
router.delete("/:id", (req, res) => {
  ProductModel.findByIdAndRemove(req.params.id)
    .then((deletedProduct) => {
      if (deletedProduct) {
        return res
          .status(200)
          .json({ success: true, message: "The product is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Product not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

// Get the count of the products
// GET: api/v1/products/get/count
router.get("/get/count", async (req, res) => {
  const productCount = await ProductModel.countDocuments();
  if (!productCount) res.status(500).json({ success: false });
  res.send({ productCount: productCount });
});

// Get Featured Product(Top N)
// GET: api/v1/products/get/featured/:count
router.get("/get/featured/:count", async (req, res) => {
  const count = req.params.count ? req.params.count : 0;

  const featuredProducts = await ProductModel.find({
    isFeatured: true,
  }).limit(parseInt(count));

  if (!featuredProducts) res.status(500).json({ success: false });
  res.send({ featuredProducts: featuredProducts });
});

// Upload gallery images for a perticular product by ID
// PUT: api/v1/products/gallery-images/:id
router.put(
  "/gallery-images/:id",
  uploadOptions.array("images", 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send("Invalid Product ID");

    const files = req.files;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    let imagePaths = [];

    if (files) {
      files.map((file) => imagePaths.push(`${basePath}${file.filename}`));
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      req.params.id,
      {
        images: imagePaths,
      },
      { new: true }
    );

    if (!updatedProduct)
      return res.status(500).send("The product cannot be updated!");

    return res.send(updatedProduct);
  }
);

module.exports = router;
