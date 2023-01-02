/* eslint-disable */
import express from 'express';

import authMiddleware from '../middlewares/authMiddleware.js';
import * as reviewController from '../controllers/reviewController.js';

const router = express.Router({ mergeParams: true });

router.get('/top', reviewController.getTopReviews);

router.use(authMiddleware.protect);

router
  .route('/')
  .get(reviewController.getReviews)
  .post(authMiddleware.restrictTo('user'), reviewController.createReview);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

export default router;
