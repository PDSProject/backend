const bcrypt = require('bcryptjs');
const db = require('../config/database')

async function startOrdercon(req, res) {
    const { clientUsername, loggedInUser, itemID } = req.body;

    if (!loggedInUser) {
        return res.status(403).send({ message: "Not logged in" });
    }

    // Check if the user is a staff member
    db.query('SELECT roleID FROM Act WHERE userName = ?', [loggedInUser], (err, staffCheckResult) => {
        if (err) {
            console.error('Error checking staff role:', err);
            return res.status(500).send({ message: "Server error occurred" });
        }

        if (!staffCheckResult || staffCheckResult[0]?.roleID !== 'staff') {
            return res.status(403).send({ message: "You must be a staff member to start an order." });
        }

        // Check if the client exists
        db.query('SELECT * FROM Person WHERE userName = ?', [clientUsername], (err, clientResult) => {
            if (err) return res.status(500).send({ message: "Database error" });

            if (clientResult.length === 0) {
                return res.status(400).send({ message: "Client does not exist" });
            }

            // Check if the client is a staff member
            db.query('SELECT roleID FROM Act WHERE userName = ?', [clientResult[0].userName], (err, clientCheckResult) => {
                if (err) return res.status(500).send({ message: "Database error" });

                if (!clientCheckResult || clientCheckResult[0]?.roleID === 'staff') {
                    return res.status(400).send({ message: "You cannot start an order with a staff." });
                }

                // Create a new order ID and save it in the session
                db.query(
                    'INSERT INTO Ordered (orderDate, supervisor, client) VALUES (NOW(), ?, ?)',
                    [loggedInUser, clientUsername],
                    (err, orderResult) => {
                        if (err) {
                            console.error('Error inserting into Ordered:', err);
                            return res.status(500).send({ message: "Database error" }); // Stop further execution
                        }

                        const orderID = orderResult.insertId;

                        // Insert into ItemIn table
                        db.query(
                            'INSERT INTO ItemIn (ItemID, orderID, found) VALUES (?, ?, 1)',
                            [itemID, orderID],
                            (err) => {
                                if (err) {
                                    console.error('Error inserting into ItemIn:', err);
                                    return res.status(500).send({ message: "Database error" }); // Stop further execution
                                }

                                // Store orderID in session and send response
                                req.session.orderID = orderID;
                                res.status(200).send({ message: "Order started", orderID }); // Only one response sent
                            }
                        );
                    }
                );


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

async function myorder(req, res) {
    const { loggedInUser } = req.query;
    if (!loggedInUser) {
        return res.status(401).json({ message: "User is not logged in" });
    }

    const query = `
    SELECT DISTINCT
        o.orderID,
        i.ItemID,
        i.iDescription,
        i.color,
        i.isNew,
        i.material,
        supervisor.fname AS supervisorFirstName,
        client.fname AS clientFirstName,
        CASE
            WHEN o.supervisor = ? THEN 'Supervisor'
            WHEN o.client = ? THEN 'Client'
            WHEN EXISTS (
                SELECT 1
                FROM Delivered d
                WHERE d.orderID = o.orderID AND d.userName = ?
            ) THEN 'Delivery Associate'
            ELSE 'Other'
        END AS userRole
    FROM Ordered o
    LEFT JOIN ItemIn ii ON o.orderID = ii.orderID
    LEFT JOIN Item i ON ii.ItemID = i.ItemID
    LEFT JOIN Person supervisor ON o.supervisor = supervisor.userName
    LEFT JOIN Person client ON o.client = client.userName
    WHERE o.supervisor = ? 
       OR o.client = ? 
       OR EXISTS (
           SELECT 1
           FROM Delivered d
           WHERE d.orderID = o.orderID AND d.userName = ?
       );
`;


    db.query(query, [loggedInUser, loggedInUser, loggedInUser, loggedInUser, loggedInUser, loggedInUser], (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ message: "Server error occurred" });
        }
        res.status(200).json(results);
    });

}

module.exports = { startOrdercon, addItemOrdercon, myorder }