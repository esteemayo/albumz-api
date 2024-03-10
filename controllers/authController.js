/* eslint-disable */
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import asyncHandler from 'express-async-handler';

import createSendToken from '../utils/createSendToken.js';
import sendEmail from '../utils/email.js';
import createSendGoogleToken from '../utils/createSendGoogleToken.js';

import NotFoundError from '../errors/notFound.js';
import CustomAPIError from '../errors/customAPIError.js';
import BadRequestError from '../errors/badRequest.js';
import UnauthenticatedError from '../errors/unauthenticated.js';

import User from '../models/User.js';

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new BadRequestError('Please provide email and password'));
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return next(new UnauthenticatedError('Incorrect email or password'));
  }

  createSendToken(user, StatusCodes.OK, req, res);
});

export const googleLogin = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  let user = await User.findOne({ email });

  if (user) {
    return createSendGoogleToken(user, StatusCodes.OK, req, res);
  }

  user = await User.create({
    ...req.body,
    fromGoogle: true,
  });

  createSendGoogleToken(user, StatusCodes.OK, req, res);
});

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new BadRequestError('Please provide your email address'));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(
      new NotFoundError('There is no user user with the email address')
    );
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `http://localhost:3000/auth/reset/${resetToken}`;

  // const resetURL = `${req.protocol}://${req.get(
  //   'host'
  // )}/api/v1/auth/reset-token/${resetToken}`;

  const message = `
    Hi ${user.name},
    There was a request to change your password!
    If you did not make this request then please ignore this email.
    Otherwise, please click this link to change your password: ${resetURL}
  `;

  const html = `
    <div style='background: #f7f7f7; color: #333; padding: 50px; text-align: left;'>
      <h3>Hi ${user.name},</h3>
      <p>There was a request to change your password!</p>
      <p>If you did not make this request then please ignore this email.</p>
      <p>Otherwise, please click this link to change your password: 
        <a href='${resetURL}'>Reset my password →</a>
      </p>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 mins)',
      message,
      html,
    });

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Token sent to email ↔ ${user.email}`,
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new CustomAPIError(
        'There was an error sending the email. try again later'
      )
    );
  }
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { password, confirmPassword } = req.body;

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new BadRequestError('Token is invalid or has expired'));
  }

  user.password = password;
  user.confirmPassword = confirmPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  createSendToken(user, StatusCodes.OK, req, res);
});

export const updatePassword = asyncHandler(async (req, res, next) => {
  const { password, confirmPassword, currentPassword } = req.body;

  const user = await User.findById(req.user._id);

  if (!(await user.comparePassword(currentPassword))) {
    return next(new UnauthenticatedError('Your current password is incorrect'));
  }

  user.password = password;
  user.confirmPassword = confirmPassword;
  await user.save();

  createSendToken(user, StatusCodes.OK, req, res);
});
