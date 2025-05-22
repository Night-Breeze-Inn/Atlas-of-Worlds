import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../auth.service';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      console.error(
        'AuthUser Decorator: request.user is undefined! AuthGuard might not have run or failed.',
      );
    }
    return request.user;
  },
);
