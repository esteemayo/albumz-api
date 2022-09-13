const slugify = require('slugify');
const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('express-async-handler');

const Album = require('../models/Album');
const APIFeatures = require('../utils/apiFeatures');
const ForbiddenError = require('../errors/forbidden');
const NotFoundError = require('../errors/notFound');

exports.getAllAlbums = asyncHandler(async (req, res, next) => {
  // filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach((item) => delete queryObj[item]);

  // advanced filering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/, (match) => `$${match}`);

  let query = Album.find(JSON.parse(queryStr));

  // sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // limiting fields
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }

  // pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  const total = await Album.countDocuments();
  query = query.skip(skip).limit(limit);

  const numberOfPages = Math.ceil(total / limit);

  const albums = await query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    nbHits: albums.length,
    currentPage: page,
    totalAlbums: total,
    numberOfPages,
    albums,
  });
});

exports.getUserAlbums = asyncHandler(async (req, res, next) => {
  const { _id: userId } = req.user;

  const features = new APIFeatures(Album.find({ user: userId }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const albums = await features.query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    nbHits: albums.length,
    albums,
  });
});

exports.getFeaturedAlbums = asyncHandler(async (req, res, next) => {
  const albums = await Album.aggregate([
    {
      $match: {
        featured: true,
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $sample: { size: 6 },
    },
  ]);

  res.status(StatusCodes.OK).json({
    status: 'success',
    nbHits: albums.length,
    albums,
  });
});

exports.getAlbumStats = asyncHandler(async (req, res, next) => {
  const today = new Date();
  const lastYear = new Date(today.setFullYear(today.getFullYear() - 1));

  const stats = await Album.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
        createdAt: { $gte: lastYear },
      },
    },
    {
      $project: {
        year: { $year: '$createdAt' },
      },
    },
    {
      $group: {
        _id: '$year',
        numAlbums: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
      },
    },
  ]);

  res.status(StatusCodes.OK).json({
    status: 'success',
    nbHits: stats.length,
    stats,
  });
});

exports.getAlbumsByTag = asyncHandler(async (req, res, next) => {
  const { tag } = req.params;
  const tagQuery = tag || { $exists: true };

  const tagPromise = Album.getTagsList();
  const albumPromise = Album.find({ tags: tagQuery });

  const [tags, albums] = await Promise.all([tagPromise, albumPromise]);

  res.status(StatusCodes.OK).json({
    status: 'success',
    albums,
    tags,
  });
});

exports.getRelatedAlbums = asyncHandler(async (req, res, next) => {
  const tags = req.body;

  const albums = await Album.find({ tags: { $in: tags } });

  res.status(StatusCodes.OK).json({
    status: 'success',
    albums,
  });
});

exports.searchAlbum = asyncHandler(async (req, res, next) => {
  const albums = await Album.find(
    {
      $text: {
        $search: req.query.q,
      },
    },
    {
      score: {
        $meta: 'textScore',
      },
    }
  )
    .sort({
      score: {
        $meta: 'textScore',
      },
    })
    .limit(5);

  res.status(StatusCodes.OK).json({
    status: 'success',
    nbHits: albums.length,
    albums,
  });
});

exports.getAlbumById = asyncHandler(async (req, res, next) => {
  const { id: albumId } = req.params;

  const album = await Album.findById(albumId).populate({ path: 'reviews' });

  if (!album) {
    return next(
      new NotFoundError(`There is no album with the given ID ↔ ${albumId}`)
    );
  }

  if (
    String(album.user._id) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    return res.status(StatusCodes.OK).json({
      status: 'success',
      album,
    });
  }

  return next(
    new ForbiddenError('Not allowed! This album does not belong to you')
  );
});

exports.getAlbumBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;

  const album = await Album.findOne({ slug }).populate({ path: 'reviews' });

  if (!album) {
    return next(
      new NotFoundError(`There is no album with the given SLUG ↔ ${slug}`)
    );
  }

  if (
    String(album.user._id) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    return res.status(StatusCodes.OK).json({
      status: 'success',
      album,
    });
  }

  return next(
    new ForbiddenError('Not allowed! This album does not belong to you')
  );
});

exports.createAlbum = asyncHandler(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user._id;

  const album = await Album.create({ ...req.body });

  if (album) {
    return res.status(StatusCodes.CREATED).json({
      status: 'success',
      album,
    });
  }
});

exports.updateAlbum = asyncHandler(async (req, res, next) => {
  const { id: albumId } = req.params;

  const album = await Album.findById(albumId);

  if (!album) {
    return next(
      new NotFoundError(`There is no album with the given ID ↔ ${albumId}`)
    );
  }

  if (req.body.title) req.body.slug = slugify(req.body.title, { lower: true });

  if (
    String(album.user._id) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    const updatedAlbum = await Album.findByIdAndUpdate(
      albumId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(StatusCodes.OK).json({
      status: 'success',
      album: updatedAlbum,
    });
  }

  return next(
    new ForbiddenError('Not allowed! This album does not belong to you')
  );
});

exports.likeAlbum = asyncHandler(async (req, res, next) => {
  const { id: albumId } = req.params;

  const album = await Album.findById(albumId);

  if (!album) {
    return next(
      new NotFoundError(`There is no album with the given ID ↔ ${albumId}`)
    );
  }

  const index = album.likes.findIndex((id) => id === String(req.user._id));

  if (index === -1) {
    album.likes.push(req.user._id);
  } else {
    album.likes = album.likes.filter((id) => id !== String(req.user._id));
  }

  const updatedAlbum = await Album.findByIdAndUpdate(
    albumId,
    { $set: { ...album } },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(StatusCodes.OK).json({
    status: 'success',
    album: updatedAlbum,
  });
});

exports.deleteAlbum = asyncHandler(async (req, res, next) => {
  const { id: albumId } = req.params;

  const album = await Album.findById(albumId);

  if (!album) {
    return next(
      new NotFoundError(`There is no album with the given ID ↔ ${albumId}`)
    );
  }

  if (
    String(album.user._id) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    await album.remove();

    return res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      album: null,
    });
  }

  return next(
    new ForbiddenError('Not allowed! This album does not belong to you')
  );
});
