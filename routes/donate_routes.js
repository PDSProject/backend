const express = require("express")
const router = express.Router()
const { acceptDonationcon, getDonorInfocon } = require('../controllers/donate_con')

router.post('/accept-donation', acceptDonationcon)
router.get('/donor-info/:donorID', getDonorInfocon)

module.exports = router