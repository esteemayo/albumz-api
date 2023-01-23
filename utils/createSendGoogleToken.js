const createSendGoogleToken = (user, status, req, res) => {
  const token = user.generateToken();

  res.cookie('token', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: true,
    path: '/',
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  res.status(status).json({
    status: 'success',
    token,
    user,
  });
};

export default createSendGoogleToken;
