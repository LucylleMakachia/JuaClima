import express from 'express';

const router = express.Router();

// Temporary route
router.get('/', (req, res) => {
  res.json({ message: 'Alerts route working!' });
});

export default router;
