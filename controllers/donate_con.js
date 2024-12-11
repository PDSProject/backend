const db = require('../config/database')

async function acceptDonationcon(req, res) {
    const { donorID, itemDescription, mainCategory, subCategory, location, loggedInUser } = req.body;

    // Check if the request body contains all necessary fields
    if (!donorID || !itemDescription || !mainCategory || !subCategory || !location || !loggedInUser) {
        return res.status(400).json({ message: "Missing required fields in the request body." });
    }

    // Check if the user is a staff member
    console.log(loggedInUser);
    db.query('SELECT roleID FROM Act WHERE userName = ?', [loggedInUser], (err, staffCheckResult) => {
        if (err) {
            console.error('Error checking staff role:', err);
            return res.status(500).json({ message: "Server error occurred while checking staff role." });
        }

        console.log(staffCheckResult);
        if (!staffCheckResult || staffCheckResult.length === 0 || staffCheckResult[0].roleID !== 'staff') {
            console.log(staffCheckResult);
            return res.status(403).json({ message: "You must be a staff member to accept donations." });
        }

        // Check if the donor is a valid user
        db.query('SELECT userName FROM Person WHERE userName = ?', [donorID], (err, donorresult) => {
            if (err) {
                console.error('Error fetching donor details:', err);
                return res.status(500).json({ message: "Server error occurred while fetching donor details." });
            }

            console.log(donorresult);
            if (!donorresult || donorresult.length === 0) {
                return res.status(400).json({ message: "No user found with the given donor username" });
            }

            // Check if the donor's role is valid
            db.query('SELECT roleID FROM Act WHERE userName = ?', [donorID], (err, donorresultcheck) => {
                if (err) {
                    console.error('Error checking donor role:', err);
                    return res.status(500).json({ message: "Server error occurred while checking donor role." });
                }

                console.log(donorresultcheck);
                if (!donorresultcheck || donorresultcheck.length === 0 || donorresultcheck[0].roleID !== 'donor') {
                    console.log(donorresultcheck);
                    return res.status(403).json({ message: "User is not a donor" });
                }

                // Check if the category exists in the Category table
                db.query(`SELECT * FROM Category WHERE mainCategory = ? AND subCategory = ?`, [mainCategory, subCategory], (err, categoryResult) => {
                    if (err) {
                        console.error('Error checking category:', err);
                        return res.status(500).json({ message: "Server error occurred while checking category." });
                    }

                    // If the category doesn't exist, insert it
                    if (categoryResult.length === 0) {
                        db.query(`INSERT INTO Category (mainCategory, subCategory) VALUES (?, ?)`, [mainCategory, subCategory], (err) => {
                            if (err) {
                                console.error('Error inserting category:', err);
                                return res.status(500).json({ message: "Server error occurred while inserting category." });
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
                            return res.status(500).json({ message: "Server error occurred while inserting item." });
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
                                return res.status(500).json({ message: "Server error occurred while inserting donation data." });
                            }

                            // Insert piece details (assuming one piece per item for simplicity)
                            const [roomNum, shelfNum] = location.split('-');
                            db.query(`
                            INSERT INTO Piece (ItemID, pieceNum, pDescription, length, width, height, roomNum, shelfNum, pNotes)
                            VALUES (?, 1, ?, 50, 30, 10, ?, ?, ?)
                        `, [itemID, itemDescription, roomNum, shelfNum, 'No special notes'], (err) => {
                                if (err) {
                                    console.error('Error inserting piece details:', err);
                                    return res.status(500).json({ message: "Server error occurred while inserting piece details." });
                                }

                                return res.status(200).json({ message: "Donation accepted successfully." });
                            });
                        });
                    });
                }
            });
        });
    });

    //     const { donorID, itemDescription, mainCategory, subCategory, location, loggedInUser } = req.body;

    //     // Check if the user is a staff member
    //     console.log(loggedInUser)
    //     db.query('SELECT roleID FROM Act WHERE userName = ?', [loggedInUser], (err, staffCheckResult) => {
    //         if (err) {
    //             console.error('Error checking staff role:', err);
    //             return res.status(500).json({ message: "Server error occurred" });
    //         }

    //         console.log(staffCheckResult)
    //         if (!staffCheckResult || staffCheckResult.length == 0) {
    //             console.log(staffCheckResult)
    //             return res.status(403).json({ message: "You must be a staff member to accept donations." });
    //         }
    //         else if (staffCheckResult[0].roleID !== 'staff') {
    //             console.log(staffCheckResult)
    //             return res.status(403).json({ message: "You must be a staff member to accept donations." });
    //         }

    //         // Check if the donor is a donor
    //         db.query('SELECT userName FROM Person WHERE userName = ?', [donorID], (err, donorresult) => {
    //             console.log(donorresult)
    //             if (err || donorresult.length == 0) {
    //                 return res.status(400).json({ message: "No user found with given donor username" });
    //             }
    //         })
    //         db.query('SELECT roleID FROM Act WHERE userName = ?', [donorID], (err, donorresultcheck) => {
    //             if (err) {
    //                 console.error('Error checking staff role:', err);
    //                 return res.status(500).json({ message: "Server error occurred" });
    //             }

    //             console.log(donorresultcheck)
    //             if (!donorresultcheck || donorresultcheck.length == 0) {
    //                 console.log(donorresultcheck)
    //                 return res.status(403).json({ message: "User is not a donor" });
    //             }
    //             else if (donorresultcheck[0].roleID !== 'donor') {
    //                 console.log(donorresultcheck)
    //                 return res.status(403).json({ message: "User is not a donor" });
    //             }
    //         })

    //         // Check if the category exists in the Category table
    //         db.query(`
    //             SELECT * FROM Category
    //             WHERE mainCategory = ? AND subCategory = ?
    //         `, [mainCategory, subCategory], (err, categoryResult) => {
    //             if (err) {
    //                 console.error('Error checking category:', err);
    //                 return res.status(500).json({ message: "Server error occurred" });
    //             }

    //             // If the category doesn't exist, insert it
    //             if (categoryResult.length === 0) {
    //                 db.query(`
    //                     INSERT INTO Category (mainCategory, subCategory)
    //                     VALUES (?, ?)
    //                 `, [mainCategory, subCategory], (err) => {
    //                     if (err) {
    //                         console.error('Error inserting category:', err);
    //                         return res.status(500).json({ message: "Server error occurred" });
    //                     }

    //                     // Now proceed to insert the item
    //                     insertDonationItem();
    //                 });
    //             } else {
    //                 // If the category exists, directly insert the item
    //                 insertDonationItem();
    //             }
    //         });

    //         function insertDonationItem() {
    //             // Insert the item donation into the Item table
    //             db.query(`
    //                 INSERT INTO Item (iDescription, mainCategory, subCategory)
    //                 VALUES (?, ?, ?)
    //             `, [itemDescription, mainCategory, subCategory], (err, itemResult) => {
    //                 if (err) {
    //                     console.error('Error inserting item:', err);
    //                     return res.status(500).json({ message: "Server error occurred" });
    //                 }

    //                 // Get the last inserted item ID
    //                 const itemID = itemResult.insertId;

    //                 // Insert donation data linking the donor to the item
    //                 db.query(`
    //                     INSERT INTO DonatedBy (ItemID, userName, donateDate)
    //                     VALUES (?, ?, NOW())
    //                 `, [itemID, donorID], (err) => {
    //                     if (err) {
    //                         console.error('Error inserting donation data:', err);
    //                         return res.status(500).json({ message: "Server error occurred" });
    //                     }

    //                     // Insert piece details (assuming one piece per item for simplicity)
    //                     const [roomNum, shelfNum] = location.split('-');
    //                     db.query(`
    //                         INSERT INTO Piece (ItemID, pieceNum, pDescription, length, width, height, roomNum, shelfNum, pNotes)
    //                         VALUES (?, 1, ?, 50, 30, 10, ?, ?, ?)
    //                     `, [itemID, itemDescription, roomNum, shelfNum, 'No special notes'], (err) => {
    //                         if (err) {
    //                             console.error('Error inserting piece details:', err);
    //                             return res.status(500).json({ message: "Server error occurred" });
    //                         }

    //                         return res.status(200).json({ message: "Donation accepted successfully." });
    //                     });
    //                 });
    //             });
    //         }
    //     });

}


async function getDonorInfocon(req, res) {
    const donorID = req.params.donorID;
    // Check if the donor has a roleID of "donor"
    db.query('SELECT roleID FROM Act WHERE userName = ?', [donorID], (err, donorresultcheck) => {
        if (err) {
            console.error('Error checking donor role:', err);
            return res.status(500).json({ message: "Server error occurred while checking donor role." });
        }

        // If no result or role is not "donor", return a 403 error
        if (!donorresultcheck || donorresultcheck.length === 0 || donorresultcheck[0].roleID !== 'donor') {
            console.log(donorresultcheck);
            return res.status(403).json({ message: "User is not a donor" });
        }

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
                return res.status(404).send("No donor found with the given Username");
            }

            // Send the donor information
            res.send(result[0]);
        })
    })
};



module.exports = { acceptDonationcon, getDonorInfocon }