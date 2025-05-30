const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Welcome to the Node.js CI/CD lab app!');
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.post('/sum', (req, res) => {
  const { a, b } = req.body;
  if (typeof a !== 'number' || typeof b !== 'number') {
    return res.status(400).json({ error: 'Both a and b must be numbers' });
  }
  res.json({ result: a + b });
});

module.exports = router;