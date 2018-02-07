const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.send({ message: 'not_yet' });
});

module.exports = router;
