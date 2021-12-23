const express = require("express");
const { OrderModel } = require("../models/order");
const { OrderItemModel } = require("../models/order-item");

const router = express.Router();

// Get all the Orders
// GET: api/v1/orders
router.get("/", async (req, res) => {
  const orderList = await OrderModel.find()
    .populate("user", ["name", "email"])
    .sort({ dateOrdered: -1 });
  if (!orderList) return res.status(500).json({ success: false });

  return res.send(orderList);
});

// Get Order by ID
// GET: api/v1/orders/:id
router.get("/:id", async (req, res) => {
  const order = await OrderModel.findById(req.params.id)
    .populate("user", ["name", "email"])
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    });
  if (!order) res.status(500).json({ success: false });

  res.send(order);
});

// Place a new Order
// POST: api/v1/orders
router.post("/", async (req, res) => {
  const orderItemIds = Promise.all(
    req.body.orderItems.map(async (orderItem) => {
      let newOrderItem = new OrderItemModel({
        quantity: orderItem.quantity,
        product: orderItem.product,
      });

      newOrderItem = await newOrderItem.save();
      return newOrderItem._id;
    })
  );

  const orderItemsIdsResolved = await orderItemIds;

  const totalPrices = await Promise.all(
    orderItemsIdsResolved.map(async (orderItemId) => {
      const orderItem = await OrderItemModel.findById(orderItemId).populate(
        "product",
        "price"
      );
      const totalPrice = orderItem.product.price * orderItem.quantity;
      return totalPrice;
    })
  );

  const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

  let newOrder = new OrderModel({
    orderItems: orderItemsIdsResolved,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: totalPrice,
    user: req.body.user,
  });

  newOrder = await newOrder.save();
  if (!newOrder) return res.status(400).send("The order cannot be placed!");

  return res.send(newOrder);
});

// Update order Status by ID
// PUT: api/v1/orders/:id
router.put("/:id", async (req, res) => {
  const updatedOrder = await OrderModel.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    { new: true }
  );

  if (!updatedOrder)
    return res.status(400).send("The order cannot be updated!");

  return res.send(updatedOrder);
});

// Delete an order
// DELETE: api/v1/orders/:id
router.delete("/:id", (req, res) => {
  OrderModel.findByIdAndRemove(req.params.id)
    .then(async (deletedOrder) => {
      if (deletedOrder) {
        await deletedOrder.orderItems.map(async (orderItem) => {
          await OrderItemModel.findByIdAndRemove(orderItem);
        });
        return res
          .status(200)
          .json({ success: true, message: "The order is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Order not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

// Get Total Sales
// GET: api/v1/orders/get/totalsales
router.get("/get/totalsales", async (req, res) => {
  const totalSales = await OrderModel.aggregate([
    { $group: { _id: null, totalSales: { $sum: "$totalPrice" } } },
  ]);

  if (!totalSales)
    return res.status(400).send("The order sales cannot be generated!");

  return res.send({ totalSales: totalSales.pop().totalSales });
});

// Get the count of orders
// GET: api/v1/orders/get/count
router.get("/get/count", async (req, res) => {
  const orderCount = await OrderModel.countDocuments();
  if (!orderCount) res.status(500).json({ success: false });
  res.send({ orderCount: orderCount });
});

// Get Orders for a specific user(by user Id)
// GET: api/v1/orders/get/userorders/:userid
router.get("/get/userorders/:userid", async (req, res) => {
  const userOrderList = await OrderModel.find({ user: req.params.userid })
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    })
    .sort({ dateOrdered: -1 });
  if (!userOrderList) return res.status(500).json({ success: false });

  return res.send(userOrderList);
});

module.exports = router;
