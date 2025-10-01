import express from 'express';

const router = express.Router();

router.get('/:url', async (req, res) => {
  const calendarUrl = req.params.url;

  try {
    // Fetch calendar data from configured API endpoint
    const apiEndpoint = process.env.API_ENDPOINT;
    const apiVersion = process.env.API_VERSION || 'v1';
    const response = await fetch(`${apiEndpoint}/${apiVersion}/calendars/${calendarUrl}`);

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
