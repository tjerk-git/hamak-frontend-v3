import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.render('about.njk', { title: 'About' });
});

export default router;
