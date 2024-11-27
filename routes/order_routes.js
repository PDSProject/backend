const express = require("express")
const router = express.Router()
const { startOrdercon, addItemOrdercon } = require('../controllers/order_con')

router.post('/start-order', startOrdercon)

// Not Using:
router.post('/add-item-order', addItemOrdercon)

module.exports = router