const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'analytics' });
});

app.get('/api/analytics/overview', (req, res) => {
  res.json({
    totalUsers: 0,
    activeCampaigns: 0,
    totalDMSent: 0,
    totalReplies: 0,
    engagementRate: 0
  });
});

app.get('/api/analytics/growth', (req, res) => {
  res.json({
    userGrowth: [],
    campaignGrowth: []
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Analytics server running on port ${PORT}`);
});
