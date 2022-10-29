import DB from '../../database/db';
// NOTE: warms up the DB so the initial migrations are run beore the tests start.
// The query itself is a no-op.
DB.run('SELECT 1');
