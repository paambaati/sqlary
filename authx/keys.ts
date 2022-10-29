/* istanbul ignore file */

// TODO: Refactor later to use credentials directly from a secure store or a database.

export const AuthKeys = new Map<string, string>();

// NOTE: Username and API key are hardcoded for now in plaintext.
// WARNING: This is just sample code and SHOULD NOT be used in production.
// NOTE: Generated with `node -e 'const crypto=require("crypto"); console.log(crypto.randomUUID());'`
AuthKeys.set('admin', 'c2e14a54-ab10-49fd-b90d-2e7c75de89e3');

export default AuthKeys;
