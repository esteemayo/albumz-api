import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import asyncHandler from 'express-async-handler';

import User from '../models/User.js';
import UnauthenticatedError from '../errors/unauthenticated.js';

const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  const isCustomAuth = token && token.length < 500;

  if (!token) {
    return next(
      new UnauthenticatedError(
        'You are not logged in! Please log in to get access'
      )
    );
  }

  if (token && isCustomAuth) {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id).select('-password');
    if (!currentUser) {
      return next(
        new UnauthenticatedError(
          'The user belonging to this token does no longer exist'
        )
      );
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new UnauthenticatedError(
          'User recently changed password! Please log in again'
        )
      );
    }

    req.user = currentUser;
  } else {
    const decodedData = jwt.decode(token);
    const googleId = decodedData.sub && decodedData.sub.toString();
    const user = await User.findOne({ googleId });
    req.user = user;
  }

  next();
});

const authMiddleware = { protect };

export default authMiddleware;
