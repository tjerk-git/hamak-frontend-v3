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
  const apiEndpoint = process.env.API_ENDPOINT;
  const apiVersion = process.env.API_VERSION || 'v1';

  try {
    const response = await fetch(`${apiEndpoint}/${apiVersion}/reservation/${reservationId}`);

    if (!response.ok) {
      return res.status(404).render('404.njk', {
        title: 'Reservation Not Found'
      });
    }

    const data = await response.json();

    res.render('reservation-detail.njk', {
      title: 'Reservation Details',
      reservation: data
    });
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).render('404.njk', {
      title: 'Error',
      message: 'An error occurred while loading the reservation details.'
    });
  }
});

export default router;
