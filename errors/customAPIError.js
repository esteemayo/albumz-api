import { StatusCodes } from 'http-status-codes';

class CustomAPIError extends Error {
  constructor(message) {
    super(message);

    this.status = 'error';
    this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  }
}

export default CustomAPIError;
