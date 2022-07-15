import { hasPermission } from '../utils.js';
import { plans } from '../plans.js';

const Query = {
  me(parent, args, ctx, info) {
    //check if there is a current user
    if (!ctx.request.userId) {
      return null;
    }
    return ctx.db.query.user(
      {
        where: { id: ctx.request.userId },
      },
      info
    );
  },
  async users(parent, args, ctx, info) {
    //1. Check if log in;

    if (!ctx.request.userId) {
      throw new Error('You must be logged in!');
    }
    //1. Check if user has permissions to query all users.
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE']);
    //2. If they do, query all the users.
    return ctx.db.query.users({}, info);
  },
  async getPlansList(parent, args, ctx, info) {
    //array of hardcoded plans
    return plans;
  },
};

export default Query;
