const express = require("express")
const router = express.Router()
const db = require('../config/database')
const { startOrdercon, addItemOrdercon, myorder } = require('../controllers/order_con')

router.post('/start-order', startOrdercon)

// Not Using:
router.post('/add-item-order', addItemOrdercon)
router.get('/my-order', myorder)


// Assuming db is already defined to access the database

// Get all categories
router.get("/get-categories", async (req, res) => {
    try {
        const [categories] = await db.promise().query("SELECT DISTINCT mainCategory FROM Item");
        res.json(categories.map(item => item.mainCategory));
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).json({ message: "Error fetching categories." });
    }
});

// Get subcategories based on category
router.get("/get-subcategories", async (req, res) => {
    const { category } = req.query;
    try {
        const [subcategories] = await db.promise().query(
            "SELECT DISTINCT subCategory FROM Item WHERE mainCategory = ?",
            [category]
        );
        res.json(subcategories.map(item => item.subCategory));
    } catch (err) {
        console.error("Error fetching subcategories:", err);
        res.status(500).json({ message: "Error fetching subcategories." });
    }
});

// Get available items based on category and subcategory
router.get("/get-items", async (req, res) => {
    const { category, subcategory } = req.query;
    try {
        const [items] = await db.promise().query(
            `SELECT * FROM Item 
         WHERE mainCategory = ? AND subCategory = ? 
         AND ItemID NOT IN (SELECT ItemID FROM ItemIn)`,
            [category, subcategory]
        );
        res.json(items);
    } catch (err) {
        console.error("Error fetching items:", err);
        res.status(500).json({ message: "Error fetching items." });
    }
});

router.post("/add-to-order", async (req, res) => {
    const { category, subcategory, itemID, orderID } = req.body;
    // Assuming the active order is stored in the session

    // Ensure there is an active order
    if (!orderID) {
        return res.status(400).json({ message: "No active order found. Please start an order first." });
    }

    try {
        // Check if the item is available (not already ordered)
        const [items] = await db.promise().query(
            `SELECT * FROM Item 
         WHERE mainCategory = ? AND subCategory = ? 
         AND ItemID = ? AND ItemID NOT IN (SELECT ItemID FROM ItemIn WHERE orderID = ?)`,
            [category, subcategory, itemID, orderID]
        );

        if (items.length === 0) {
            return res.status(404).json({ message: "Item not available or already ordered in this order." });
        }

        // Add item to the active order
        await db.promise().query(
            "INSERT INTO ItemIn (ItemID, orderID, found) VALUES (?, ?, ?)",
            [itemID, orderID, false]
        );

        // Respond with success message
        res.status(200).json({ message: "Item added to the order successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error adding item to the order." });
    }
})

// 7th feature
router.post("/prepare-order", async (req, res) => {
    const { orderID, loggedInUser } = req.body;

    try {
        // Check if the order exists
        const [orders] = await db.promise().query("SELECT * FROM Ordered WHERE orderID = ?", [orderID]);

        if (orders.length === 0) {
            return res.status(404).json({ message: "Order not found." });
        }

        // Update items in the order to 'holding location'
        const holdingLocation = { roomNum: 0, shelfNum: 0 }; // Example holding location
        await db.promise().query(
            "UPDATE Piece SET roomNum = ?, shelfNum = ? WHERE ItemID IN (SELECT ItemID FROM ItemIn WHERE orderID = ?)",
            [holdingLocation.roomNum, holdingLocation.shelfNum, orderID]
        );

        // Insert into Delivered table
        const deliveryUser = loggedInUser; // Assuming the logged-in user is assigned
        await db.promise().query(
            "INSERT INTO Delivered (orderID, userName, status, date) VALUES (?, ?, 'Pending', CURRENT_DATE)",
            [orderID, deliveryUser]
        );

        res.status(200).json({ message: "Order prepared for delivery successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error preparing order for delivery." });
    }
});

module.exports = router