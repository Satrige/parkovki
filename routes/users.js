const express = require('express');
const log = require('logger').createLogger('ROUTER_USER');
const { insertNewUser } = require('handlers/users');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const newUser = await insertNewUser(req.body);

    res.send(newUser);
  } catch (err) {
    log.error('Error_user_post_last', err.message);
    next(err);
  }
});

module.exports = router;
