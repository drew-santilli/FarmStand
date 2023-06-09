const e = require("express");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const Product = require("./models/product");
const AppError = require("./AppError");
const wrapAsync = require("./utils/wrapAsync");
const engine = require("ejs-mate");

const methodOverride = require("method-override");
const { validate } = require("./models/product");

mongoose
  .connect("mongodb://127.0.0.1:27017/FarmStand", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MONGO CONNECTION OPEN!");
  })
  .catch((err) => {
    console.log("MONGO ERROR!");
    console.log(err);
  });

const app = express();

app.engine("ejs", engine);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const categories = [
  "fruit",
  "vegetable",
  "dairy",
  "mushroom",
  "poachery",
  "nut",
  "grain",
];

function validatePassword(req, res, next) {
  const { password } = req.query;
  if (password === "farmerman") {
    next();
  }
  throw new AppError("PASSWORD IS NEEDED", 401);
}

app.get(
  "/products",
  wrapAsync(async (req, res, next) => {
    const { category } = req.query;
    if (category) {
      const products = await Product.find({ category });
      res.render("products/index", { products, category });
    } else {
      const products = await Product.find({});
      res.render("products/index", { products, category: "All" });
    }
  })
);

app.get("/products/new", (req, res) => {
  // throw new AppError("NOT ALLOWED!", 401);
  res.render("products/new", { categories });
});

app.post(
  "/products",
  wrapAsync(async (req, res, next) => {
    const newProduct = new Product(req.body);
    await newProduct.save();
    console.log(newProduct);
    res.redirect(`/products/${newProduct._id}`);
  })
);

app.get(
  "/products/:id",
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      throw new AppError("PRODUCT NOT FOUND", 404);
    }
    res.render("products/show", { product });
  })
);

app.get(
  "/products/:id/edit",
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const product = await Product.findById(id, req.body);
    if (!product) {
      throw new AppError("PRODUCT NOT FOUND", 404);
    }
    res.render("products/edit", { product, categories });
  })
);

app.put(
  "/products/:id",
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, {
      runValidators: true,
      new: true,
    });
    res.redirect(`/products/${product._id}`);
  })
);

app.get("/error", (req, res) => {
  chicken.fly();
});

app.delete(
  "/products/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    res.redirect("/products");
  })
);

// app.use((err, req, res, next) => {
//   console.log("*******************************");
//   console.log("***********ERROR***************");
//   console.log("*******************************");
//   next(err);
// });

const handleValidationError = function (err) {
  console.dir(err);
  return new AppError(`Validation Failed::: ${err.message}`, 400);
};

app.use((err, req, res, next) => {
  console.log(err.name);
  if (err.name === "ValidationError") {
    err = handleValidationError(err);
    next(err);
  }
});

app.use((err, req, res, next) => {
  const { status = 500, message = "SOMETHING WENT WRONG!" } = err;
  console.log(message);
  res.status(status).send(message);
});

app.listen(3000, () => {
  console.log("LISTENING ON PORT 3000");
});
