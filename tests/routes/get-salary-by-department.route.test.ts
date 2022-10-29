import importFresh from 'import-fresh';
import { array, number, word } from 'minifaker';
import { createSandbox } from 'sinon';
import tap from 'tap';
import 'minifaker/locales/en';
import type { FastifyInstance } from 'fastify';
import DBInstance from '../../database/db';
import { getSalaryByDepartmentRoute } from '../../routes/get-salary-by-department.route';
import { getRandomCurrency } from '../helpers/random-currency';

const getFreshServer = (): FastifyInstance => importFresh<{ server: FastifyInstance; }>('../../index').server;

tap.test('routes > get-salary-by-department.route > getSalaryByDepartmentRoute should return salary statistics grouped by department', async (t) => {
	t.plan(3);

	const server = getFreshServer();
	const sandbox = createSandbox();
	t.teardown(() => {
		sandbox.restore();
		server.close();
	});

	const mockSalaryStatsData = array(number({ min: 10, max: 100, float: false }), () => {
		return {
			department: word(),
			avg: number({ float: true }),
			min: number({ float: false }),
			max: number({ float: false }),
		};
	});
	const querySpy = sandbox.stub(DBInstance, 'query').returns(mockSalaryStatsData);

	server.route(getSalaryByDepartmentRoute);
	// NOTE: This is key for the inject to work!
	await server.ready();

	try {
		const response = await server.inject({
			method: 'GET',
			url: `/salary/stats/department`,
			headers: {
				authorization: 'Bearer xyz',
			},
		});
		t.same(
			querySpy.getCall(0).lastArg,
			'SELECT department, AVG(salary) AS avg, MAX(salary) AS max, MIN(salary) AS min FROM salaries GROUP BY department',
			'select method should have been called with correct SELECT query and GROUP BY clause',
		);
		t.equal(response.statusCode, 200, 'should return a 200 response');
		t.same(
			response.json(),
			mockSalaryStatsData,
			'should return the salary statistics grouped by department',
		);
	} catch (err) {
		t.fail('should not have thrown an error');
	}

	t.end();
});

tap.test(
	'routes > get-salary-by-department.route > getSalaryByDepartmentRoute should return salary statistics grouped by department including normalized filters',
	async (t) => {
		t.plan(4);

		const server = getFreshServer();
		const sandbox = createSandbox();
		t.teardown(() => {
			sandbox.restore();
			server.close();
		});

		const mockSalaryStatsData = array(number({ min: 10, max: 100, float: false }), () => {
			return {
				department: word(),
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

		server.route(getSalaryByDepartmentRoute);
		await server.ready();

		const input = {
			currency: getRandomCurrency().toLowerCase(),
		};

		try {
			const response = await server.inject({
				method: 'GET',
				url: `/salary/stats/department`,
				query: input,
				headers: {
					authorization: 'Bearer xyz',
				},
			});
			t.ok(
				prepareSpy.calledWithExactly(
					'SELECT department, AVG(salary) AS avg, MAX(salary) AS max, MIN(salary) AS min FROM salaries WHERE currency=@currency GROUP BY department',
				),
				'prepare statement command should be called with correct SELECT query with correct WHERE clause and GROUP BY clause',
			);
			t.same(
				executeSpy.getCall(0).lastArg,
				{ currency: input.currency.toUpperCase() },
				'prepared statement should be executed with the filters correctly applied',
			);
			t.equal(response.statusCode, 200, 'should return a 200 response');
			t.same(
				response.json(),
				mockSalaryStatsData,
				'should return the salary statistics grouped by department',
			);
		} catch (err) {
			t.fail('should not have thrown an error');
		}

		t.end();
	},
);
