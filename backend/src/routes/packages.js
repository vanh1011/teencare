const express = require('express');
const router = express.Router();
const SubscriptionPackage = require('../models/SubscriptionPackage');

router.get('/', async (req, res) => {
  try {
    const list = await SubscriptionPackage.find({}).sort({ price: 1 });
    res.json(list);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
