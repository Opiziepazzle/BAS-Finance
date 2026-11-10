const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/LedgerController');
const checkAuth = require('../middleware/checkAuth');

router.post('/entries/:id/reverse', checkAuth, ledgerController.reverseEntry);
router.get('/trial-balance', checkAuth, ledgerController.getTrialBalance);

module.exports = router;
