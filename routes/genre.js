const express = require('express');

const authMiddleware = require('../middlewares/authMiddleware');
const genreController = require('../controllers/genreController');

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

module.exports = router;
