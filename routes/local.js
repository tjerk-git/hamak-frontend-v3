import express from 'express';

const router = express.Router();

router.post('/reserve', async (req, res) => {
  const { spotId, visitorName, visitorEmail, comment, timezone } = req.body;

  // Validate required field
  if (!spotId) {
    return res.status(400).json({ message: 'spotId is required' });
  }

  // Validate visitorName if provided
  if (visitorName && visitorName.trim().length < 2) {
    return res.status(400).json({ message: 'visitorName must be at least 2 characters long' });
  }

  // Validate visitorEmail if provided
  if (visitorEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(visitorEmail)) {
      return res.status(400).json({ message: 'visitorEmail must be a valid email format' });
    }
  }

  try {
    const apiEndpoint = process.env.API_ENDPOINT;
    const apiVersion = process.env.API_VERSION || 'v1';

    const requestBody = {
      spotId,
      ...(visitorName && { visitorName: visitorName.trim() }),
      ...(visitorEmail && { visitorEmail: visitorEmail.trim() }),
      ...(comment && { comment: comment.trim() }),
      ...(timezone && { timezone })
    };

    const response = await fetch(`${apiEndpoint}/${apiVersion}/spots/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const contentType = response.headers.get('content-type');

    // Check if response is JSON
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.json(data);
    } else {
      // Response is not JSON (probably HTML error page)
      const text = await response.text();
      console.error('Non-JSON response from API:', text.substring(0, 200));
      return res.status(response.status || 500).json({
        message: 'Backend API returned an unexpected response format'
      });
    }
  } catch (error) {
    console.error('Error in /api/reserve:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/reservation/delete/:reservationId', async (req, res) => {
  const { reservationId } = req.params;
  const { reason } = req.body;

  try {
    const apiEndpoint = process.env.API_ENDPOINT;
    const apiVersion = process.env.API_VERSION || 'v1';

    const requestBody = {
      ...(reason && { reason: reason.trim() })
    };

    const response = await fetch(`${apiEndpoint}/${apiVersion}/reservation/delete/${reservationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.json(data);
    } else {
      const text = await response.text();
      console.error('Non-JSON response from API:', text.substring(0, 200));
      return res.status(response.status || 500).json({
        message: 'Backend API returned an unexpected response format'
      });
    }
  } catch (error) {
    console.error('Error in /local/reservation/delete:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
