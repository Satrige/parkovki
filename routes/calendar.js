const express = require('express');
const log = require('logger').createLogger('ROUTER_CALENDAR');
const { insertNewRecord, getRecord, getRecords, updateRecord } = require('handlers/calendar');
const multipart = require('connect-multiparty');
const { INTERNAL_ERROR } = require('errors');

const router = express.Router();

const multipartMiddleware = multipart({
  autoFiles: true,
  uploadDir: require('config').uploadDir,
});

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

router.get('/', async (req, res, next) => {
  try {
    const cursor = await getRecords(req.query);

    res.set('Content-type', 'application/json');
    res.write('[');

    let isFirst = true;

    const write = (content) => {
      log.debug('data event', content);
      if (content && !res.write(`${isFirst ? '' : ','}${JSON.stringify(content)}`)) {
        cursor.removeListener('data', write);

        res.once('drain', () => {
          cursor.on('data', write);
        });
      }

      if (isFirst) {
        isFirst = false;
      }
    };

    cursor.on('data', write);

    cursor.on('end', () => {
      log.debug('End event');
      res.write(']');
      res.end();
    });

    cursor.on('error', (err) => {
      log.error('Error_calendar_get_0', err.message);
      next(INTERNAL_ERROR);
    });
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

router.post('/upload', multipartMiddleware, async (req, res, next) => {
  log.debug('req.files: ', req.files);

  res.end('not yet');
});

module.exports = router;
