const express = require("express")
const router = express.Router()
const { findByItemIDcon, deleteByItemIDcon, findOrderItemscon, allAvailablecon, searchByCategorycon, findItemsatLoc } = require('../controllers/find_con')

router.get('/find-item/:itemID', findByItemIDcon)
router.delete('/delete-item/:itemID', deleteByItemIDcon)
router.get('/find-order-items/:orderID', findOrderItemscon)
router.get('/all-available', allAvailablecon)
router.get('/search-items', searchByCategorycon)
router.get('/find-by-loc', findItemsatLoc)

module.exports = router