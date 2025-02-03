const { , validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'mlb-throwbacks',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

