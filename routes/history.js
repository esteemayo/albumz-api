import express from 'express';

import authController from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import historyController from '../controllers/historyController.js';

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

export default router;
