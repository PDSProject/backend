const express = require("express")
const router = express.Router()
const { findByItemIDcon, findOrderItemscon, allAvailablecon } = require('../controllers/find_con')

router.get('/find-item/:itemID', findByItemIDcon)
router.get('/find-order-items/:orderID', findOrderItemscon)
router.get('/all-available', allAvailablecon)

module.exports = router