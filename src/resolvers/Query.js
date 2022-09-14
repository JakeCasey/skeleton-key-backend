import { hasPermission } from '../utils.js';
import { plans } from '../plans.js';

const Query = {
  me(parent, args, ctx, info) {
    //check if there is a current user
    if (!ctx.req.userId) {
      return null;
    }
    return ctx.prisma.user.findUnique({
      where: { id: ctx.req.userId },
    });
  },
  async users(parent, args, ctx, info) {
    //1. Check if log in;

    // if (!ctx.req.userId) {
    //   throw new Error('You must be logged in!');
    // }
    // //1. Check if user has permissions to query all users.
    // hasPermission(ctx.req.user, ['ADMIN', 'PERMISSIONUPDATE']);
    //2. If they do, query all the users.
    return ctx.prisma.user.findMany({ where: {} });
  },
  async getPlansList(parent, args, ctx, info) {
    //array of hardcoded plans
    return plans;
  },
};

export default Query;
