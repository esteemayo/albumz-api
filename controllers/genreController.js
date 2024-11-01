/* eslint-disable */

import { StatusCodes } from 'http-status-codes';
import slugify from 'slugify';
import asyncHandler from 'express-async-handler';

import Genre from '../models/Genre.js';

import NotFoundError from '../errors/notFound.js';
import ForbiddenError from '../errors/forbidden.js';

import APIFeatures from '../utils/apiFeatures.js';

export const getGenres = asyncHandler(async (req, res, next) => {
  const { _id: userId } = req.user._id;

  const features = new APIFeatures(Genre.find({ user: userId }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const genres = await features.query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    nbHits: genres.length,
    genres,
  });
});

export const getAllGenres = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(Genre.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const genres = await features.query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    nbHits: genres.length,
    genres,
  });
});

export const getGenreById = asyncHandler(async (req, res, next) => {
  const { id: genreId } = req.params;

  const genre = await Genre.findById(genreId);

  if (!genre) {
    return next(
      new NotFoundError(`There is no genre with the given ID ↔ ${genreId}`)
    );
  }

  if (
    String(genre.user) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    return res.status(StatusCodes.OK).json({
      status: 'success',
      genre,
    });
  }

  return next(
    new ForbiddenError('Not allowed! This genre does not belong to you')
  );
});

export const getGenreBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;

  const genre = await Genre.findOne({ slug });

  if (!genre) {
    return next(
      new NotFoundError(`There is no genre with the given SLUG ↔ ${slug}`)
    );
  }

  if (
    String(genre.user._id) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    return res.status(StatusCodes.OK).json({
      status: 'success',
      genre,
    });
  }

  return next(
    new ForbiddenError('Not allowed! This genre does not belong to you')
  );
});

export const createGenre = asyncHandler(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user._id;

  const genre = await Genre.create({ ...req.body });

  if (genre) {
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      genre,
    });
  }
});

export const updateGenre = asyncHandler(async (req, res, next) => {
  const { id: genreId } = req.params;

  const genre = await Genre.findById(genreId);

  if (!genre) {
    return next(
      new NotFoundError(`There is no genre with the given ID ↔ ${genreId}`)
    );
  }

  if (req.body.name) req.body.slug = slugify(req.body.name, { lower: true });

  if (
    String(genre.user._id) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    const updatedGenre = await Genre.findByIdAndUpdate(
      genreId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(StatusCodes.OK).json({
      status: 'success',
      genre: updatedGenre,
    });
  }

  return next(
    new ForbiddenError('Not allowed! This genre does not belong to you')
  );
});

export const deleteGenre = asyncHandler(async (req, res, next) => {
  const { id: genreId } = req.params;

  const genre = await Genre.findById(genreId);

  if (!genre) {
    return next(
      new NotFoundError(`There is no genre with the given ID ↔ ${genreId}`)
    );
  }

  if (
    String(genre.user._id) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    await genre.remove();

    return res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      genre: null,
    });
  }

  return next(
    new ForbiddenError('Not allowed! This genre does not belong to you')
  );
});
