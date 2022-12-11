import express from 'express';

import authMiddleware from '../middlewares/authMiddleware.js';
import * as authController from '../controllers/authController.js';
import * as historyController from '../controllers/historyController.js';

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
