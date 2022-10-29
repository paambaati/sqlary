import importFresh from 'import-fresh';
import { number } from 'minifaker';
import { createSandbox } from 'sinon';
import tap from 'tap';
import 'minifaker/locales/en';
import type { FastifyInstance } from 'fastify';
import DBInstance from '../../database/db';
import { deleteSalaryRoute } from '../../routes/delete-salary.route';

const getFreshServer = (): FastifyInstance => importFresh<{ server: FastifyInstance; }>('../../index').server;

tap.test('routes > delete-salary.route > deleteSalaryRoute should return a 200 response when delete was successful', async (t) => {
	t.plan(3);

	const server = getFreshServer();
	const sandbox = createSandbox();
	t.teardown(() => {
		sandbox.restore();
		server.close();
	});

	const deleteSpy = sandbox.stub(DBInstance, 'delete').returns(1);

	server.route(deleteSalaryRoute);
	// NOTE: This is key for the inject to work!
	await server.ready();

	const input = number({ min: 100, max: 999, float: false });
	try {
		const response = await server.inject({
			method: 'DELETE',
			url: `/salary/${input}`,
			headers: {
				authorization: 'Bearer xyz',
			},
		});
		t.same(
			deleteSpy.getCall(0).args,
			['salaries', { rowid: input }],
			'delete method should have been called with exact input',
		);
		t.equal(response.statusCode, 200, 'should return a 200 response');
		t.same(response.json(), {
			id: input,
			deleted: true,
		}, 'should return the id and the deleted status');
	} catch (err) {
		t.fail('should not have thrown an error');
	}

	t.end();
});

tap.test('routes > delete-salary.route > deleteSalaryRoute should return a 410 response when delete was unsuccessful', async (t) => {
	t.plan(3);

	const server = getFreshServer();
	const sandbox = createSandbox();
	t.teardown(() => {
		sandbox.restore();
		server.close();
	});

	const deleteSpy = sandbox.stub(DBInstance, 'delete').returns(0);

	server.route(deleteSalaryRoute);
	await server.ready();

	const input = number({ min: 100, max: 999, float: false });
	try {
		const response = await server.inject({
			method: 'DELETE',
			url: `/salary/${input}`,
			headers: {
				authorization: 'Bearer xyz',
			},
		});
		t.same(
			deleteSpy.getCall(0).args,
			['salaries', { rowid: input }],
			'delete method should have been called with exact input',
		);
		t.equal(response.statusCode, 410, 'should return a 410 response');
		t.same(response.json(), {
			id: input,
			deleted: false,
		}, 'should return the id and the deleted status');
	} catch (err) {
		t.fail('should not have thrown an error');
	}

	t.end();
});
