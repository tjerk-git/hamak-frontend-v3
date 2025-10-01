import express from 'express';
import nunjucks from 'nunjucks';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import homeRoutes from './routes/home.js';
import aboutRoutes from './routes/about.js';
import calendarRoutes from './routes/calendar.js';
import reservationRoutes from './routes/reservation.js';
import localRoutes from './routes/local.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Nunjucks
nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: true
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.use('/', homeRoutes);
app.use('/about', aboutRoutes);
app.use('/local', localRoutes);
app.use('/', reservationRoutes);
app.use('/', calendarRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404.njk', { title: 'Page Not Found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
