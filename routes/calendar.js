const express = require('express');
const log = require('logger').createLogger('ROUTER_CALENDAR');
const { insertNewRecord, getRecord, updateRecord } = require('handlers/calendar');

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

router.put('/:id', async (req, res, next) => {
  try {
    const wasUpdated = await updateRecord(req.params.id, req.body);

    res.send({ status: 'ok', wasUpdated });
  } catch (err) {
    log.error('Error_calendar_put_last', err.message);
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

router.delete('/:id', async (req, res, next) => {
  try {
    const wasDeleted = await updateRecord(req.params.id, { isDeleted: true });

    res.send({ status: 'ok', wasDeleted });
  } catch (err) {
    log.error('Error_calendar_delete_last', err.message);
    next(err);
  }
});

module.exports = router;
