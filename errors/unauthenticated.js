const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./customAPIError');

class UnauthenticatedError extends CustomAPIError {
  constructor(message) {
    super(message);

    this.status = 'fail';
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

module.exports = UnauthenticatedError;
