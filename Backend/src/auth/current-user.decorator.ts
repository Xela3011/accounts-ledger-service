import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { AuthenticatedUser } from './models/authenticated-user.model';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

interface GraphQLContext {
  req: AuthenticatedRequest;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext<GraphQLContext>().req;

    if (!request.user) {
      throw new Error('Current user is unavailable');
    }

    return request.user;
  },
);
