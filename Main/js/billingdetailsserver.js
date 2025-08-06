const express = require(“express”);
const bodyParser = require(“body-parser”);
const cors = require(“cors”);
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.json());

// API endpoint to process returns
app.post("/api/processReturn", (req, res) => {
    const returnData = req.body;
    console.log("Return request received:", returnData);
    res.json({
        status: "success",
        refundID: returnData.refundId,
        refundAmount: returnData.refundAmount,
        refundDate: returnData.refundDate,
        confirmationID: "RefundID" + Math.floor(Math.random() * 100000)
    });
});

// Starts the server and listens for incoming requests.
app.listen(PORT, () => {
    console.log(`Return processing`);
});
