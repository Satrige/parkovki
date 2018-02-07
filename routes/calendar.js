const express = require('express');
const log = require('logger').createLogger('ROUTER_CALENDAR');
const { insertNewRecord } = require('handlers/calendar');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const newRecord = await insertNewRecord(req.body);

    res.send(newRecord);
  } catch (err) {
    log.error('Error_calendar_post_last', err.message);
    next(err);
  }
});

module.exports = router;
