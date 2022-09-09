const _ = require('lodash');
const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('express-async-handler');

const User = require('../models/User');
const Album = require('../models/Album');
const Genre = require('../models/Genre');
const createSendToken = require('../utils/createSendToken');
const NotFoundError = require('../errors/notFound');
const BadRequestError = require('../errors/badRequest');

exports.register = asyncHandler(async (req, res, next) => {
  const user = await User.create({ ...req.body });

  if (user) {
    createSendToken(user, StatusCodes.CREATED, req, res);
  }
});

exports.getUsers = asyncHandler(async (req, res, next) => {
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

exports.getUserStats = asyncHandler(async (req, res, next) => {
  const date = new Date();
  const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));

  const stats = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: lastYear },
      },
    },
    {
      $project: {
        month: { $month: '$createdAt' },
      },
    },
    {
      $group: {
        _id: '$month',
        total: { $sum: 1 },
      },
    },
  ]);

  res.status(StatusCodes.OK).json({
    status: 'success',
    stats,
  });
});

exports.getUser = asyncHandler(async (req, res, next) => {
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

exports.updateUser = asyncHandler(async (req, res, next) => {
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

exports.updateMe = asyncHandler(async (req, res, next) => {
  const { password, confirmPassword } = req.body;

  if (password || confirmPassword) {
    return next(
      new BadRequestError(
        `This route is not for password updates. Please use update ${
          req.protocol
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

  res.status(StatusCodes.OK).json({
    status: 'success',
    user: updatedUser,
  });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
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

exports.deleteMe = asyncHandler(async (req, res, next) => {
  const { _id: userId } = req.user;

  const user = await User.findByIdAndUpdate(userId, { active: false });

  await Album.deleteMany({ user: user._id });
  await Genre.deleteMany({ user: user._id });

  res.status(StatusCodes.NO_CONTENT).json({
    status: 'success',
    user: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.createUser = (req, res) => {
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'fail',
    message: `This route is not defined! Please use ${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/register`,
  });
};
