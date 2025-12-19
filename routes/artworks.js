import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.get('/artworks', async (req, res) => {
  try {
    const artworksDir = path.resolve('public', 'artworks');

    // Ensure artworks directory exists
    if (!fs.existsSync(artworksDir)) {
      fs.mkdirSync(artworksDir, { recursive: true });
    }

    // Read all files from artworks directory
    const files = fs.readdirSync(artworksDir);

    // Filter for image files (png, jpg, jpeg, gif, webp)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
    });

    // Sort by modification time (newest first)
    const imagesWithStats = imageFiles.map(file => {
      const filePath = path.join(artworksDir, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        url: `/artworks/${file}`,
        uploadedAt: stats.mtime,
        size: stats.size
      };
    });

    // Sort by upload time (newest first)
    imagesWithStats.sort((a, b) => b.uploadedAt - a.uploadedAt);

    res.render('artworks.njk', {
      title: 'Artwork Gallery',
      artworks: imagesWithStats,
      count: imagesWithStats.length
    });
  } catch (error) {
    console.error('Error loading artworks:', error);
    res.status(500).render('404.njk', {
      title: 'Error',
      message: 'Unable to load artworks'
    });
  }
});

export default router;
