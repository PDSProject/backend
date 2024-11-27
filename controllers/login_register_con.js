const bcrypt = require('bcryptjs');
const db = require('../config/database')

async function logincon(req, res) {
    const { userName, password } = req.body;
    const sql = `SELECT * FROM Person WHERE userName = ?`;
    db.query(sql, [userName], async (err, results) => {
        if (err || results.length === 0) return res.status(400).send('Invalid credentials');
        const isValid = await bcrypt.compare(password, results[0].password);
        if (!isValid) return res.status(400).send('Invalid credentials');
        req.session.userName = userName;

        res.send('Login successful');
    });
}
async function registercon(req, res) {
    const { userName, password, fname, lname, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO Person (userName, password, fname, lname, email) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [userName, hashedPassword, fname, lname, email], (err) => {
        if (err) return res.status(400).send('Error registering user');
        res.send('User registered successfully');
    });
}

async function logoutcon(req, res) {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Logout failed." });
        }
        res.json({ message: "Logged out successfully!" });
    });
}

module.exports = { logincon, registercon, logoutcon }