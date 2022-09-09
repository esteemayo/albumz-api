const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('express-async-handler');

const Review = require('../models/Review');
const APIFeatures = require('../utils/apiFeatures');
const ForbiddenError = require('../errors/forbidden');
const NotFoundError = require('../errors/notFound');

exports.getReviews = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(Review.find(), req.query)
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

exports.getReview = asyncHandler(async (req, res, next) => {
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

exports.createReview = asyncHandler(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user._id;
  if (!req.body.album) req.body.album = req.params.id;

  const review = await Review.create({ ...req.body });

  if (review) {
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      review,
    });
  }
});

exports.updateReview = asyncHandler(async (req, res, next) => {
  const { id: reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    return next(
      new NotFoundError(`There is no review with the given ID ↔ ${reviewId}`)
    );
  }

  if (
    String(review.user) === String(req.user._id) ||
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

exports.deleteReview = asyncHandler(async (req, res, next) => {
  const { id: reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    return next(
      new NotFoundError(`There is no review with the given ID ↔ ${reviewId}`)
    );
  }

  if (
    String(review.user) === String(req.user._id) ||
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