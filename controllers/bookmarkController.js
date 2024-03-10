/* eslint-disable */
import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import Bookmark from '../models/Bookmark.js';
import APIFeatures from '../utils/apiFeatures.js';

import BadRequestError from '../errors/badRequest.js';
import NotFoundError from '../errors/notFound.js';
import ForbiddenError from '../errors/forbidden.js';

export const getBookmarks = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(
    Bookmark.find({ user: req.user._id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const bookmarks = await features.query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    nbHits: bookmarks.length,
    bookmarks,
  });
});

export const getAdminBookmarks = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(Bookmark.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const bookmarks = await features.query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    nbHits: bookmarks.length,
    bookmarks,
  });
});

export const getBookmark = asyncHandler(async (req, res, next) => {
  const {
    user: { _id: userId },
    params: { id: bookmarkId },
  } = req;

  const bookmark = await Bookmark.findById(bookmarkId);

  if (!bookmark) {
    return next(
      new NotFoundError(
        `There is no bookmark with the given ID ↔ ${bookmarkId}`
      )
    );
  }

  if (String(bookmark.user) === String(userId) || req.user.role === 'admin') {
    return res.status(StatusCodes.OK).json({
      status: 'success',
      bookmark,
    });
  }

  return next(
    new ForbiddenError('Not allowed! You do not have access to this bookmark')
  );
});

export const getOneBookmark = asyncHandler(async (req, res, next) => {
  const {
    user: { _id: userId },
    params: { albumId },
  } = req;

  const bookmark = await Bookmark.findOne({
    user: userId,
    album: albumId,
  });

  if (!bookmark) {
    return next(
      new NotFoundError(
        `There is no bookmark with the given IDs ↔ ${userId} & ${albumId}`
      )
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    bookmark,
  });
});

export const createBookmark = asyncHandler(async (req, res, next) => {
  const {
    body: { album },
    user: { _id: userId },
  } = req;

  if (!req.body.user) req.body.user = req.user._id;

  let bookmark = await Bookmark.findOne({
    user: userId,
    album,
  });

  if (bookmark) {
    return next(new BadRequestError('You already have this set as a bookmark'));
  }

  bookmark = await Bookmark.create({ ...req.body });

  res.status(StatusCodes.CREATED).json({
    status: 'success',
    bookmark,
  });
});

export const updateBookmark = asyncHandler(async (req, res, next) => {
  const { id: bookmarkId } = req.params;

  const bookmark = await Bookmark.findById(bookmarkId);

  if (!bookmark) {
    return next(
      new NotFoundError(
        `There is no bookmark with the given ID ↔ ${bookmarkId}`
      )
    );
  }

  if (
    String(bookmark.user) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    const updatedBookmark = await Bookmark.findByIdAndUpdate(
      bookmarkId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(StatusCodes.OK).json({
      status: 'success',
      bookmark: updatedBookmark,
    });
  }

  return next(
    new ForbiddenError('Not allowed! You do not have access to this bookmark')
  );
});

export const deleteBookmark = asyncHandler(async (req, res, next) => {
  const { id: bookmarkId } = req.params;

  const bookmark = await Bookmark.findById(bookmarkId);

  if (!bookmark) {
    return next(
      new NotFoundError(
        `There is no bookmark with the given ID ↔ ${bookmarkId}`
      )
    );
  }

  if (
    String(bookmark.user) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    await bookmark.remove();

    return res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      bookmark: null,
    });
  }

  return next(
    new ForbiddenError('Not allowed! You do not have access to this bookmark')
  );
});
