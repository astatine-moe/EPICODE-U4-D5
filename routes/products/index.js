const express = require("express"),
    router = express.Router(),
    path = require("path"),
    hat = require("hat"),
    multer = require("multer"),
    upload = multer({ dest: "uploads/" }),
    mime = require("mime-types"),
    fs = require("fs");

const pathToProducts = path.resolve(__dirname, "../../", "products.json"),
    pathToReviews = path.resolve(__dirname, "../../", "reviews.json");

const error = (e, res, status = 500) => {
    res.status(status).send({
        error: e,
    });
};

const getProducts = (cb) => {
    if (!fs.existsSync(pathToProducts))
        return cb({ message: "Database does not exist", status: 500 });

    return cb(null, JSON.parse(fs.readFileSync(pathToProducts, "utf-8")));
};

/*
    !GET
*/
router.get("/", (req, res) => {
    getProducts((err, products) => {
        if (err) return error(err.message, res);

        res.send(products);
    });
});

/*
    !POST
*/
router.post("/", (req, res) => {
    getProducts((err, products) => {
        if (err) return error(err.message, res);

        const { name, description, brand, price, category } = req.body;
        if (!name || !description || !brand || !price || !category)
            return error(
                "Must include all required fields (name, description, brand, price, category)",
                res
            );

        let curr = new Date();

        const product = {
            _id: hat(),
            name,
            description,
            brand,
            price,
            category,
            createdAt: curr,
            updatedAt: curr,
        };

        products = [...products, product];

        fs.writeFileSync(
            pathToProducts,
            JSON.stringify(products, null, 4),
            "utf-8"
        );

        res.send(product);
    });
});

/*
    !DELETE
*/
router.delete("/:product_id", (req, res) => {
    const { product_id } = req.params;

    if (!product_id) return error("Product not found", res, 404); //if for whatever reason the parameter is not defined

    getProducts((err, products) => {
        if (err) return error(err.message, res);
        const product = products.find((a) => a._id === product_id);

        if (!product) return error("Product not found", res, 404);

        const filteredProducts = products.filter((a) => a._id !== product_id);

        fs.writeFileSync(
            pathToProducts,
            JSON.stringify(filteredProducts, null, 4),
            "utf-8"
        );

        res.json({ message: "OK" });
    });
});

/*
    !PUT
*/
router.put("/:product_id", (req, res) => {
    const { product_id } = req.params;

    if (!product_id) return error("Product not found", res, 404); //if for whatever reason the parameter is not defined

    getProducts((err, products) => {
        if (err) return error(err.message, res);
        const product = products.find((a) => a._id === product_id);

        if (!product) return error("Product not found", res, 404);

        const { name, description, brand, price, category } = req.body;

        if (name) {
            product.name = name;
        }
        if (description) {
            product.description = description;
        }
        if (brand) {
            product.brand = brand;
        }
        if (price) {
            product.price = price;
        }
        if (category) {
            product.category = category;
        }

        product.updatedAt = new Date();

        fs.writeFileSync(
            pathToProducts,
            JSON.stringify(products, null, 4),
            "utf-8"
        );

        res.json(product);
    });
});

/*
    !FILE UPLOAD
*/
router.post("/:product_id/upload", upload.single("image"), (req, res) => {
    const { product_id } = req.params;

    if (!product_id) return error("Product not found", res, 404); //if for whatever reason the parameter is not defined

    getProducts((err, products) => {
        if (err) return error(err.message, res);
        const product = products.find((a) => a._id === product_id);

        if (!product) return error("Product not found", res, 404);

        const { path: filepath } = req.file;

        product.updatedAt = new Date();
        product.imageUrl = filepath;

        fs.writeFileSync(
            pathToProducts,
            JSON.stringify(products, null, 4),
            "utf-8"
        );

        res.json(product);
    });
});

/*
    !REVIEW POST
*/
router.post("/:product_id/review", (req, res) => {
    const { product_id } = req.params;

    if (!product_id) return error("Product not found", res, 404); //if for whatever reason the parameter is not defined

    getProducts((err, products) => {
        if (err) return error(err.message, res);
        const product = products.find((a) => a._id === product_id);

        if (!product) return error("Product not found", res, 404);

        const { comment, rate } = req.body;

        const curr = new Date();

        const review = {
            comment,
            rate,
            productId: product_id,
            createdAt: curr,
        };

        if (rate > 5) return error("Review rating cannot exceed 5");
        if (rate < 0) return error("Review rating cannot be below 0");

        const reviews = JSON.parse(fs.readFileSync(pathToReviews, "utf-8"));

        reviews.push(review);

        fs.writeFileSync(
            pathToReviews,
            JSON.stringify(reviews, null, 4),
            "utf-8"
        );

        res.json(review);
    });
});

module.exports = router;
