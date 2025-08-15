const client = require('prom-client');

// Expose metrics collected by prom-client
const register = client.register;

class MetricsController {
  getMetrics = async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  };
}

module.exports = new MetricsController();
