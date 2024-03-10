/* eslint-disable */
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';
import asyncHandler from 'express-async-handler';

import History from '../models/History.js';
import APIFeatures from '../utils/apiFeatures.js';

import NotFoundError from '../errors/notFound.js';
import ForbiddenError from '../errors/forbidden.js';

export const getHistories = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(
    History.find({ user: req.user._id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  let histories = await features.query;
  histories = _.uniq(histories.map((item) => item.album));

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    nbHits: histories.length,
    histories,
  });
});

export const getAdminHistories = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(History.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const histories = await features.query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    nbHits: histories.length,
    histories,
  });
});

export const getHistory = asyncHandler(async (req, res, next) => {
  const { id: historyId } = req.params;

  const history = await History.findById(historyId);

  if (!history) {
    return next(
      new NotFoundError(`There is no history with the given ID ↔ ${historyId}`)
    );
  }

  if (history.user === String(req.user._id) || req.user.role === 'admin') {
    return res.status(StatusCodes.OK).json({
      status: 'success',
      history,
    });
  }
});

export const getHistoriesOnAlbum = asyncHandler(async (req, res, next) => {
  const { id: albumId } = req.params;

  const histories = await History.find({ album: albumId });

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    nbHits: histories.length,
    histories,
  });
});

export const createHistory = asyncHandler(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user._id;

  const history = await History.create({ ...req.body });

  if (history) {
    return res.status(StatusCodes.CREATED).json({
      status: 'success',
      history,
    });
  }
});

export const updateHistory = asyncHandler(async (req, res, next) => {
  const { id: historyId } = req.params;

  const history = await History.findById(historyId);

  if (!history) {
    return next(
      new NotFoundError(`There is no history with the given ID ↔ ${historyId}`)
    );
  }

  if (history.user === String(req.user._id) || req.user.role === 'admin') {
    const updatedHistory = await History.findByIdAndUpdate(
      historyId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(StatusCodes.OK).json({
      status: 'success',
      history: updatedHistory,
    });
  }

  return next(
    new ForbiddenError('Not allowed! You do not have access to this history')
  );
});

export const deleteHistory = asyncHandler(async (req, res, next) => {
  const { id: historyId } = req.params;

  const history = await History.findById(historyId);

  if (!history) {
    return next(
      new NotFoundError(`There is no history with the given ID ↔ ${historyId}`)
    );
  }

  if (history.user === String(req.user._id) || req.user.role === 'admin') {
    await history.remove();

    return res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      history: null,
    });
  }

  return next(
    new ForbiddenError('Not allowed! You do not have access to this history')
  );
});
