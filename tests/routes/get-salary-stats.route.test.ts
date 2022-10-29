import importFresh from 'import-fresh';
import { array, number } from 'minifaker';
import { createSandbox } from 'sinon';
import tap from 'tap';
import 'minifaker/locales/en';
import type { FastifyInstance } from 'fastify';
import DBInstance from '../../database/db';
import { getSalaryStatsRoute } from '../../routes/get-salary-stats.route';
import { getRandomCurrency } from '../helpers/random-currency';

const getFreshServer = (): FastifyInstance => importFresh<{ server: FastifyInstance; }>('../../index').server;

tap.test('routes > get-salary-stats.route > getSalaryStatsRoute should return salary statistics for all salary records', async (t) => {
	t.plan(3);

	const server = getFreshServer();
	const sandbox = createSandbox();
	t.teardown(() => {
		sandbox.restore();
		server.close();
	});

	const mockSalaryStatsData = array(number({ min: 1, max: 1, float: false }), () => {
		return {
			avg: number({ float: true }),
			min: number({ float: false }),
			max: number({ float: false }),
		};
	});

	const querySpy = sandbox.stub(DBInstance, 'query').returns(mockSalaryStatsData);

	server.route(getSalaryStatsRoute);
	// NOTE: This is key for the inject to work!
	await server.ready();

	try {
		const response = await server.inject({
			method: 'GET',
			url: `/salary/stats`,
			headers: {
				authorization: 'Bearer xyz',
			},
		});
		t.same(
			querySpy.getCall(0).lastArg,
			'SELECT AVG(salary) AS avg, MAX(salary) AS max, MIN(salary) AS min FROM salaries',
			'delete method should have been called with exact input',
		);
		t.equal(response.statusCode, 200, 'should return a 200 response');
		t.same(response.json(), mockSalaryStatsData[0], 'should return the salary statistics');
	} catch (err) {
		t.fail('should not have thrown an error');
	}

	t.end();
});

tap.test('routes > get-salary-stats.route > getSalaryStatsRoute should return salary statistics for filtered salary records', async (t) => {
	t.plan(4);

	const server = getFreshServer();
	const sandbox = createSandbox();
	t.teardown(() => {
		sandbox.restore();
		server.close();
	});

	const mockSalaryStatsData = array(number({ min: 1, max: 1, float: false }), () => {
		return {
			avg: number({ float: true }),
			min: number({ float: false }),
			max: number({ float: false }),
		};
	});

	const mockPreparedStatement = {
		all: (_: unknown) => mockSalaryStatsData,
	};

	const prepareSpy = sandbox.stub(DBInstance, 'prepare').returns(mockPreparedStatement);
	const executeSpy = sandbox.spy(mockPreparedStatement, 'all');

	server.route(getSalaryStatsRoute);
	await server.ready();

	const input = {
		currency: getRandomCurrency().toLowerCase(),
	};

	try {
		const response = await server.inject({
			method: 'GET',
			url: `/salary/stats`,
			query: input,
			headers: {
				authorization: 'Bearer xyz',
			},
		});
		t.ok(
			prepareSpy.calledWithExactly(
				'SELECT AVG(salary) AS avg, MAX(salary) AS max, MIN(salary) AS min FROM salaries WHERE currency=@currency',
			),
			'prepare statement command should be called with correct SELECT query with correct WHERE clause',
		);
		t.same(
			executeSpy.getCall(0).lastArg,
			{ currency: input.currency.toUpperCase() },
			'prepared statement should be executed with the filters correctly applied',
		);
		t.equal(response.statusCode, 200, 'should return a 200 response');
		t.same(
			response.json(),
			mockSalaryStatsData[0],
			'should return the salary statistics',
		);
	} catch (err) {
		t.fail('should not have thrown an error');
	}

	t.end();
});
