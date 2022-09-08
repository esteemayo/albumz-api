const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./customAPIError');

class BadRequestError extends CustomAPIError {
  constructor(message) {
    super(message);

    this.status = 'fail';
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

module.exports = BadRequestError;
