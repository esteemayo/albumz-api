import express from 'express';

import authMiddleware from '../middlewares/authMiddleware.js';
import * as genreController from '../controllers/genreController.js';

const router = express.Router();

router.get('/all', genreController.getAllGenres);

router.use(authMiddleware.protect);

router.get('/show/:slug', genreController.getGenreBySlug);

router
  .route('/')
  .get(genreController.getGenres)
  .post(genreController.createGenre);

router
  .route('/:id')
  .get(genreController.getGenreById)
  .patch(genreController.updateGenre)
  .delete(genreController.deleteGenre);

export default router;
