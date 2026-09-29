export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES: 'sales',
};

/**
 * Check if the given user has one of the allowed roles
 *
 * @param {Object} user - User object with .role
 * @param {string[]} allowedRoles - Array of permitted roles
 * @returns {boolean}
 */
export const hasRole = (user, allowedRoles = []) => {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
};

export const isAdmin = (user) => hasRole(user, [ROLES.ADMIN]);
export const isManager = (user) => hasRole(user, [ROLES.MANAGER]);
export const isSales = (user) => hasRole(user, [ROLES.SALES]);
export const canManageOrg = (user) => hasRole(user, [ROLES.ADMIN]);
export const canViewTeamLeads = (user) => hasRole(user, [ROLES.ADMIN, ROLES.MANAGER]);
export const canViewAssignedLeads = (user) => hasRole(user, [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES]);
