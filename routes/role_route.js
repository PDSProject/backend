const express = require("express")
const router = express.Router()
const db = require('../config/database')

router.get('/', async (req, res) => {
    const { loggedInUser } = req.query;
    // Check if the user is a staff member

    db.query('SELECT roleID FROM Act WHERE userName = ?', [loggedInUser], (err, staffCheckResult) => {
        console.log(loggedInUser)
        if (err) {
            console.error('Error checking staff role:', err);
            return res.status(500).json({ message: "Server error occurred" });
        }

        if (!staffCheckResult || staffCheckResult.length == 0) {
            return res.status(400).json({ message: "Access Denied" });
        }
        else if (staffCheckResult[0].roleID !== 'staff') {
            console.log(staffCheckResult)
            return res.status(400).json({ message: "Access Denied" });
        }
        else {
            return res.status(200)
        }
    });
})


module.exports = router