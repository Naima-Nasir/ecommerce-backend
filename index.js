require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("./middleware/auth");
const verifyAdmin = require("./middleware/admin");
const app = express();
const nodemailer = require("nodemailer");
app.use(cors());
app.use(express.json());

// =====================
// 🔌 MYSQL CONNECTION
// =====================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "ecommerce",
  charset: "utf8mb4"
});

db.connect((err) => {
  if (err) {
    console.log("❌ DB connection failed", err);
     console.log(err);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

// =====================
// 🏠 HOME
// =====================
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// =====================
// 📦 PRODUCTS
// =====================
app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }

    res.json(result);
  });
});
// =====================
// 📂 CATEGORIES
// =====================
app.get("/categories", (req, res) => {
  db.query("SELECT * FROM categories", (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});
// =====================
// 📂 ADMIN - ALL CATEGORIES
// =====================

app.get(
  "/admin/categories",
  verifyToken,
  verifyAdmin,
  (req, res) => {

    db.query(
      "SELECT * FROM categories ORDER BY category_id DESC",
      (err, result) => {

        if (err) {
          console.log(err);

          return res.status(500).json({
            success: false,
            message: "Database Error"
          });
        }

        res.json({
          success: true,
          categories: result
        });

      }
    );

  }
);


// =====================
// ➕ ADMIN - ADD CATEGORY
// =====================

app.post(
  "/admin/add-category",
  verifyToken,
  verifyAdmin,
  (req, res) => {

    const { category_name } = req.body;

    if (!category_name || category_name.trim() === "") {
      return res.json({
        success: false,
        message: "Category name is required"
      });
    }

    db.query(
      "INSERT INTO categories (category_name) VALUES (?)",
      [category_name.trim()],
      (err, result) => {

        if (err) {
          console.log(err);

          return res.status(500).json({
            success: false,
            message: "Database Error"
          });
        }

        res.json({
          success: true,
          message: "Category Added Successfully",
          category_id: result.insertId
        });

      }
    );

  }
);


// =====================
// ✏️ ADMIN - EDIT CATEGORY
// =====================

app.put(
  "/admin/edit-category/:id",
  verifyToken,
  verifyAdmin,
  (req, res) => {

    const categoryId = req.params.id;

    const { category_name } = req.body;

    if (!category_name || category_name.trim() === "") {
      return res.json({
        success: false,
        message: "Category name is required"
      });
    }

    db.query(
      `
      UPDATE categories
      SET category_name = ?
      WHERE category_id = ?
      `,
      [
        category_name.trim(),
        categoryId
      ],
      (err, result) => {

        if (err) {
          console.log(err);

          return res.status(500).json({
            success: false,
            message: "Database Error"
          });
        }

        res.json({
          success: true,
          message: "Category Updated Successfully"
        });

      }
    );

  }
);


// =====================
// 🗑️ ADMIN - DELETE CATEGORY
// =====================

app.delete(
  "/admin/delete-category/:id",
  verifyToken,
  verifyAdmin,
  (req, res) => {

    const categoryId = req.params.id;

    db.query(
      "DELETE FROM categories WHERE category_id = ?",
      [categoryId],
      (err, result) => {

        if (err) {
          console.log(err);

          return res.status(500).json({
            success: false,
            message: "Database Error"
          });
        }

        res.json({
          success: true,
          message: "Category Deleted Successfully"
        });

      }
    );

  }
);
// =====================
// 🖼️ BANNERS
// =====================
app.get("/banners", (req, res) => {
  db.query(
    "SELECT * FROM banners",
    (err, result) => {
      if (err) return res.send(err);
      res.json(result);
    }
  );
});

// =====================
// 🔍 PRODUCTS BY CATEGORY
// =====================
app.get("/products/category/:id", (req, res) => {
  db.query(
    "SELECT * FROM products WHERE category_id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.send(err);
      res.json(result);
    }
  );
});

// =====================
// 👤 SIGNUP
// =====================
app.post("/signup", async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {

      if (err) {
        return res.json({
          success: false,
          message: "Database error"
        });
      }

      if (result.length > 0) {
        return res.json({
          success: false,
          message: "Email already exists"
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const sql =
        "INSERT INTO users (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)";

      db.query(
        sql,
        [name, email, hashedPassword, phone, address],
        (err) => {

          if (err) {
            return res.json({
              success: false,
              message: "Signup failed"
            });
          }

          res.json({
            success: true,
            message: "User created successfully"
          });

        }
      );

    }
  );
});

app.put("/update-profile", verifyToken, (req, res) => {
  const { name, phone, address } = req.body;

  db.query(
    "UPDATE users SET name=?, phone=?, address=? WHERE user_id=?",
    [name, phone, address, req.user.user_id],
    (err) => {
      if (err) {
        return res.json({
          success: false,
          message: "Update failed",
        });
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
      });
    }
  );
});

// =====================
// 🔐 LOGIN
// =====================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {

      if (err) {
        return res.json({
          success: false,
          message: "Database error"
        });
      }

      if (result.length === 0) {
        return res.json({
          success: false,
          message: "User not found"
        });
      }

      const user = result[0];

      const isMatch = await bcrypt.compare(
        password,
        user.password
      );

      if (!isMatch) {
        return res.json({
          success: false,
          message: "Invalid password"
        });
      }

      const token = jwt.sign(
  {
    user_id: user.user_id,
    email: user.email,
    role: user.role
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "7d"
  }
);

      delete user.password;

      res.json({
        success: true,
        message: "Login successful",
        token: token,
        user: user
      });

    }
  );
});
app.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {

      if (err) {
        return res.json({
          success: false,
          message: "Database error",
        });
      }

      if (result.length === 0) {
        return res.json({
          success: false,
          message: "Email not found",
        });
      }

      const otp = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      const expiry = new Date(
        Date.now() + 10 * 60 * 1000
      );

      db.query(
        "UPDATE users SET reset_otp = ?, reset_otp_expiry = ? WHERE email = ?",
        [otp, expiry, email],
        async (err) => {

          if (err) {
            return res.json({
              success: false,
              message: "Failed to save OTP",
            });
          }

          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          try {

            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: email,
              subject: "Password Reset OTP",

              text: `Your password reset OTP is: ${otp}. It is valid for 10 minutes.`,
            });

            res.json({
              success: true,
              message: "OTP sent to your email",
            });

          } catch (error) {

            console.log("Email Error:", error);

            res.json({
              success: false,
              message: "Failed to send OTP",
            });

          }

        }
      );
    }
  );
});
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (err, result) => {

      if (err) {
        return res.json({
          success: false,
          message: "Database error",
        });
      }

      if (result.length === 0) {
        return res.json({
          success: false,
          message: "User not found",
        });
      }

      const user = result[0];

      if (user.reset_otp !== otp) {
        return res.json({
          success: false,
          message: "Invalid OTP",
        });
      }

      if (
        !user.reset_otp_expiry ||
        new Date() > new Date(user.reset_otp_expiry)
      ) {
        return res.json({
          success: false,
          message: "OTP expired",
        });
      }

      res.json({
        success: true,
        message: "OTP verified",
      });
    }
  );
});
app.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {

      if (err) {
        return res.json({
          success: false,
          message: "Database error",
        });
      }

      if (result.length === 0) {
        return res.json({
          success: false,
          message: "User not found",
        });
      }

      const user = result[0];

      if (user.reset_otp !== otp) {
        return res.json({
          success: false,
          message: "Invalid OTP",
        });
      }

      if (
        !user.reset_otp_expiry ||
        new Date() > new Date(user.reset_otp_expiry)
      ) {
        return res.json({
          success: false,
          message: "OTP expired",
        });
      }

      const hashedPassword = await bcrypt.hash(
        newPassword,
        10
      );

      db.query(
        `UPDATE users
         SET password = ?,
             reset_otp = NULL,
             reset_otp_expiry = NULL
         WHERE email = ?`,
        [hashedPassword, email],
        (err) => {

          if (err) {
            return res.json({
              success: false,
              message: "Password reset failed",
            });
          }

          res.json({
            success: true,
            message: "Password reset successfully",
          });

        }
      );
    }
  );
});
app.get("/profile", verifyToken, (req, res) => {

  db.query(
    "SELECT user_id, name, email, phone, address FROM users WHERE user_id = ?",
    [req.user.user_id],
    (err, result) => {

      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database Error",
        });
      }

      if (result.length == 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        user: result[0],
      });

    },
  );

});



