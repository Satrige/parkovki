const proxyquire = require('proxyquire').noCallThru();

describe('handlers: calendar', () => {
  describe('insertNewRecord', () => {
    it('should resolve with new record object', async () => {
      const test = {
        recordInfo: {
          name: 'Alanis Simonis',
          email: 'alanis_simonis1959@example.com',
          date: '31.12.1979',
          status: 'remoteWork',
          isDeleted: false,
          note: '',
          period: 8,
        },
        user: {
          name: 'Alanis Simonis',
          email: 'alanis_simonis1959@example.com',
        },
        workerHours: 0,
        toJSONResult: {
          _id: '123',
          name: 'Alanis Simonis',
          email: 'alanis_simonis1959@example.com',
          date: '31.12.1979',
          status: 'remoteWork',
          isDeleted: false,
          note: '',
          period: 8,
        },
      };

      const expected = {
        result: {
          _id: '123',
          name: 'Alanis Simonis',
          email: 'alanis_simonis1959@example.com',
          date: '31.12.1979',
          status: 'remoteWork',
          isDeleted: false,
          note: '',
          period: 8,
        },
        userStatParams: {
          email: 'alanis_simonis1959@example.com',
          date: new Date('12.31.1979'),
        },
        saveNewRecordParams: {
          __v: 0,
          name: 'Alanis Simonis',
          email: 'alanis_simonis1959@example.com',
          date: new Date('12.31.1979'),
          status: 'remoteWork',
          isDeleted: false,
          note: '',
          period: 8,
        },
        userQuery: {
          email: 'alanis_simonis1959@example.com',
        },
      };

      const calendarHandler = proxyquire('handlers/calendar', {
        'models/calendar': {
          getSingleUserStat: async (params) => {
            expect(params).to.be.deep.equal(expected.userStatParams);

            return test.workerHours;
          },
          saveNewRecord: async (recordInfo) => {
            expect(recordInfo).to.be.deep.equal(expected.saveNewRecordParams);

            return {
              toJSON: () => test.toJSONResult,
            };
          },
        },
        'handlers/users': {
          findUser: async (params) => {
            expect(params).to.be.deep.equal(expected.userQuery);

            return test.user;
          },
        },
      });

      await expect(calendarHandler.insertNewRecord(test.recordInfo))
        .to.eventually.be.deep.equal(expected.result);
    });
  });

  describe('getStat', () => {
    it('should resolve with correct statistic', async () => {
      const test = {
        params: {
          from: '31.12.1979',
          to: '31.12.1989',
          emails: JSON.stringify(['test1@test.test', 'test2@test.test']),
        },
        getStatisticOutput: [{
          name: 'Ivan Smirnov',
          email: 'test1@test.test',
          pediods: [{
            status: 'work',
            days: 10,
          }],
        }, {
          name: 'Ivan Smirnov',
          email: 'test2@test.test',
          pediods: [{
            status: 'work',
            days: 10,
          }],
        }],
      };

      const expected = {
        result: [{
          name: 'Ivan Smirnov',
          email: 'test1@test.test',
          pediods: [{
            status: 'work',
            days: 10,
          }],
        }, {
          name: 'Ivan Smirnov',
          email: 'test2@test.test',
          pediods: [{
            status: 'work',
            days: 10,
          }],
        }],
        getStatisticInput: {
          date: {
            $gte: new Date('12.31.1979'),
            $lte: new Date('12.31.1989'),
          },
          email: {
            $in: ['test1@test.test', 'test2@test.test'],
          },
        },
      };

      const calendarHandler = proxyquire('handlers/calendar', {
        'models/calendar': {
          getStatistic: async (query) => {
            expect(query).to.be.deep.equal(expected.getStatisticInput);

            return test.getStatisticOutput;
          },
        },
        'handlers/users': {},
      });

      await expect(calendarHandler.getStat(test.params))
        .to.eventually.be.deep.equal(expected.result);
    });
  });
});
