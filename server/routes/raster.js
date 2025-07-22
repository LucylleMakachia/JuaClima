const express = require('express');
const axios = require('axios');
const router = express.Router();


router.get('/api/raster/export', async (req, res) => {
  try {
    const { datasetId, format } = req.query;
    const response = await axios({
      method: 'GET',
      url: `http://localhost:8002/api/raster/export?datasetId=${datasetId}&format=${format}`,
      responseType: 'stream'
    });

    res.setHeader('Content-Disposition', response.headers['content-disposition']);
    response.data.pipe(res);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to download raster file' });
  }
});

module.exports = router;
