const express = require("express")
const router = express.Router()
const { acceptDonationcon } = require('../controllers/donate_con')

router.post('/accept-donation', acceptDonationcon)

module.exports = router