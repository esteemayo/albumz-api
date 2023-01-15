const createSendGoogleToken = (user, token, status, req, res) => {
  res.cookie('token', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  res.status(status).json({
    status: 'success',
    token,
    user,
  });
};

export default createSendGoogleToken;
