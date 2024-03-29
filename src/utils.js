import { prisma } from './db.js';

function hasPermission(user, permissionsNeeded) {
  const matchedPermissions = user.permissions.filter((permissionTheyHave) =>
    permissionsNeeded.includes(permissionTheyHave)
  );
  if (!matchedPermissions.length) {
    throw new Error(`You do not have sufficient permissions

      : ${permissionsNeeded}

      You Have:

      ${user.permissions}
      `);
  }
}

function isAdmin(user) {
  if (!user.permissions.includes('ADMIN')) {
    return false;
  }
  return true;
}

async function isSubscribedByUserId(userId) {
  let user = await db.query.user({ where: { id: userId } }, `{id period_ends}`);

  if (!user.period_ends) {
    throw new Error(`You're not subscribed!`);
  }

  var today = new Date().getTime() / 1000;
  var period_ends = parseInt(user.period_ends);

  if (today >= period_ends) {
    throw new Error(`It looks like your subscription has expired!`);
  } else {
    return true;
  }
}

let getPlanInfoByPriceIdOrName = (id, plan_name = '') => {
  if (
    id == 'price_1I8oAVCCVqelePsAgw0vlYlH' ||
    id == 'price_1I8oAnCCVqelePsAVmjYFIfC' ||
    plan_name == 'large'
  ) {
    return {
      plan_name: 'large',
      monitor_limit: 150,
      total_credits: 4000000,
    };
  }

  if (
    id == 'price_1I8oAuCCVqelePsAdKXePG4E' ||
    id == 'price_1I8oAcCCVqelePsA2bl6RD7L' ||
    plan_name == 'medium'
  ) {
    return {
      plan_name: 'medium',
      monitor_limit: 100,
      total_credits: 2000000,
    };
  }

  if (
    id == 'price_1I8oAhCCVqelePsAdXvIZ6tW' ||
    id == 'price_1I8oAyCCVqelePsARdxeyLkP' ||
    plan_name == 'small'
  ) {
    return {
      plan_name: 'small',
      monitor_limit: 50,
      total_credits: 1000000,
    };
  }

  throw new Error('Price ID not recognized.');
};

export {
  hasPermission,
  isAdmin,
  isSubscribedByUserId,
  getPlanInfoByPriceIdOrName,
};
