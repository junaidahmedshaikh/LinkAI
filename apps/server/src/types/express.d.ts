import { IUserDocument } from "../models/User.model";

declare global {
  namespace Express {
    interface User extends IUserDocument {}
    interface Request {
      userId?: string;
      userRole?: string;
      sessionId?: string;
      deviceId?: string;
    }
  }
}

export {};
