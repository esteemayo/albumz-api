import { StatusCodes } from 'http-status-codes';
import CustomAPIError from './customAPIError.js';

class UnauthenticatedError extends CustomAPIError {
  constructor(message) {
    super(message);

    this.status = 'fail';
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

export default UnauthenticatedError;
