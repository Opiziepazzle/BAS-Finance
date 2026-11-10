const express = require('express');
const router = express.Router();
const loanController = require('../controllers/LoanController');
const checkAuth = require('../middleware/checkAuth');

router.post('/accrue', checkAuth, loanController.accrueInterest);

module.exports = router;
