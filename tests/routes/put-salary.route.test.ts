import importFresh from 'import-fresh';
import { boolean, name, number, word } from 'minifaker';
import { createSandbox } from 'sinon';
import tap from 'tap';
import 'minifaker/locales/en';
import type { FastifyInstance } from 'fastify';
import DBInstance from '../../database/db';
import { putSalaryRoute } from '../../routes/put-salary.route';
import { getRandomCurrency } from '../helpers/random-currency';

const getFreshServer = (): FastifyInstance => importFresh<{ server: FastifyInstance; }>('../../index').server;

tap.test(
	'routes > put-salary.route > putSalaryRoute should return a 201 response when insert was successful',
	async (t) => {
		t.plan(3);

		const server = getFreshServer();
		const sandbox = createSandbox();
		t.teardown(() => {
			sandbox.restore();
			server.close();
		});

		const mockRowId = number({ float: false });
		const mockSalaryInput = {
			name: name(),
			salary: number({ min: 100000, max: 500000, float: false }),
			currency: getRandomCurrency().toLowerCase(),
			on_contract: boolean(),
			department: word(),
			sub_department: word(),
		};

		const insertSpy = sandbox.stub(DBInstance, 'insert').returns(mockRowId);

		server.route(putSalaryRoute);
		// NOTE: This is key for the inject to work!
		await server.ready();

		try {
			const response = await server.inject({
				method: 'PUT',
				url: `/salary`,
				headers: {
					authorization: 'Bearer xyz',
				},
				payload: mockSalaryInput,
			});

			t.ok(
				insertSpy.calledOnceWithExactly('salaries', {
					...mockSalaryInput,
					on_contract: mockSalaryInput.on_contract ? 1 : 0,
					currency: mockSalaryInput.currency.toUpperCase(),
				}),
				'insert command should be called with correct payload',
			);
			t.equal(response.statusCode, 201, 'should return a 201 response');

			t.same(
				response.json(),
				{
					...mockSalaryInput,
					currency: mockSalaryInput.currency.toUpperCase(),
					id: mockRowId,
				},
				'should return the salary data along with row id',
			);
		} catch (err) {
			t.fail('should not have thrown an error');
		}

		t.end();
	},
);
