const db = require('../config/database')

async function acceptDonationcon(req, res) {
    const { donorID, itemDescription, mainCategory, subCategory, location, loggedInUser } = req.body;

    // Check if the user is a staff member
    console.log(loggedInUser)
    db.query('SELECT roleID FROM Act WHERE userName = ?', [loggedInUser], (err, staffCheckResult) => {
        if (err) {
            console.error('Error checking staff role:', err);
            return res.status(500).json({ message: "Server error occurred" });
        }

        console.log(staffCheckResult)
        if (!staffCheckResult || staffCheckResult.length == 0) {
            console.log(staffCheckResult)
            return res.status(403).json({ message: "You must be a staff member to accept donations." });
        }
        else if (staffCheckResult[0].roleID !== 'staff') {
            console.log(staffCheckResult)
            return res.status(403).json({ message: "You must be a staff member to accept donations." });
        }

        // Check if the category exists in the Category table
        db.query(`
            SELECT * FROM Category
            WHERE mainCategory = ? AND subCategory = ?
        `, [mainCategory, subCategory], (err, categoryResult) => {
            if (err) {
                console.error('Error checking category:', err);
                return res.status(500).json({ message: "Server error occurred" });
            }

            // If the category doesn't exist, insert it
            if (categoryResult.length === 0) {
                db.query(`
                    INSERT INTO Category (mainCategory, subCategory)
                    VALUES (?, ?)
                `, [mainCategory, subCategory], (err) => {
                    if (err) {
                        console.error('Error inserting category:', err);
                        return res.status(500).json({ message: "Server error occurred" });
                    }

                    // Now proceed to insert the item
                    insertDonationItem();
                });
            } else {
                // If the category exists, directly insert the item
                insertDonationItem();
            }
        });

        function insertDonationItem() {
            // Insert the item donation into the Item table
            db.query(`
                INSERT INTO Item (iDescription, mainCategory, subCategory)
                VALUES (?, ?, ?)
            `, [itemDescription, mainCategory, subCategory], (err, itemResult) => {
                if (err) {
                    console.error('Error inserting item:', err);
                    return res.status(500).json({ message: "Server error occurred" });
                }

                // Get the last inserted item ID
                const itemID = itemResult.insertId;

                // Insert donation data linking the donor to the item
                db.query(`
                    INSERT INTO DonatedBy (ItemID, userName, donateDate)
                    VALUES (?, ?, NOW())
                `, [itemID, donorID], (err) => {
                    if (err) {
                        console.error('Error inserting donation data:', err);
                        return res.status(500).json({ message: "Server error occurred" });
                    }

                    // Insert piece details (assuming one piece per item for simplicity)
                    const [roomNum, shelfNum] = location.split('-');
                    db.query(`
                        INSERT INTO Piece (ItemID, pieceNum, pDescription, length, width, height, roomNum, shelfNum, pNotes)
                        VALUES (?, 1, ?, 50, 30, 10, ?, ?, ?)
                    `, [itemID, itemDescription, roomNum, shelfNum, 'No special notes'], (err) => {
                        if (err) {
                            console.error('Error inserting piece details:', err);
                            return res.status(500).json({ message: "Server error occurred" });
                        }

                        return res.status(200).json({ message: "Donation accepted successfully." });
                    });
                });
            });
        }
    });

}

async function getDonorInfocon(req, res) {
    const donorID = req.params.donorID;

    const donorQuery = `
        SELECT p.fname, p.lname, p.email, pp.phone
        FROM Person p
        LEFT JOIN PersonPhone pp ON p.userName = pp.userName
        WHERE p.userName = ?
    `;

    db.query(donorQuery, [donorID], (err, result) => {
        console.log(result)
        if (err) {
            return res.status(500).send("Error fetching donor information");
        }

        if (result.length === 0) {
            return res.status(404).send("No donor found with the given ID");
        }

        // Send the donor information
        res.send(result[0]);
    });
};



module.exports = { acceptDonationcon, getDonorInfocon }