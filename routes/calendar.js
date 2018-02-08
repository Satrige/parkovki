const express = require('express');
const log = require('logger').createLogger('ROUTER_CALENDAR');
const { insertNewRecord, getRecord } = require('handlers/calendar');

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

router.get('/:id', async (req, res, next) => {
  try {
    const record = await getRecord({ _id: req.params.id });

    res.send(record);
  } catch (err) {
    log.error('Error_calendar_get_last', err.message);
    next(err);
  }
});

module.exports = router;
