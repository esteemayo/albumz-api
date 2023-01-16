/* eslint-disable */
import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import Review from '../models/Review.js';
import APIFeatures from '../utils/apiFeatures.js';
import ForbiddenError from '../errors/forbidden.js';
import NotFoundError from '../errors/notFound.js';

export const getReviews = asyncHandler(async (req, res, next) => {
  let filter = {};
  if (req.params.albumId) filter = { album: req.params.albumId };

  const features = new APIFeatures(Review.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const reviews = await features.query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    nbHits: reviews.length,
    reviews,
  });
});

export const getTopReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.getTopReviews();

  res.status(StatusCodes.OK).json({
    status: 'success',
    reviews,
  });
});

export const getReview = asyncHandler(async (req, res, next) => {
  const { id: reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    return next(
      new NotFoundError(`There is no review with the given ID ↔ ${reviewId}`)
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    review,
  });
});

export const createReview = asyncHandler(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user._id;
  if (!req.body.album) req.body.album = req.params.albumId;

  const review = await Review.create({ ...req.body });

  if (review) {
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      review,
    });
  }
});

export const updateReview = asyncHandler(async (req, res, next) => {
  const { id: reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    return next(
      new NotFoundError(`There is no review with the given ID ↔ ${reviewId}`)
    );
  }

  if (
    String(review.user._id) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(StatusCodes.OK).json({
      status: 'success',
      review: updatedReview,
    });
  }

  return next(
    new ForbiddenError('Not allowed! This review does not belong to you')
  );
});

export const deleteReview = asyncHandler(async (req, res, next) => {
  const { id: reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    return next(
      new NotFoundError(`There is no review with the given ID ↔ ${reviewId}`)
    );
  }

  if (
    String(review.user._id) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    await review.remove();

    return res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      review: null,
    });
  }

  return next(
    new ForbiddenError('Not allowed! This review does not belong to you')
  );
});
