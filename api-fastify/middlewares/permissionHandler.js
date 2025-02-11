// middlewares/permissionHandler.js
const ADMIN_ROLES = [1, 2];

function checkPermission(requestingUserId, targetUserId, userRole, reply) {
  const isSelf = parseInt(requestingUserId) === parseInt(targetUserId);
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const canAct = isSelf || isAdmin;

  if (!canAct) {
    return reply.status(403).send({
      error: "Vous n'avez pas les permissions nécessaires pour effectuer cette action."
    });
  }

  return { isSelf, isAdmin, canAct };
}

module.exports = {
  checkPermission,
  ADMIN_ROLES
};