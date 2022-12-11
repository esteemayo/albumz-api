import { StatusCodes } from 'http-status-codes';
import CustomAPIError from './customAPIError.js';

class NotFoundError extends CustomAPIError {
  constructor(message) {
    super(message);

    this.status = 'fail';
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

export default NotFoundError;
