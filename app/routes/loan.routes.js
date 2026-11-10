const express = require('express');
const router = express.Router();
const loanController = require('../controllers/LoanController');
const checkAuth = require('../middleware/checkAuth');

router.post('/', checkAuth, loanController.createLoan);
router.post('/:id/payments', checkAuth, loanController.makePayment);

module.exports = router;
