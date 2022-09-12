const _ = require('lodash');
const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('express-async-handler');

const History = require('../models/History');
const APIFeatures = require('../utils/apiFeatures');
const NotFoundError = require('../errors/notFound');
const ForbiddenError = require('../errors/forbidden');

exports.getHistories = asyncHandler(async (req, res, next) => {
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

exports.getAdminHistories = asyncHandler(async (req, res, next) => {
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

exports.getHistory = asyncHandler(async (req, res, next) => {
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

exports.getHistoriesOnAlbum = asyncHandler(async (req, res, next) => {
  const { id: albumId } = req.params;

  const histories = await History.find({ album: albumId });

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    nbHits: histories.length,
    histories,
  });
});

exports.createHistory = asyncHandler(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user._id;

  const history = await History.create({ ...req.body });

  if (history) {
    return res.status(StatusCodes.CREATED).json({
      status: 'success',
      history,
    });
  }
});

exports.updateHistory = asyncHandler(async (req, res, next) => {
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

exports.deleteHistory = asyncHandler(async (req, res, next) => {
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
