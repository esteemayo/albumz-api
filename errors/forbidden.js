const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./customAPIError');

class ForbiddenError extends CustomAPIError {
  constructor(message) {
    super(message);

    this.status = 'fail';
    this.statusCode = StatusCodes.FORBIDDEN;
  }
}

module.exports = ForbiddenError;
