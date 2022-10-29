/* istanbul ignore file */

// TODO: Refactor later to use credentials directly from a secure store or a database.

export const Users = new Map<string, string>();

// NOTE: Username and password are hardcoded for now in plaintext.
// WARNING: This is just sample code and SHOULD NOT be used in production.
Users.set('admin', 'hunter2');
Users.set('keyless-user', 'dogatemykeys');

export default Users;
