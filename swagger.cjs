const swaggerAutogen = require('swagger-autogen')();
const doc = { info: { title: 'Chirpy API', version: '1.0.0' } };
swaggerAutogen('./swagger.json', ['./src/index.ts'], doc);