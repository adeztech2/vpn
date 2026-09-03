const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================================
MIDDLEWARE
========================================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all frontend files
app.use(express.static(__dirname));

/* =========================================
VPN PRODUCTS
========================================= */

const products = {
"safaricom-300mb": {
id: "safaricom-300mb",
name: "Safaricom 300MB VPN",
network: "Safaricom",
package: "300MB",
amount: 20
},

"safaricom-500mb": {
    id: "safaricom-500mb",
    name: "Safaricom 500MB VPN",
    network: "Safaricom",
    package: "500MB",
    amount: 30
},

"safaricom-1gb": {
    id: "safaricom-1gb",
    name: "Safaricom 1GB VPN",
    network: "Safaricom",
    package: "1GB",
    amount: 50
},

"safaricom-unlimited": {
    id: "safaricom-unlimited",
    name: "Safaricom Unlimited VPN",
    network: "Safaricom",
    package: "Unlimited",
    amount: 100
},

"airtel-300mb": {
    id: "airtel-300mb",
    name: "Airtel 300MB VPN",
    network: "Airtel",
    package: "300MB",
    amount: 20
},

"airtel-500mb": {
    id: "airtel-500mb",
    name: "Airtel 500MB VPN",
    network: "Airtel",
    package: "500MB",
    amount: 30
},

"airtel-1gb": {
    id: "airtel-1gb",
    name: "Airtel 1GB VPN",
    network: "Airtel",
    package: "1GB",
    amount: 50
},

"airtel-unlimited": {
    id: "airtel-unlimited",
    name: "Airtel Unlimited VPN",
    network: "Airtel",
    package: "Unlimited",
    amount: 100
},

"telkom-300mb": {
    id: "telkom-300mb",
    name: "Telkom 300MB VPN",
    network: "Telkom",
    package: "300MB",
    amount: 20
},

"telkom-500mb": {
    id: "telkom-500mb",
    name: "Telkom 500MB VPN",
    network: "Telkom",
    package: "500MB",
    amount: 30
},

"telkom-1gb": {
    id: "telkom-1gb",
    name: "Telkom 1GB VPN",
    network: "Telkom",
    package: "1GB",
    amount: 50
},

"telkom-unlimited": {
    id: "telkom-unlimited",
    name: "Telkom Unlimited VPN",
    network: "Telkom",
    package: "Unlimited",
    amount: 100
}

};

/* =========================================
TEMPORARY ORDER STORAGE

For testing only.

Orders disappear when the server restarts.
Later we can connect Supabase/MongoDB.
========================================= */

const orders = new Map();

/* =========================================
GENERATE ORDER ID
========================================= */

function generateOrderId() {
const random = crypto
.randomBytes(5)
.toString("hex")
.toUpperCase();

return `ADEZ-${random}`;

}

/* =========================================
PHONE NORMALIZATION
========================================= */

function normalizePhone(phone) {
if (!phone) {
return "";
}

let value = String(phone)
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "");

if (value.startsWith("+254")) {
    value = value.substring(1);
}

if (value.startsWith("07") || value.startsWith("01")) {
    value = "254" + value.substring(1);
}

return value;

}

/* =========================================
PHONE VALIDATION
========================================= */

function validPhone(phone) {
return /^254(7|1)[0-9]{8}$/.test(phone);
}

/* =========================================
HEALTH CHECK
========================================= */

app.get("/api/health", (req, res) => {
res.json({
success: true,
service: "ADEZ TECH VPN STORE",
status: "online",
time: new Date().toISOString()
});
});

/* =========================================
GET PRODUCTS
========================================= */

app.get("/api/products", (req, res) => {
res.json({
success: true,
products: Object.values(products)
});
});

/* =========================================
CREATE ORDER
========================================= */

