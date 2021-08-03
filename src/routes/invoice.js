const express = require('express');
const {generateInvoice,allInvoice,searchInvoice,salesReport,updateInvoice} = require('../controllers/invoice');
const {auth,authGetInvoice} = require('../middleware/auth');
const router = express.Router();

router.post('/generate',auth,generateInvoice);
router.get('/all',auth,allInvoice)
router.get('/search/:id',auth,searchInvoice);
router.get('/sales',auth,salesReport);
router.patch('/update/:id',auth,updateInvoice)
module.exports = router