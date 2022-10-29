import importFresh from 'import-fresh';
import { array, number, word } from 'minifaker';
import { createSandbox } from 'sinon';
import tap from 'tap';
import 'minifaker/locales/en';
import type { FastifyInstance } from 'fastify';
import DBInstance from '../../database/db';
import { getSalaryByDepartmentAndSubDepartmentRoute } from '../../routes/get-salary-by-department-and-sub-department.route';
import { getRandomCurrency } from '../helpers/random-currency';

const getFreshServer = (): FastifyInstance => importFresh<{ server: FastifyInstance; }>('../../index').server;

tap.test('routes > get-salary-by-department-and-sub-department.route > getSalaryByDepartmentAndSubDepartmentRoute should return salary statistics grouped by department and sub-department', async (t) => {
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
			sub_department: word(),
			avg: number({ float: true }),
			min: number({ float: false }),
			max: number({ float: false }),
		};
	});
	const querySpy = sandbox.stub(DBInstance, 'query').returns(mockSalaryStatsData);

	server.route(getSalaryByDepartmentAndSubDepartmentRoute);
	// NOTE: This is key for the inject to work!
	await server.ready();

	try {
		const response = await server.inject({
			method: 'GET',
			url: `/salary/stats/department/sub-department`,
			headers: {
				authorization: 'Bearer xyz',
			},
		});
		t.same(
			querySpy.getCall(0).lastArg,
			'SELECT department, sub_department, AVG(salary) AS avg, MAX(salary) AS max, MIN(salary) AS min FROM salaries GROUP BY department, sub_department',
			'select method should have been called with correct SELECT query and GROUP BY clauses',
		);
		t.equal(response.statusCode, 200, 'should return a 200 response');
		t.same(
			response.json(),
			mockSalaryStatsData,
			'should return the salary statistics grouped by department and sub-department',
		);
	} catch (err) {
		t.fail('should not have thrown an error');
	}

	t.end();
});

tap.test(
	'routes > get-salary-by-department-and-sub-department.route > getSalaryByDepartmentAndSubDepartmentRoute should return salary statistics grouped by department and sub-department including normalized filters',
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
				sub_department: word(),
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

		server.route(getSalaryByDepartmentAndSubDepartmentRoute);
		await server.ready();

		const input = {
			currency: getRandomCurrency().toLowerCase(),
		};

		try {
			const response = await server.inject({
				method: 'GET',
				url: `/salary/stats/department/sub-department`,
				query: input,
				headers: {
					authorization: 'Bearer xyz',
				},
			});
			t.ok(
				prepareSpy.calledWithExactly(
					'SELECT department, sub_department, AVG(salary) AS avg, MAX(salary) AS max, MIN(salary) AS min FROM salaries WHERE currency=@currency GROUP BY department, sub_department',
				),
				'prepare statement command should be called with correct SELECT query with correct WHERE clause and GROUP BY clauses',
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
				'should return the salary statistics grouped by department and sub-department',
			);
		} catch (err) {
			t.fail('should not have thrown an error');
		}

		t.end();
	},
);
