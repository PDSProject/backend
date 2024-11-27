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

module.exports = { findByItemIDcon, findOrderItemscon, allAvailablecon }