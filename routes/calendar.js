import express from 'express';
import cookieParser from 'cookie-parser';

const router = express.Router();
router.use(cookieParser());

router.get('/:url', async (req, res) => {
  const calendarUrl = req.params.url;
  const token = req.query.token;

  try {
    // Fetch calendar data from configured API endpoint
    const apiEndpoint = process.env.API_ENDPOINT;
    const apiVersion = process.env.API_VERSION || 'v1';
    const response = await fetch(`${apiEndpoint}/${apiVersion}/calendar/${calendarUrl}`);

    if (!response.ok) {
      return res.status(404).render('404.njk', {
        title: 'Page Not Found'
      });
    }

    const data = await response.json();

    // If backend returns sample calendar, treat as 404
    if (data.calendar && data.calendar.name === 'Sample Calendar') {
      return res.status(404).render('404.njk', {
        title: 'Page Not Found'
      });
    }

    // Check if calendar is restricted
    if (data.calendar && data.calendar.isRestricted) {
      // If token is provided, verify it with the backend
      if (token) {
        try {
          const verifyResponse = await fetch(`${apiEndpoint}/${apiVersion}/calendar/verify-token/${token}`);

          if (verifyResponse.ok) {
            // Token is valid, set the cookie
            res.cookie('access-allowed', calendarUrl, {
              maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax'
            });
            // Continue to show calendar
          } else {
            // Invalid token, show validation page
            return res.render('validate-access.njk', {
              title: 'Access Restricted',
              calendarUrl: calendarUrl
            });
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          return res.render('validate-access.njk', {
            title: 'Access Restricted',
            calendarUrl: calendarUrl
          });
        }
      } else {
        // No token, check if user has the access-allowed cookie
        const accessCookie = req.cookies['access-allowed'];

        if (!accessCookie || accessCookie !== calendarUrl) {
          // No valid cookie, show validation page
          return res.render('validate-access.njk', {
            title: 'Access Restricted',
            calendarUrl: calendarUrl
          });
        }
      }
    }

    // Set cache headers to ensure fresh data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.render('calendar.njk', {
      title: data.calendar.name,
      calendar: data.calendar,
      groupedSpots: data.groupedSpots
    });
  } catch (error) {
    res.status(404).render('404.njk', {
      title: 'Page Not Found'
    });
  }
});

export default router;
