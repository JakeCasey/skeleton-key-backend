const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');

const Query = {
  usersConnection: forwardTo('db'),
  me(parent, args, ctx, info) {
    //check if there is a current user
    if (!ctx.request.userId) {
      return null;
    }
    return ctx.db.query.user(
      {
        where: { id: ctx.request.userId },
      },
      info,
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
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items();
  //   return items;
  // },
};

module.exports = Query;
