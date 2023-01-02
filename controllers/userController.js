/* eslint-disable */
import _ from 'lodash';
import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import User from '../models/User.js';
import Album from '../models/Album.js';
import Genre from '../models/Genre.js';
import Bookmark from '../models/Bookmark.js';
import createSendToken from '../utils/createSendToken.js';
import NotFoundError from '../errors/notFound.js';
import BadRequestError from '../errors/badRequest.js';

export const register = asyncHandler(async (req, res, next) => {
  const newUser = _.pick(req.body, [
    'id',
    'name',
    'email',
    'role',
    'username',
    'password',
    'googeId',
    'confirmPassword',
    'location',
    'favGenres',
    'favArtists',
    'passwordChangedAt',
  ]);

  const user = await User.create({ ...newUser });

  if (user) {
    createSendToken(user, StatusCodes.CREATED, req, res);
  }
});

export const getUsers = asyncHandler(async (req, res, next) => {
  const query = req.query.new;

  const users = query
    ? await User.find().sort('-_id').limit(5)
    : await User.find().sort('-createdAt');

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    nbHits: users.length,
    users,
  });
});

export const getUserStats = asyncHandler(async (req, res, next) => {
  const stats = await User.getUserStats();

  res.status(StatusCodes.OK).json({
    status: 'success',
    stats,
  });
});

export const getUser = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    return next(
      new NotFoundError(`There is no user with the given ID ↔ ${userId}`)
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    user,
  });
});

export const updateUser = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    return next(
      new NotFoundError(`There is no user with the given ID ↔ ${userId}`)
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { ...req.body } },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(StatusCodes.OK).json({
    status: 'success',
    user: updatedUser,
  });
});

export const updateMe = asyncHandler(async (req, res, next) => {
  const { password, confirmPassword } = req.body;

  if (password || confirmPassword) {
    return next(
      new BadRequestError(
        `This route is not for password updates. Please use update ${req.protocol
        }://${req.get('host')}/api/v1/auth/update-my-password`
      )
    );
  }

  const filterBody = _.pick(req.body, [
    'name',
    'email',
    'username',
    'avatar',
    'location',
    'favGenres',
    'favArtists',
  ]);

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { ...filterBody } },
    {
      new: true,
      runValidators: true,
    }
  );

  createSendToken(updatedUser, StatusCodes.OK, req, res);
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    return next(
      new NotFoundError(`There is no user with the given ID ↔ ${userId}`)
    );
  }

  await user.remove();

  res.status(StatusCodes.NO_CONTENT).json({
    status: 'success',
    user: null,
  });
});

export const deleteMe = asyncHandler(async (req, res, next) => {
  const { _id: userId } = req.user;

  const user = await User.findByIdAndUpdate(userId, { active: false });

  await Album.deleteMany({ user: user._id });
  await Genre.deleteMany({ user: user._id });
  await Bookmark.deleteMany({ user: user._id });

  res.status(StatusCodes.NO_CONTENT).json({
    status: 'success',
    user: null,
  });
});

export const getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

export const createUser = (req, res) => {
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'fail',
    message: `This route is not defined! Please use ${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/register`,
  });
};
