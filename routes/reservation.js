import express from 'express';

const router = express.Router();

router.get('/reserve/:spotId', async (req, res) => {
  const spotId = req.params.spotId;
  const { startDate, endDate, location, timezone } = req.query;
  const apiEndpoint = process.env.API_ENDPOINT;

  res.render('reservation.njk', {
    title: 'Reserve Spot',
    spotId: spotId,
    startDate: startDate,
    endDate: endDate,
    location: location,
    ownerTimezone: timezone || 'Europe/Amsterdam',
    apiEndpoint: apiEndpoint
  });
});

router.get('/reservation/:reservationId', async (req, res) => {
  const reservationId = req.params.reservationId;
  console.log('[reservation] route hit', reservationId);
  const apiEndpoint = process.env.API_ENDPOINT;
  const apiVersion = process.env.API_VERSION || 'v1';

  try {
    const response = await fetch(`${apiEndpoint}/${apiVersion}/reservation/${reservationId}`);

    if (!response.ok) {
      console.warn('[reservation] API not ok', reservationId, response.status);
      return res.status(404).render('404.njk', {
        title: 'Reservation Not Found'
      });
    }

    const data = await response.json();

    // Extract fields for the updated template, with fallbacks for older API shapes
    const reservation = data.reservation || data;
    const spot = data.spot || reservation.spot || {};
    const calendar = data.calendar || spot.calendar || {};
    const visitor = reservation.visitor || data.visitor || {
      name: data.visitorName || reservation.visitorName,
      email: data.visitorEmail || reservation.visitorEmail
    };
    const bestGuessStartDate = reservation.bestGuessStartDate || data.bestGuessStartDate;
    const bestGuessEndDate = reservation.bestGuessEndDate || data.bestGuessEndDate;
    const relativeIcsURL = reservation.icsURL || data.icsURL;
    const icsURL = relativeIcsURL ? `${apiEndpoint}${relativeIcsURL}` : null;

    // Debug logging to verify data presence
    console.log('[reservation]', reservationId, {
      hasBestGuessStartDate: Boolean(bestGuessStartDate),
      hasBestGuessEndDate: Boolean(bestGuessEndDate),
      hasIcsURL: Boolean(icsURL)
    });

    res.render('reservation-detail.njk', {
      title: 'Reservation Details',
      reservation: data,
      bestGuessStartDate,
      bestGuessEndDate,
      icsURL,
      visitor,
      calendar,
      spot
    });
  } catch (error) {
    console.error('[reservation] Error fetching reservation:', reservationId, error);
    res.status(500).render('404.njk', {
      title: 'Error',
      message: 'An error occurred while loading the reservation details.'
    });
  }
});

export default router;
