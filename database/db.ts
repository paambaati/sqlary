/* istanbul ignore file */

import DB from 'better-sqlite3-helper';
import { join as joinPath, resolve as resolvePath } from 'node:path';

const projectRoot = resolvePath(__filename, '../../');
const dataPath = joinPath(projectRoot, '/data');
const migrationsPath = joinPath(projectRoot, '/migrations');
const dbFile = process.env.DB_FILE_NAME || 'salary-sqlite.db';
const forceMode = process.env.DB_FORCE_MODE as 'last' || false;

export default DB({
	path: joinPath(dataPath, '/', dbFile),
	readonly: false,
	fileMustExist: false,
	WAL: true,
	migrate: {
		force: forceMode,
		table: 'migrations',
		migrationsPath,
	},
});
