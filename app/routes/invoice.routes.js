const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/InvoiceController');
const checkAuth = require('../middleware/checkAuth');

router.post('/quote', checkAuth, invoiceController.getQuote);
router.post('/disburse', checkAuth, invoiceController.disburse);
router.post('/:id/settle', checkAuth, invoiceController.settle);

module.exports = router;
