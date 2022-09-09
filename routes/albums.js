const express = require('express');

const authMiddleware = require('../middlewares/authMiddleware');
const albumController = require('../controllers/albumController');

const router = express.Router();

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
