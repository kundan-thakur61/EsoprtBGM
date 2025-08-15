class HealthController {
  health = (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  };
}

module.exports = new HealthController();
