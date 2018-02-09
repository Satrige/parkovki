const express = require('express');
const log = require('logger').createLogger('ROUTER_USER');
const { insertNewUser, updateUser, findUser } = require('handlers/users');
const { NO_SUCH_USER } = require('errors');

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

router.put('/:id', async (req, res, next) => {
  try {
    const wasUpdated = await updateUser(req.params.id, req.body);

    res.send({ status: 'ok', wasUpdated });
  } catch (err) {
    log.error('Error_user_put_last', err.message);
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const wasDeleted = await updateUser(req.params.id, { isDeleted: true });

    res.send({ status: 'ok', wasDeleted });
  } catch (err) {
    log.error('Error_user_delete_last', err.message);
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await findUser({ _id: req.params.id });

    if (!user) {
      throw NO_SUCH_USER;
    }

    res.send(user);
  } catch (err) {
    log.error('Error_user_get_last', err.message);
    next(err);
  }
});

module.exports = router;
