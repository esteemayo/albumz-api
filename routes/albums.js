const express = require('express');

const reviewRouter = require('./reviews');
const authMiddleware = require('../middlewares/authMiddleware');
const albumController = require('../controllers/albumController');

const router = express.Router();

router.use('/:albumId/reviews', reviewRouter);

router.get('/search', albumController.searchAlbum);

router.post('/related-albums', albumController.getRelatedAlbums);

router.get('/tags/:tag', albumController.getAlbumsByTag);

router.get(
  '/user-albums',
  authMiddleware.protect,
  albumController.getUserAlbums
);

router.get(
  '/details/:slug',
  authMiddleware.protect,
  albumController.getAlbumBySlug
);

router.patch(
  '/like-album/:id',
  authMiddleware.protect,
  albumController.likeAlbum
);

router
  .route('/')
  .get(albumController.getAllAlbums)
  .post(authMiddleware.protect, albumController.createAlbum);

router
  .route('/:id')
  .get(authMiddleware.protect, albumController.getAlbumById)
  .patch(albumController.updateAlbum)
  .delete(albumController.deleteAlbum);

module.exports = router;
