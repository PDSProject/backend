const express = require("express")
const router = express.Router()
const { logincon, registercon, logoutcon } = require('../controllers/login_register_con')

router.post("/login", logincon)
router.post("/register", registercon)
router.post("/logout", logoutcon)

module.exports = router