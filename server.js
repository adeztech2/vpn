/*

ADEZ TECH VPN STORE - SERVER

File:
server.js

Purpose:

- Serve the ADEZ TECH VPN Store
- Receive orders from payment.html
- Validate products and prices
- Create unique order IDs
- Provide order status endpoint
- Prepare the project for M-Pesa integration

IMPORTANT:
This demo does NOT confirm real payments.

*/

const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;

/* =========================================================
MIDDLEWARE
========================================================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================================================
SERVE WEBSITE FILES
========================================================= */

app.use(express.static(__dirname));

/* =========================================================
VPN PRODUCTS
========================================================= */

const PRODUCTS = {

"safaricom-300mb": {
    name: "Safaricom 300MB",
    network: "safaricom",
    package: "300mb",
    price: 20
},

"safaricom-500mb": {
    name: "Safaricom 500MB",
    network: "safaricom",
    package: "500mb",
    price: 30
},

"safaricom-1gb": {
    name: "Safaricom 1GB",
    network: "safaricom",
    package: "1gb",
    price: 50
},

"safaricom-unlimited": {
    name: "Safaricom Unlimited",
    network: "safaricom",
    package: "unlimited",
    price: 100
},


"airtel-300mb": {
    name: "Airtel 300MB",
    network: "airtel",
    package: "300mb",
    price: 20
},

"airtel-500mb": {
    name: "Airtel 500MB",
    network: "airtel",
    package: "500mb",
    price: 30
},

"airtel-1gb": {
    name: "Airtel 1GB",
    network: "airtel",
    package: "1gb",
    price: 50
},

"airtel-unlimited": {
    name: "Airtel Unlimited",
    network: "airtel",
    package: "unlimited",
    price: 100
},


"telkom-300mb": {
    name: "Telkom 300MB",
    network: "telkom",
    package: "300mb",
    price: 20
},

"telkom-500mb": {
    name: "Telkom 500MB",
    network: "telkom",
    package: "500mb",
    price: 30
},

"telkom-1gb": {
    name: "Telkom 1GB",
    network: "telkom",
    package: "1gb",
    price: 50
},

"telkom-unlimited": {
    name: "Telkom Unlimited",
    network: "telkom",
    package: "unlimited",
    price: 100
}

};

/* =========================================================
TEMPORARY ORDER STORAGE

This is only for development.

For production use:
MongoDB / PostgreSQL / Supabase should be used.
========================================================= */

const orders = new Map();

/* =========================================================
GENERATE ORDER ID
========================================================= */

function generateOrderId(){

const random =
    crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase();

return "ADEZ-" + random;

}

/* =========================================================
NORMALIZE PHONE
========================================================= */

function normalizePhone(phone){

if(!phone){
    return null;
}

phone =
    String(phone)
    .replace(/\s+/g,"")
    .replace(/-/g,"");


if(phone.startsWith("07")){

    phone =
        "254" +
        phone.substring(1);

}

if(phone.startsWith("01")){

    phone =
        "254" +
        phone.substring(1);

}


return phone;

}

/* =========================================================
VALIDATE KENYAN PHONE
========================================================= */

function validPhone(phone){

return /^254(7|1)[0-9]{8}$/.test(phone);

}

/* =========================================================
CREATE ORDER
========================================================= */

app.post("/api/orders", (req,res) => {

try{

    const {
        productId,
        phone,
        email
    } = req.body;


    /* CHECK PRODUCT */

    const product =
        PRODUCTS[productId];


    if(!product){

        return res.status(400).json({

            success:false,

            message:
                "Invalid product."

        });

    }


    /* NORMALIZE PHONE */

    const customerPhone =
        normalizePhone(phone);


    if(!validPhone(customerPhone)){

        return res.status(400).json({

            success:false,

            message:
                "Invalid Kenyan phone number."

        });

    }


    /* CREATE ORDER */

    const orderId =
        generateOrderId();


    const order = {

        orderId,

        productId,

        product:
            product.name,

        network:
            product.network,

        package:
            product.package,

        amount:
            product.price,

        phone:
            customerPhone,

        email:
            email || null,

        status:
            "PENDING_PAYMENT",

        createdAt:
            new Date().toISOString()

    };


    orders.set(
        orderId,
        order
    );


    console.log(
        "New order:",
        order
    );


    return res.json({

        success:true,

        message:
            "Order created successfully.",

        order

    });

}

catch(error){

    console.error(
        "Create order error:",
        error
    );


    return res.status(500).json({

        success:false,

        message:
            "Unable to create order."

    });

}

});

