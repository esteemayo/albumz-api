const express = require('express');

const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const historyController = require('../controllers/historyController');

const router = express.Router();

router.use(authMiddleware.protect);

router.get(
  '/admin',
  authController.restrictTo('admin'),
  historyController.getAdminHistories
);

router.get('/album/:id', historyController.getHistoriesOnAlbum);

router
  .route('/')
  .get(historyController.getHistories)
  .post(historyController.createHistory);

router.use(authController.restrictTo('admin'));

router
  .route('/:id')
  .get(historyController.getHistory)
  .patch(historyController.updateHistory)
  .delete(historyController.deleteHistory);

module.exports = router;
