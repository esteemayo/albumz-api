const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('express-async-handler');

const APIFeatures = require('../utils/apiFeatures');
const NotFoundError = require('../errors/notFound');

exports.getAll = (Model) =>
  asyncHandler(async (req, res, next) => {
    let filter = {};
    if (req.params.albumId) filter = { album: req.params.albumId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docs = await features.query;

    res.status(StatusCodes.OK).json({
      status: 'success',
      requestedAt: req.requestTime,
      nbHits: docs.length,
      docs,
    });
  });

exports.getOneById = (Model, popOptions) =>
  asyncHandler(async (req, res, next) => {
    const { id: docId } = req.params;

    let query = Model.findById(docId);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(
        new NotFoundError(`There is no document with the given ID ↔ ${docId}`)
      );
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      doc,
    });
  });

exports.getOneBySlug = (Model, popOptions) =>
  asyncHandler(async (req, res, next) => {
    const { slug } = req.params;

    let query = Model.findOne({ slug });
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(
        new NotFoundError(`There is no document with the given SLUG ↔ ${slug}`)
      );
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      doc,
    });
  });

exports.createOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const doc = await Model.create({ ...req.body });

    if (doc) {
      return res.status(StatusCodes.CREATED).json({
        status: 'success',
        doc,
      });
    }
  });

exports.updateOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id: docId } = req.params;

    const doc = await Model.findById(docId);

    if (!doc) {
      return next(
        new NotFoundError(`There is no document with the given ID ↔ ${docId}`)
      );
    }

    const updatedDoc = await Model.findByIdAndUpdate(
      docId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(StatusCodes.OK).json({
      status: 'success',
      doc: updatedDoc,
    });
  });

exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id: docId } = req.params;

    const doc = await Model.findById(docId);

    if (!doc) {
      return next(
        new NotFoundError(`There is no document with the given ID ↔ ${docId}`)
      );
    }

    await Model.findByIdAndDelete(docId);

    res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      doc: null,
    });
  });