// =====================
// 🛒 PLACE ORDER
// =====================
app.post("/place-order", (req, res) => {
  const { user_id, total_amount, items, payment_method } = req.body;

  const orderSql =
    "INSERT INTO orders (user_id, total_amount, status, payment_method) VALUES (?, ?, ?, ?)";

  db.query(orderSql, [user_id, total_amount, "Pending", payment_method], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: "Order failed" });
    }

    const orderId = result.insertId;

    if (!items || items.length === 0) {
      return res.json({
        success: true,
        message: "Order created (no items)"
      });
    }

    items.forEach((item) => {
      const itemSql =
        "INSERT INTO order_items (order_id, quantity, price, product_id) VALUES (?, ?, ?, ?)";

      db.query(itemSql, [
        orderId,
        item.quantity,
        item.price,
        item.product_id
      ]);
    });

    res.json({
      success: true,
      order_id: orderId,
      message: "Order placed successfully 🚀"
    });
  });
});
// =====================
// 📦 MY ORDERS
// =====================
app.get("/my-orders", verifyToken, (req, res) => {

  const sql = `
    SELECT
      orders.order_id,
      orders.total_amount,
      orders.status,
      orders.payment_method,
      orders.created_at,

      order_items.quantity,
      order_items.price AS item_price,

      products.id AS product_id,
      products.name AS product_name,
      products.image AS product_image

    FROM orders

    JOIN order_items
      ON orders.order_id = order_items.order_id

    JOIN products
      ON order_items.product_id = products.id

    WHERE orders.user_id = ?

    ORDER BY orders.order_id DESC
  `;

  db.query(sql, [req.user.user_id], (err, result) => {

    if (err) {

      console.log(err);

      return res.status(500).json({
        success: false,
        message: "Database Error"
      });

    }

    const ordersMap = {};

    result.forEach((row) => {

      if (!ordersMap[row.order_id]) {

        ordersMap[row.order_id] = {

          order_id: row.order_id,

          total_amount: row.total_amount,

          status: row.status,

          payment_method: row.payment_method,

          created_at: row.created_at,

          items: []

        };

      }

      ordersMap[row.order_id].items.push({

        product_id: row.product_id,

        name: row.product_name,

        image: row.product_image,

        quantity: row.quantity,

        price: row.item_price

      });

    });

    res.json({

      success: true,

      orders: Object.values(ordersMap)

    });

  });

});
// =====================
// 📦 ORDER DETAILS
// =====================
app.get("/order-details/:orderId", verifyToken, (req, res) => {

  const orderId = req.params.orderId;

  const orderSql = `
  SELECT
      order_id,
      total_amount,
      status,
      payment_method,
      created_at,
      DATE_ADD(created_at, INTERVAL 5 DAY) AS estimated_delivery
  FROM orders
  WHERE order_id = ? AND user_id = ?
`;
    
  db.query(orderSql, [orderId, req.user.user_id], (err, orderResult) => {

    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database Error"
      });
    }

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const itemsSql = `
      SELECT
  order_items.quantity,
  order_items.price,
  products.*
      FROM order_items
      INNER JOIN products
        ON order_items.product_id = products.id
      WHERE order_items.order_id = ?
    `;

    db.query(itemsSql, [orderId], (err, itemsResult) => {

      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database Error"
        });
      }

      res.json({
        success: true,
        order: orderResult[0],
        items: itemsResult
      });

    });

  });

});
app.put("/cancel-order/:orderId", verifyToken, (req, res) => {

  const orderId = req.params.orderId;

  const sql = `
    UPDATE orders
    SET status = 'Cancelled'
    WHERE order_id = ?
      AND user_id = ?
      AND status = 'Pending'
  `;

  db.query(sql, [orderId, req.user.user_id], (err, result) => {

    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database Error"
      });
    }

    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: "Order cannot be cancelled"
      });
    }

    res.json({
      success: true,
      message: "Order cancelled successfully"
    });

  });

});
// =====================
// 💳 PAYMENT INIT (SIMULATION)
// =====================
app.post("/init-payment", (req, res) => {
  const { amount, method } = req.body;

  const response = {
    success: true,
    transaction_id: "TXN_" + Date.now(),
    amount: amount,
    method: method,
    status: "INITIATED"
  };

  res.json(response);
});
app.post("/add-review", verifyToken, (req, res) => {

  const { product_id, rating, comment } = req.body;

  const user_id = req.user.user_id;

  const sql = `
    INSERT INTO reviews
    (product_id, user_id, rating, comment)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [product_id, user_id, rating, comment],
    (err, result) => {

      if (err) {
        console.log(err);
        return res.status(500).json({
          success: false,
          message: "Database Error"
        });
      }

      res.json({
        success: true,
        message: "Review Added Successfully"
      });

    }
  );

});
app.get("/can-review/:productId", verifyToken, (req, res) => {

  const userId = req.user.user_id;
  const productId = req.params.productId;

  const sql = `
    SELECT *
    FROM order_items oi
    JOIN orders o
      ON oi.order_id = o.order_id
    WHERE o.user_id = ?
      AND oi.product_id = ?
    LIMIT 1
  `;

  db.query(sql, [userId, productId], (err, result) => {

    if (err) {
      return res.status(500).json({
        success: false
      });
    }

    res.json({
      success: true,
      canReview: result.length > 0
    });

  });

});
app.get("/product-reviews/:id", (req, res) => {

  const productId = req.params.id;

  const sql = `
    SELECT
      reviews.rating,
      reviews.comment,
      users.name
    FROM reviews
    JOIN users
      ON reviews.user_id = users.user_id
    WHERE reviews.product_id = ?
    ORDER BY reviews.review_id DESC
  `;

  db.query(sql, [productId], (err, result) => {

    if (err) {
      console.log(err);

      return res.status(500).json({
        success: false,
        message: "Database Error"
      });
    }

    res.json({
      success: true,
      reviews: result
    });

  });

});
app.get("/reviews/:productId", (req, res) => {

  const productId = req.params.productId;

  const sql = `
    SELECT
      reviews.*,
      users.name
    FROM reviews
    JOIN users
      ON reviews.user_id = users.user_id
    WHERE product_id = ?
    ORDER BY review_id DESC
  `;

  db.query(sql, [productId], (err, result) => {

    if (err) {
      console.log(err);

      return res.status(500).json({
        success: false,
        message: "Database Error"
      });
    }

    res.json({
      success: true,
      reviews: result
    });

  });

});
app.delete("/delete-review/:reviewId", verifyToken, (req, res) => {

  const reviewId = req.params.reviewId;

  const sql = `
    DELETE FROM reviews
    WHERE review_id = ?
    AND user_id = ?
  `;

  db.query(
    sql,
    [reviewId, req.user.user_id],
    (err, result) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          message: "Database Error"
        });
      }

      if (result.affectedRows == 0) {
        return res.json({
          success: false,
          message: "Review not found"
        });
      }

      res.json({
        success: true,
        message: "Review deleted successfully"
      });

    }
  );

});
app.put("/edit-review/:reviewId", verifyToken, (req, res) => {

  const reviewId = req.params.reviewId;

  const { rating, comment } = req.body;

  const sql = `
    UPDATE reviews
    SET rating = ?, comment = ?
    WHERE review_id = ?
    AND user_id = ?
  `;

  db.query(
    sql,
    [
      rating,
      comment,
      reviewId,
      req.user.user_id
    ],
    (err, result) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          message: "Database Error"
        });
      }

      res.json({
        success: true,
        message: "Review Updated"
      });

    }
  );

});
// =====================
// 📊 ADMIN DASHBOARD
// =====================
app.get(
  "/admin/dashboard",
  verifyToken,
  verifyAdmin,
  (req, res) => {

    const dashboard = {};

    // 👥 TOTAL USERS
    db.query(
      "SELECT COUNT(*) AS totalUsers FROM users",
      (err, users) => {

        if (err) {
          return res.status(500).json({
            success: false,
            message: "Users query failed",
          });
        }

        dashboard.totalUsers = users[0].totalUsers;

        // 📦 TOTAL PRODUCTS
        db.query(
          "SELECT COUNT(*) AS totalProducts FROM products",
          (err, products) => {

            if (err) {
              return res.status(500).json({
                success: false,
                message: "Products query failed",
              });
            }

            dashboard.totalProducts =
                products[0].totalProducts;

            // 🛒 TOTAL ORDERS
            db.query(
              "SELECT COUNT(*) AS totalOrders FROM orders",
              (err, orders) => {

                if (err) {
                  return res.status(500).json({
                    success: false,
                    message: "Orders query failed",
                  });
                }

                dashboard.totalOrders =
                    orders[0].totalOrders;

                // 💰 TOTAL REVENUE
                db.query(
                  `
                  SELECT IFNULL(
                    SUM(total_amount),
                    0
                  ) AS totalRevenue
                  FROM orders
                  WHERE status != 'Cancelled'
                  `,
                  (err, revenue) => {

                    if (err) {
                      return res.status(500).json({
                        success: false,
                        message: "Revenue query failed",
                      });
                    }

                    dashboard.totalRevenue =
                        revenue[0].totalRevenue;

                    // 🟠 PENDING ORDERS
                    db.query(
                      `
                      SELECT COUNT(*) AS pendingOrders
                      FROM orders
                      WHERE status = 'Pending'
                      `,
                      (err, pending) => {

                        if (err) {
                          return res.status(500).json({
                            success: false,
                          });
                        }

                        dashboard.pendingOrders =
                            pending[0].pendingOrders;

                        // 🔵 CONFIRMED ORDERS
                        db.query(
                          `
                          SELECT COUNT(*) AS confirmedOrders
                          FROM orders
                          WHERE status = 'Confirmed'
                          `,
                          (err, confirmed) => {

                            if (err) {
                              return res.status(500).json({
                                success: false,
                              });
                            }

                            dashboard.confirmedOrders =
                                confirmed[0].confirmedOrders;

                            // 🚚 SHIPPED ORDERS
                            db.query(
                              `
                              SELECT COUNT(*) AS shippedOrders
                              FROM orders
                              WHERE status = 'Shipped'
                              `,
                              (err, shipped) => {

                                if (err) {
                                  return res.status(500).json({
                                    success: false,
                                  });
                                }

                                dashboard.shippedOrders =
                                    shipped[0].shippedOrders;

                                // 🟢 DELIVERED ORDERS
                                db.query(
                                  `
                                  SELECT COUNT(*) AS deliveredOrders
                                  FROM orders
                                  WHERE status = 'Delivered'
                                  `,
                                  (err, delivered) => {

                                    if (err) {
                                      return res.status(500).json({
                                        success: false,
                                      });
                                    }

                                    dashboard.deliveredOrders =
                                        delivered[0].deliveredOrders;

                                    // ❌ CANCELLED ORDERS
                                    db.query(
                                      `
                                      SELECT COUNT(*) AS cancelledOrders
                                      FROM orders
                                      WHERE status = 'Cancelled'
                                      `,
                                      (err, cancelled) => {

                                        if (err) {
                                          return res.status(500).json({
                                            success: false,
                                          });
                                        }

                                        dashboard.cancelledOrders =
                                            cancelled[0].cancelledOrders;

                                        // ⚠️ LOW STOCK PRODUCTS
                                        db.query(
                                          `
                                          SELECT COUNT(*) AS lowStockProducts
                                          FROM products
                                          WHERE stock <= 5
                                          `,
                                          (err, lowStock) => {

                                            if (err) {
                                              return res.status(500).json({
                                                success: false,
                                              });
                                            }

                                            dashboard.lowStockProducts =
                                                lowStock[0].lowStockProducts;

                                            // ✅ FINAL RESPONSE
                                            res.json({
                                              success: true,
                                              dashboard,
                                            });

                                          }
                                        );

                                      }
                                    );

                                  }
                                );

                              }
                            );

                          }
                        );

                      }
                    );

                  }
                );

              }
            );

          }
        );

      }
    );

  }
);
// =====================
// 👥 ADMIN - ALL USERS
// =====================

app.get("/admin/users", verifyToken, verifyAdmin, (req, res) => {

  const sql = `
    SELECT
      user_id,
      name,
      email,
      phone,
      address,
      role
    FROM users
    ORDER BY user_id DESC
  `;

  db.query(sql, (err, result) => {

    if (err) {

      console.log(err);

      return res.status(500).json({
        success: false,
        message: "Database Error"
      });

    }

    res.json({
      success: true,
      users: result
    });

  });

});
// =====================
// 📦 ADMIN - ALL PRODUCTS
// =====================
app.get("/admin/products", verifyToken, verifyAdmin, (req, res) => {

  db.query(
    "SELECT * FROM products ORDER BY id DESC",
    (err, result) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          message: "Database Error"
        });
      }

      res.json({
        success: true,
        products: result
      });

    }
  );

});
// =====================
// 📦 ADMIN - ALL ORDERS
// =====================

app.get("/admin/orders", verifyToken, verifyAdmin, (req, res) => {

  const sql = `
    SELECT
      orders.order_id,
      orders.order_date,
      orders.total_amount,
      orders.status,
      orders.payment_method,
      orders.created_at,
      users.name,
      users.email
    FROM orders
    JOIN users
      ON orders.user_id = users.user_id
    ORDER BY orders.order_id DESC
  `;

  db.query(sql, (err, result) => {

    if (err) {

      console.log(err);

      return res.status(500).json({
        success: false,
        message: "Database Error"
      });

    }

    res.json({
      success: true,
      orders: result
    });

  });

});
// =====================
// ✏ ADMIN - UPDATE ORDER STATUS
// =====================

app.put("/admin/update-order-status/:orderId", verifyToken, verifyAdmin, (req, res) => {

  const orderId = req.params.orderId;
  const { status } = req.body;

  const sql = `
    UPDATE orders
    SET status = ?
    WHERE order_id = ?
  `;

  db.query(
    sql,
    [status, orderId],
    (err, result) => {

      if (err) {

        console.log(err);

        return res.status(500).json({
          success: false,
          message: "Database Error"
        });

      }

      res.json({
        success: true,
        message: "Order status updated successfully"
      });

    }
  );

});
// =====================
// 📦 ADMIN - ORDER DETAILS
// =====================

app.get(
  "/admin/order-details/:orderId",
  verifyToken,
  verifyAdmin,
  (req, res) => {

    const orderId = req.params.orderId;

    const orderSql = `
      SELECT
        orders.order_id,
        orders.order_date,
        orders.total_amount,
        orders.status,
        orders.payment_method,
        orders.created_at,
        users.name,
        users.email,
        users.phone,
        users.address
      FROM orders
      JOIN users
        ON orders.user_id = users.user_id
      WHERE orders.order_id = ?
    `;

    db.query(orderSql, [orderId], (err, orderResult) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          message: "Database Error"
        });
      }

      if (orderResult.length === 0) {

        return res.status(404).json({
          success: false,
          message: "Order not found"
        });

      }

      const itemsSql = `
        SELECT
          order_items.quantity,
          order_items.price,
          products.id,
          products.name,
          products.image
        FROM order_items
        JOIN products
          ON order_items.product_id = products.id
        WHERE order_items.order_id = ?
      `;

      db.query(
        itemsSql,
        [orderId],
        (err, itemsResult) => {

          if (err) {
            console.log(err);

            return res.status(500).json({
              success: false,
              message: "Database Error"
            });
          }

          res.json({

            success: true,

            order: orderResult[0],

            items: itemsResult

          });

        }
      );

    });

  }
);
// =====================
// 🗑 ADMIN DELETE PRODUCT
// =====================
app.delete("/admin/delete-product/:id", verifyToken, verifyAdmin, (req, res) => {

  const productId = req.params.id;

  db.query(
    "DELETE FROM products WHERE id = ?",
    [productId],
    (err, result) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          message: "Database Error"
        });
      }

      res.json({
        success: true,
        message: "Product Deleted Successfully"
      });

    }
  );

});
// =====================
// ✏ ADMIN EDIT PRODUCT
// =====================
app.put("/admin/edit-product/:id", verifyToken, verifyAdmin, (req, res) => {

  const productId = req.params.id;

  const {
    name,
    price,
    description,
    image
  } = req.body;

  const sql = `
    UPDATE products
    SET
      name = ?,
      price = ?,
      description = ?,
      image = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      name,
      price,
      description,
      image,
      productId
    ],
    (err, result) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          message: "Database Error"
        });
      }

      res.json({
        success: true,
        message: "Product Updated Successfully"
      });

    }
  );

});
// =====================
// ➕ ADMIN ADD PRODUCT
// =====================
app.post("/admin/add-product", verifyToken, verifyAdmin, (req, res) => {

  const {
    name,
    price,
    description,
    image,
    category_id,
    stock,
    discount_percent
  } = req.body;

  const sql = `
    INSERT INTO products
    (
      name,
      price,
      description,
      image,
      category_id,
      stock,
      discount_percent
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      name,
      price,
      description,
      image,
      category_id,
      stock,
      discount_percent
    ],
    (err) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          message: "Database Error"
        });
      }

      res.json({
        success: true,
        message: "Product Added Successfully"
      });

    }
  );

});
// =====================
// 🎨 ADMIN - ALL BANNERS
// =====================

app.get(
  "/admin/banners",
  verifyToken,
  verifyAdmin,
  (req, res) => {

    db.query(
      "SELECT * FROM banners ORDER BY banner_id DESC",
      (err, result) => {

        if (err) {
          console.log(err);

          return res.status(500).json({
            success: false,
            message: "Database Error"
          });
        }

        res.json({
          success: true,
          banners: result
        });

      }
    );

  }
);


// =====================
// ➕ ADMIN - ADD BANNER
// =====================

app.post(
  "/admin/add-banner",
  verifyToken,
  verifyAdmin,
  (req, res) => {

    const {
      image,
      title
    } = req.body;

    if (!image || image.trim() === "") {

      return res.json({
        success: false,
        message: "Image URL is required"
      });

    }

    db.query(
      `
      INSERT INTO banners
      (image, title)
      VALUES (?, ?)
      `,
      [
        image.trim(),
        title || ""
      ],
      (err, result) => {

        if (err) {
          console.log(err);

          return res.status(500).json({
            success: false,
            message: "Database Error"
          });

        }

        res.json({

          success: true,

          message:
              "Banner Added Successfully",

          banner_id:
              result.insertId

        });

      }
    );

  }
);


// =====================
// ✏️ ADMIN - EDIT BANNER
// =====================

app.put(
  "/admin/edit-banner/:id",
  verifyToken,
  verifyAdmin,
  (req, res) => {

    const bannerId =
        req.params.id;

    const {
      image,
      title
    } = req.body;

    if (!image || image.trim() === "") {

      return res.json({

        success: false,

        message:
            "Image URL is required"

      });

    }

    db.query(
      `
      UPDATE banners
      SET
        image = ?,
        title = ?
      WHERE banner_id = ?
      `,
      [
        image.trim(),
        title || "",
        bannerId
      ],
      (err) => {

        if (err) {

          console.log(err);

          return res.status(500).json({

            success: false,

            message:
                "Database Error"

          });

        }

        res.json({

          success: true,

          message:
              "Banner Updated Successfully"

        });

      }
    );

  }
);


// =====================
// 🗑️ ADMIN - DELETE BANNER
// =====================

app.delete(
  "/admin/delete-banner/:id",
  verifyToken,
  verifyAdmin,
  (req, res) => {

    const bannerId =
        req.params.id;

    db.query(
      "DELETE FROM banners WHERE banner_id = ?",
      [bannerId],
      (err) => {

        if (err) {

          console.log(err);

          return res.status(500).json({

            success: false,

            message:
                "Database Error"

          });

        }

        res.json({

          success: true,

          message:
              "Banner Deleted Successfully"

        });

      }
    );

  }
);
// =====================
// 📦 ADMIN - RECENT ORDERS
// =====================

app.get(
  "/admin/recent-orders",
  verifyToken,
  verifyAdmin,
  (req, res) => {

    const sql = `
      SELECT
        orders.order_id,
        orders.total_amount,
        orders.status,
        orders.created_at,
        users.name
      FROM orders
      JOIN users
        ON orders.user_id = users.user_id
      ORDER BY orders.order_id DESC
      LIMIT 5
    `;

    db.query(sql, (err, result) => {

      if (err) {

        console.log(err);

        return res.status(500).json({
          success: false,
          message: "Database Error"
        });

      }

      res.json({
        success: true,
        orders: result
      });

    });

  }
);
// =====================
// ⚠️ ADMIN - LOW STOCK PRODUCTS
// =====================

app.get(
  "/admin/low-stock",
  verifyToken,
  verifyAdmin,
  (req, res) => {

    db.query(
      `
      SELECT
        id,
        name,
        stock
      FROM products
      WHERE stock <= 5
      ORDER BY stock ASC
      `,
      (err, result) => {

        if (err) {

          console.log(err);

          return res.status(500).json({
            success: false,
            message: "Database Error"
          });

        }

        res.json({
          success: true,
          products: result
        });

      }
    );

  }
);
// =====================
// 🚀 START SERVER
// =====================

app.listen(3000, () => {
  console.log("Server running on port 3000 🚀");
  
});