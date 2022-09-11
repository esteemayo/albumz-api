const express = require('express');

const authmiddleware = require('../middlewares/authMiddleware');
const bookmarkController = require('../controllers/bookmarkController');

const router = express.Router();

router.use(authmiddleware.protect);

router.get('/album/:albumId', bookmarkController.getOneBookmark);

router
  .route('/')
  .get(bookmarkController.getBookmarks)
  .post(bookmarkController.createBookmark);

router
  .route('/:id')
  .get(bookmarkController.getBookmark)
  .patch(bookmarkController.updateBookmark)
  .delete(bookmarkController.deleteBookmark);

module.exports = router;