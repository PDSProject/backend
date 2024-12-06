const db = require('../config/database')

async function findByItemIDcon(req, res) {
    const itemID = req.params.itemID;
    const sql = `
        SELECT Location.roomNum, Location.shelfNum, Piece.pDescription
        FROM Piece
        JOIN Location ON Piece.roomNum = Location.roomNum AND Piece.shelfNum = Location.shelfNum
        WHERE Piece.ItemID = ?`;
    db.query(sql, [itemID], (err, results) => {
        if (err) return res.status(400).send('Error fetching item locations');
        res.json(results);
    });
}

async function deleteByItemIDcon(req, res) {

    const itemID = req.params.itemID;

    const deleteDonatedBy = `DELETE FROM DonatedBy WHERE ItemID = ?`;
    const deletePieces = `DELETE FROM Piece WHERE ItemID = ?`;
    const deleteItemIn = `DELETE FROM ItemIn WHERE ItemID = ?`;
    const deleteItem = `DELETE FROM Item WHERE ItemID = ?`;

    db.query(deleteDonatedBy, [itemID], (err) => {
        if (err) {
            console.error('Error deleting from DonatedBy:', err);
            return res.status(500).send('Error deleting from DonatedBy');
        }
        db.query(deletePieces, [itemID], (err) => {
            if (err) {
                console.error('Error deleting from Piece:', err);
                return res.status(500).send('Error deleting from Piece');
            }
            db.query(deleteItemIn, [itemID], (err) => {
                if (err) {
                    console.error('Error deleting from ItemIn:', err);
                    return res.status(500).send('Error deleting from ItemIn');
                }
                db.query(deleteItem, [itemID], (err) => {
                    if (err) {
                        console.error('Error deleting from Item:', err);
                        return res.status(500).send('Error deleting from Item');
                    }
                    return res.send('Item and all associated data deleted successfully');
                });
            });
        });
    });

}

async function findOrderItemscon(req, res) {
    const orderID = req.params.orderID;

    try {
        // SQL query to fetch items and their locations for the order
        const query = `
            SELECT 
    i.ItemID,
    i.iDescription,
    l.roomNum,
    l.shelfNum,
    l.shelf,
    l.shelfDescription,
    p.pieceNum,
    p.pDescription,
    p.length,
    p.width,
    p.height,
    p.pNotes
FROM ItemIn AS ii
JOIN Item AS i ON ii.ItemID = i.ItemID
LEFT JOIN Piece AS p ON i.ItemID = p.ItemID
LEFT JOIN Location AS l ON p.roomNum = l.roomNum AND p.shelfNum = l.shelfNum
WHERE ii.orderID = ?; 
        `;

        const [rows] = await db.promise().query(query, [orderID]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No items found for this order.' });
        }

        res.json({ items: rows });
    } catch (error) {
        console.error('Error fetching order items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function allAvailablecon(req, res) {
    const sql = `
    SELECT i.ItemID, i.iDescription, i.mainCategory, i.subCategory
    FROM Item i
    LEFT JOIN ItemIn ii ON i.ItemID = ii.ItemID
    WHERE ii.orderID IS NULL;
`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching available items:', err);
            return res.status(500).send('Error fetching available items');
        }
        res.json(results);
    });
}

async function searchByCategorycon(req, res) {
    const { mainCategory, subCategory } = req.query;

    const sql = `
        SELECT i.ItemID, i.iDescription, i.color, i.isNew, c.mainCategory, c.subCategory 
        FROM Item i
        INNER JOIN Category c ON i.mainCategory = c.mainCategory AND i.subCategory = c.subCategory
        WHERE c.mainCategory = ? AND c.subCategory = ?
    `;

    db.query(sql, [mainCategory, subCategory], (err, results) => {

        if (err) {
            console.error('Error fetching items by category:', err);
            return res.status(500).send('Error fetching items');
        }
        res.send(results);
    });
}

async function findItemsatLoc(req, res) {
    const { roomNum, shelfNum } = req.query;

    const sql = `
        SELECT i.ItemID, i.iDescription, i.color, i.isNew, l.roomNum, l.shelfNum
        FROM Item i
        JOIN Piece p ON i.ItemID = p.ItemID
        JOIN Location l ON p.roomNum = l.roomNum AND p.shelfNum = l.shelfNum
        WHERE l.roomNum = ? AND l.shelfNum = ?
    `;

    db.query(sql, [roomNum, shelfNum], (err, results) => {
        if (err) {
            console.error('Error fetching items by location:', err);
            return res.status(500).send('Error fetching items');
        }
        res.send(results);
    });
}

module.exports = { findByItemIDcon, findOrderItemscon, allAvailablecon, deleteByItemIDcon, searchByCategorycon, findItemsatLoc }