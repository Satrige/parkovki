module.exports = {
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 27017,
    dbName: process.env.DB_NAME || 'parkovki',
  },
  uploadDir: './tmp',
};
