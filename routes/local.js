import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';

const router = express.Router();
router.use(cookieParser());

// Ensure artworks directory exists
const artworksDir = path.resolve('public', 'artworks');
if (!fs.existsSync(artworksDir)) {
  fs.mkdirSync(artworksDir, { recursive: true });
}

// Multer storage config for PNG files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, artworksDir);
  },
  filename: function (req, file, cb) {
    // Keep .png extension; prefix with timestamp
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const isPng = file.mimetype === 'image/png' || file.originalname.toLowerCase().endsWith('.png');
    if (!isPng) return cb(new Error('Only PNG files are allowed'));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Upload artwork endpoint
router.post('/artworks/upload', upload.single('artwork'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const relativePath = `/artworks/${req.file.filename}`;
    return res.json({
      message: 'Artwork uploaded successfully',
      url: relativePath
    });
  } catch (err) {
    console.error('Artwork upload error:', err);
    return res.status(500).json({ message: 'Upload failed' });
  }
});

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
    const apiVersion = process.env.API_VERSION || 'web-api/v1';

    const requestBody = {
      spotId,
      ...(visitorName && { visitorName: visitorName.trim() }),
      ...(visitorEmail && { visitorEmail: visitorEmail.trim() }),
      ...(comment && { comment: comment.trim() }),
      ...(timezone && { timezone })
    };

    const response = await fetch(`${apiEndpoint}/${apiVersion}/reservations`, {
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
    const apiVersion = process.env.API_VERSION || 'web-api/v1';

    const requestBody = {
      ...(reason && { reason: reason.trim() })
    };

    const response = await fetch(`${apiEndpoint}/${apiVersion}/reservations/${reservationId}`, {
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

router.post('/calendar/validate-access', async (req, res) => {
  const { email, calendarUrl } = req.body;

  // Validate required fields
  if (!email) {
    return res.status(400).json({ message: 'email is required' });
  }

  if (!calendarUrl) {
    return res.status(400).json({ message: 'calendarUrl is required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'email must be a valid email format' });
  }

  try {
    const apiEndpoint = process.env.API_ENDPOINT;
    const apiVersion = process.env.API_VERSION || 'web-api/v1';

    const requestBody = {
      email: email.trim(),
      calendarURL: calendarUrl
    };

    console.log('[validate-access] POST to:', `${apiEndpoint}/${apiVersion}/calendars/request-access`);
    console.log('[validate-access] Request body:', requestBody);

    const response = await fetch(`${apiEndpoint}/${apiVersion}/calendars/request-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('[validate-access] Response status:', response.status);
    const contentType = response.headers.get('content-type');
    console.log('[validate-access] Content-Type:', contentType);

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('[validate-access] Response data:', JSON.stringify(data, null, 2));

      if (!response.ok || data.error) {
        return res.status(response.status >= 400 ? response.status : 403).json(data);
      }

      // If validation is successful, set the access-allowed cookie
      res.cookie('access-allowed', calendarUrl, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      res.json(data);
    } else {
      const text = await response.text();
      console.error('[validate-access] Non-JSON response from API:', text.substring(0, 200));
      return res.status(response.status || 500).json({
        message: 'Backend API returned an unexpected response format'
      });
    }
  } catch (error) {
    console.error('Error in /local/calendar/validate-access:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/waitlist/join', async (req, res) => {
  const { calendarURL, date, visitorEmail, visitorName, comment, timezone } = req.body;

  // Validate required fields
  if (!calendarURL) {
    return res.status(400).json({ message: 'calendarURL is required' });
  }

  if (!visitorEmail) {
    return res.status(400).json({ message: 'visitorEmail is required' });
  }

  if (!visitorName) {
    return res.status(400).json({ message: 'visitorName is required' });
  }

  if (!timezone) {
    return res.status(400).json({ message: 'timezone is required' });
  }

  // Validate date is a valid date (if provided)
  if (date) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'date must be a valid date' });
    }
  }

  // Validate visitorName length
  if (visitorName.trim().length < 2) {
    return res.status(400).json({ message: 'visitorName must be at least 2 characters long' });
  }

  // Validate visitorEmail format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(visitorEmail)) {
    return res.status(400).json({ message: 'visitorEmail must be a valid email format' });
  }

  try {
    const apiEndpoint = process.env.API_ENDPOINT;
    const apiVersion = process.env.API_VERSION || 'web-api/v1';

    const requestBody = {
      calendarURL: calendarURL.trim(),
      visitorEmail: visitorEmail.trim(),
      visitorName: visitorName.trim(),
      timezone,
      ...(date && { date }),
      ...(comment && { comment: comment.trim() })
    };

    const response = await fetch(`${apiEndpoint}/${apiVersion}/waiting-lists`, {
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
    console.error('Error in /local/waitlist/join:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/calendar/forgotten', async (req, res) => {
  const { email, urlOfCalendar } = req.body;

  // Validate required fields
  if (!email) {
    return res.status(400).json({ message: 'email is required' });
  }

  if (!urlOfCalendar) {
    return res.status(400).json({ message: 'urlOfCalendar is required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'email must be a valid email format' });
  }

  try {
    const apiEndpoint = process.env.API_ENDPOINT;
    const apiVersion = process.env.API_VERSION || 'web-api/v1';

    const requestBody = {
      email: email.trim(),
      urlOfCalendar: urlOfCalendar.trim()
    };

    const response = await fetch(`${apiEndpoint}/${apiVersion}/calendars/${urlOfCalendar}/forgot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const contentType = response.headers.get('content-type');

    // Check if response is JSON or handle no-content response
    if (response.status === 204) {
      // No content - success
      return res.status(204).send();
    }

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
    console.error('Error in /local/calendar/forgotten:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
