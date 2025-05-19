import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface RequestWithTempUser extends Request {
  body: {
    tempCurrentUserId?: string;
    [key: string]: any;
  };
  query: {
    tempCurrentUserId?: string;
    [key: string]: any;
  };
  headers: {
    'x-temp-user-id'?: string;
    [key: string]: any;
  };
}

export const TempUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithTempUser>();

    const userIdFromBody = request.body?.tempCurrentUserId;
    const userIdFromQuery = request.query?.tempCurrentUserId;
    const userIdFromHeader = request.headers['x-temp-user-id'];

    const userId = userIdFromBody || userIdFromQuery || userIdFromHeader;

    return userId || '00000000-0000-0000-0000-000000000000';
  },
);
