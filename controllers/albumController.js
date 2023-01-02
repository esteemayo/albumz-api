/* eslint-disable */
import slugify from 'slugify';
import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import Album from '../models/Album.js';
import APIFeatures from '../utils/apiFeatures.js';
import ForbiddenError from '../errors/forbidden.js';
import NotFoundError from '../errors/notFound.js';

export const getAllAlbums = asyncHandler(async (req, res, next) => {
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
  const limit = req.query.limit * 1 || 6;
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
    limit,
  });
});

export const getUserAlbums = asyncHandler(async (req, res, next) => {
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

export const getFeaturedAlbums = asyncHandler(async (req, res, next) => {
  const albums = await Album.getFeaturedAlbums();

  res.status(StatusCodes.OK).json({
    status: 'success',
    nbHits: albums.length,
    albums,
  });
});

export const getAlbumStats = asyncHandler(async (req, res, next) => {
  const stats = await Album.getAlbumStats();

  res.status(StatusCodes.OK).json({
    status: 'success',
    nbHits: stats.length,
    stats,
  });
});

export const getTopAlbums = asyncHandler(async (req, res, next) => {
  const albums = await Album.getTopAlbums();

  res.status(StatusCodes.OK).json({
    status: 'success',
    nbHits: albums.length,
    albums,
  });
});

export const getAlbumsByTag = asyncHandler(async (req, res, next) => {
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

export const getRelatedAlbums = asyncHandler(async (req, res, next) => {
  const tags = req.body;

  const albums = await Album.find({ tags: { $in: tags } });

  res.status(StatusCodes.OK).json({
    status: 'success',
    albums,
  });
});

export const searchAlbum = asyncHandler(async (req, res, next) => {
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

export const getAlbumById = asyncHandler(async (req, res, next) => {
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

export const getAlbumBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;

  const album = await Album.findOne({ slug }).populate({ path: 'reviews' });

  if (!album) {
    return next(
      new NotFoundError(`There is no album with the given SLUG ↔ ${slug}`)
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    album,
  });
});

export const createAlbum = asyncHandler(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user._id;

  const album = await Album.create({ ...req.body });

  if (album) {
    return res.status(StatusCodes.CREATED).json({
      status: 'success',
      album,
    });
  }
});

export const updateAlbum = asyncHandler(async (req, res, next) => {
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

export const likeAlbum = asyncHandler(async (req, res, next) => {
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

export const deleteAlbum = asyncHandler(async (req, res, next) => {
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
