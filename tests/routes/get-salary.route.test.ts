import importFresh from 'import-fresh';
import { array, name, number, word } from 'minifaker';
import { createSandbox } from 'sinon';
import tap from 'tap';
import 'minifaker/locales/en';
import type { FastifyInstance } from 'fastify';
import DBInstance from '../../database/db';
import { getSalaryRoute } from '../../routes/get-salary.route';
import { getRandomCurrency } from '../helpers/random-currency';

const getFreshServer = (): FastifyInstance => importFresh<{ server: FastifyInstance; }>('../../index').server;

tap.test(
	'routes > delete-salary.route > deleteSalaryRoute should return a 200 response when delete was successful',
	async (t) => {
		t.plan(3);

		const server = getFreshServer();
		const sandbox = createSandbox();
		t.teardown(() => {
			sandbox.restore();
			server.close();
		});

		const mockSalaryData = array(number({ min: 10, max: 100, float: false }), (index) => {
			return {
				id: index,
				name: name(),
				salary: number({ min: 100000, max: 500000, float: false }),
				currency: getRandomCurrency(),
				on_contract: number({ min: 0, max: 1, float: false }),
				department: word(),
				sub_department: word(),
			};
		});

		const querySpy = sandbox.stub(DBInstance, 'query').returns(mockSalaryData);

		server.route(getSalaryRoute);
		// NOTE: This is key for the inject to work!
		await server.ready();

		try {
			const response = await server.inject({
				method: 'GET',
				url: `/salary`,
				headers: {
					authorization: 'Bearer xyz',
				},
			});
			t.ok(
				querySpy.calledOnceWithExactly('SELECT ROWID as id, * FROM salaries'),
				'query command should be called with correct SELECT query',
			);
			t.equal(response.statusCode, 200, 'should return a 200 response');

			t.same(
				response.json(),
				mockSalaryData.map((s) => {
					return {
						...s,
						on_contract: Boolean(s.on_contract),
					};
				}),
				'should return the salary data along with row id',
			);
		} catch (err) {
			t.fail('should not have thrown an error');
		}

		t.end();
	},
);