/* =========================================================
GET ORDER
========================================================= */

app.get(
"/api/orders/:orderId",
(req,res) => {

    const order =
        orders.get(
            req.params.orderId
        );


    if(!order){

        return res.status(404).json({

            success:false,

            message:
                "Order not found."

        });

    }


    return res.json({

        success:true,

        order

    });

}

);

/* =========================================================
DEMO PAYMENT ENDPOINT

IMPORTANT:

This endpoint only demonstrates the API structure.

It does NOT represent a real M-Pesa payment.

========================================================= */

app.post(
"/api/payment",
(req,res) => {

    try{

        const {
            orderId,
            phone
        } = req.body;


        const order =
            orders.get(orderId);


        if(!order){

            return res.status(404).json({

                success:false,

                message:
                    "Order not found."

            });

        }


        const customerPhone =
            normalizePhone(phone);


        if(!validPhone(customerPhone)){

            return res.status(400).json({

                success:false,

                message:
                    "Invalid phone number."

            });

        }


        /*
         * REAL M-PESA INTEGRATION WILL GO HERE.
         *
         * The production version will:
         *
         * 1. Generate Daraja OAuth token
         * 2. Create STK Push
         * 3. Send payment request
         * 4. Receive callback
         * 5. Verify transaction
         * 6. Update order status
         * 7. Release the correct VPN file
         */


        order.status =
            "AWAITING_PAYMENT";


        orders.set(
            orderId,
            order
        );


        return res.json({

            success:true,

            message:
                "Payment request prepared.",

            orderId,

            status:
                order.status

        });

    }

    catch(error){

        console.error(
            "Payment error:",
            error
        );


        return res.status(500).json({

            success:false,

            message:
                "Payment request failed."

        });

    }

}

);

/* =========================================================
PAYMENT CALLBACK PLACEHOLDER
========================================================= */

app.post(
"/api/payment/callback",
(req,res) => {

    console.log(
        "Payment callback received:",
        JSON.stringify(
            req.body,
            null,
            2
        )
    );


    /*
     * Real M-Pesa callback processing
     * will be added here.
     */


    return res.json({

        ResultCode:0,

        ResultDesc:
            "Callback received."

    });

}

);

/* =========================================================
DEVELOPMENT PAYMENT CONFIRMATION

WARNING:
DO NOT expose this endpoint in production.

It exists only so you can test the complete
store -> payment -> success flow before connecting
the real payment gateway.
========================================================= */

app.post(
"/api/dev/confirm-payment",
(req,res) => {

    const {
        orderId
    } = req.body;


    const order =
        orders.get(orderId);


    if(!order){

        return res.status(404).json({

            success:false,

            message:
                "Order not found."

        });

    }


    order.status =
        "PAID";


    /*
     * In production this must only happen
     * after verified M-Pesa callback data.
     */


    orders.set(
        orderId,
        order
    );


    return res.json({

        success:true,

        message:
            "Development payment confirmed.",

        order

    });

}

);

/* =========================================================
HEALTH CHECK
========================================================= */

app.get(
"/api/health",
(req,res) => {

    res.json({

        success:true,

        service:
            "ADEZ TECH VPN STORE",

        status:
            "online",

        time:
            new Date().toISOString()

    });

}

);

/* =========================================================
HOME PAGE
========================================================= */

app.get(
"/",
(req,res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

}

);

/* =========================================================
404
========================================================= */

app.use(
(req,res) => {

    res.status(404).json({

        success:false,

        message:
            "Page or API endpoint not found."

    });

}

);

/* =========================================================
ERROR HANDLER
========================================================= */

app.use(
(error,req,res,next) => {

    console.error(
        "Server error:",
        error
    );


    res.status(500).json({

        success:false,

        message:
            "Internal server error."

    });

}

);

/* =========================================================
START SERVER
========================================================= */

app.listen(
PORT,
() => {

    console.log(
        "======================================"
    );

    console.log(
        " ADEZ TECH VPN STORE"
    );

    console.log(
        " Server running on port:",
        PORT
    );

    console.log(
        "======================================"
    );

}

);