app.post("/api/orders", (req, res) => {
try {
const {
productId,
phone,
email
} = req.body;

    // Check product
    const product = products[productId];

    if (!product) {
        return res.status(400).json({
            success: false,
            message: "Invalid VPN product."
        });
    }

    // Normalize phone
    const normalizedPhone = normalizePhone(phone);

    // Check phone
    if (!validPhone(normalizedPhone)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid Kenyan M-Pesa number."
        });
    }

    // Validate email if supplied
    if (email) {
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address."
            });
        }
    }

    // Generate order ID
    const orderId = generateOrderId();

    // Create order
    const order = {
        orderId,
        productId: product.id,
        product: product.name,
        network: product.network,
        package: product.package,
        amount: product.amount,
        phone: normalizedPhone,
        email: email || "",
        status: "PENDING_PAYMENT",
        createdAt: new Date().toISOString()
    };

    // Save order
    orders.set(orderId, order);

    console.log(
        `[ORDER] ${orderId} | ${product.name} | KSh ${product.amount}`
    );

    return res.status(201).json({
        success: true,
        message: "Order created successfully.",
        order: {
            orderId: order.orderId,
            product: order.product,
            network: order.network,
            package: order.package,
            amount: order.amount,
            status: order.status,
            createdAt: order.createdAt
        }
    });

} catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    return res.status(500).json({
        success: false,
        message: "Unable to create order."
    });
}

});

/* =========================================
GET SINGLE ORDER
========================================= */

app.get("/api/orders/:orderId", (req, res) => {
const order = orders.get(req.params.orderId);

if (!order) {
    return res.status(404).json({
        success: false,
        message: "Order not found."
    });
}

return res.json({
    success: true,
    order
});

});

/* =========================================
DEMO PAYMENT CONFIRMATION

DEVELOPMENT ONLY.

This does NOT charge M-Pesa.
It is only for testing the order system.
========================================= */

app.post("/api/dev/confirm-payment", (req, res) => {
const { orderId } = req.body;

const order = orders.get(orderId);

if (!order) {
    return res.status(404).json({
        success: false,
        message: "Order not found."
    });
}

order.status = "PAID";
order.paidAt = new Date().toISOString();

orders.set(orderId, order);

console.log(`[DEMO PAYMENT] ${orderId} marked as PAID`);

return res.json({
    success: true,
    message: "Demo payment confirmed.",
    order
});

});

/* =========================================
REAL PAYMENT PLACEHOLDER

M-Pesa STK Push will be connected here.
========================================= */

app.post("/api/payment", (req, res) => {
return res.status(501).json({
success: false,
message: "M-Pesa payment is not connected yet."
});
});

/* =========================================
M-PESA CALLBACK PLACEHOLDER
========================================= */

app.post("/api/payment/callback", (req, res) => {
console.log(
"M-Pesa callback received:"
);

console.log(
    JSON.stringify(req.body, null, 2)
);

return res.json({
    ResultCode: 0,
    ResultDesc: "Callback received"
});

});

/* =========================================
HOME PAGE
========================================= */

app.get("/", (req, res) => {
res.sendFile(
path.join(__dirname, "index.html")
);
});

/* =========================================
API 404
========================================= */

app.use((req, res, next) => {
if (req.path.startsWith("/api/")) {
return res.status(404).json({
success: false,
message: "API endpoint not found."
});
}

next();

});

/* =========================================
GENERAL 404
========================================= */

app.use((req, res) => {
res.status(404).send(`
<!DOCTYPE html>
<html>
<head>
<title>ADEZ TECH - 404</title>
<style>
body {
background:#050505;
color:white;
font-family:Arial;
text-align:center;
padding:80px 20px;
}

            h1 {
                color:#00ff88;
                font-size:50px;
            }

            a {
                color:#00ff88;
                text-decoration:none;
            }
        </style>
    </head>

    <body>
        <h1>404</h1>
        <p>Page not found.</p>
        <br>
        <a href="/">← Back to ADEZ TECH</a>
    </body>
    </html>
`);

});

/* =========================================
ERROR HANDLER
========================================= */

app.use((err, req, res, next) => {
console.error("SERVER ERROR:", err);

res.status(500).json({
    success: false,
    message: "Internal server error."
});

});

/* =========================================
START SERVER
========================================= */

app.listen(PORT, () => {
console.log("");
console.log("========================================");
console.log("        ADEZ TECH VPN STORE");
console.log("========================================");
console.log("Server running on port ${PORT}");
console.log("http://localhost:${PORT}");
console.log("========================================");
console.log("");
});
