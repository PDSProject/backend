const bcrypt = require('bcryptjs');
const db = require('../config/database')

async function startOrdercon(req, res) {
    console.log("hey")
    const { clientUsername, loggedInUser } = req.body;

    if (!loggedInUser) {
        return res.status(403).json({ message: "Not logged in" });
    }

    // Check if the user is a staff member
    db.query('SELECT roleID FROM Act WHERE userName = ?', [loggedInUser], (err, staffCheckResult) => {
        if (err) {
            console.error('Error checking staff role:', err);
            return res.status(500).json({ message: "Server error occurred" });
        }
        console.log(staffCheckResult)

        if (!staffCheckResult || staffCheckResult[0].roleID !== 'staff') {
            console.log(staffCheckResult)
            return res.status(403).json({ message: "You must be a staff member to accept donations." });
        }
        // Check if the client exists
        db.query('SELECT * FROM Person WHERE userName = ?', [clientUsername], (err, clientResult) => {
            if (err) return res.status(500).json({ message: "Database error" });

            if (clientResult.length === 0) {
                return res.status(400).json({ message: "Client does not exist" });
            }

            // Create a new order ID and save it in the session
            db.query('INSERT INTO Ordered (orderDate, supervisor, client) VALUES (NOW(), ?, ?)', [loggedInUser, clientUsername], (err, orderResult) => {
                if (err) return res.status(500).json({ message: "Database error" });

                const orderID = orderResult.insertId;
                req.session.orderID = orderID; // Store orderID in session
                res.status(200).json({ message: "Order started", orderID });
            });
        });
    });

}


// Not Using:

async function addItemOrdercon(req, res) {
    const { mainCategory, subCategory, itemID } = req.body;

    if (!req.session.orderID) {
        return res.status(400).json({ message: "No order started yet" });
    }

    // Check if the item is available and not already ordered
    db.query('SELECT * FROM Item WHERE mainCategory = ? AND subCategory = ? AND ItemID = ? AND ItemID NOT IN (SELECT ItemID FROM ItemIn WHERE orderID = ?)',
        [mainCategory, subCategory, itemID, req.session.orderID], (err, itemResult) => {
            if (err) return res.status(500).json({ message: "Database error" });

            if (itemResult.length === 0) {
                return res.status(400).json({ message: "Item is either unavailable or already ordered" });
            }

            // Add the item to the current order
            db.query('INSERT INTO ItemIn (ItemID, orderID) VALUES (?, ?)', [itemID, req.session.orderID], (err, result) => {
                if (err) return res.status(500).json({ message: "Database error" });

                res.status(200).json({ message: "Item added to the order" });
            });
        });
}


module.exports = { startOrdercon, addItemOrdercon }