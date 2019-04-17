function hasPermission(user, permissionsNeeded) {
  const matchedPermissions = user.permissions.filter(permissionTheyHave =>
    permissionsNeeded.includes(permissionTheyHave),
  );
  if (!matchedPermissions.length) {
    throw new Error(`You do not have sufficient permissions

      : ${permissionsNeeded}

      You Have:

      ${user.permissions}
      `);
  }
}

function isSubscribed(user) {
  var today = new Date();
  var period_ends = parseInt(user.period_ends);
  if (today >= period_ends) {
    throw new Error(`It looks like your subscription has expired!`);
  } else {
    return true;
  }
}

exports.hasPermission = hasPermission;
exports.isSubscribed = isSubscribed;
