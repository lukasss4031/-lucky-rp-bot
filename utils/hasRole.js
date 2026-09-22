function hasAnyRole(member, roleIdOrIds) {
  const ids = Array.isArray(roleIdOrIds) ? roleIdOrIds : [roleIdOrIds];
  return ids.some((id) => member.roles.cache.has(id));
}

module.exports = { hasAnyRole };
