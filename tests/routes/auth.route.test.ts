import importFresh from 'import-fresh';
import { word } from 'minifaker';
import tap from 'tap';
import 'minifaker/locales/en';
import type { FastifyInstance } from 'fastify';
import AuthKeys from '../../authx/keys';
import Users from '../../authx/users';
import { getAPIKeyRoute } from '../../routes/auth.route';

const getFreshServer = (): FastifyInstance => importFresh<{ server: FastifyInstance; }>('../../index').server;

tap.test('routes > auth.route > getAPIKeyRoute should return API keys for a valid set of user credentials', async (t) => {
	t.plan(2);

	const server = getFreshServer();
	t.teardown(() => {
		server.close();
	});

	server.route(getAPIKeyRoute);
	// NOTE: This is key for the inject to work!
	await server.ready();

	const inputs = {
		username: Array.from(Users.keys())[0],
		password: Array.from(Users.values())[0],
	};
	try {
		const response = await server.inject({
			method: 'POST',
			url: '/api-key',
			payload: inputs,
		});
		t.equal(response.statusCode, 200, 'should return a 200 response');
		t.same(response.json(), {
			username: inputs.username,
			apiKey: AuthKeys.get(inputs.username),
		}, 'should return the username and the API key');
	} catch (err) {
		t.fail('should not have thrown an error');
	}

	t.end();
});

tap.test('routes > auth.route > getAPIKeyRoute should return an error for a valid set of user credentials that does not have a key configured', async (t) => {
	t.plan(2);

	const server = getFreshServer();
	t.teardown(() => {
		server.close();
	});

	server.route(getAPIKeyRoute);
	await server.ready();

	const inputs = {
		username: 'keyless-user',
		password: 'dogatemykeys',
	};
	try {
		const response = await server.inject({
			method: 'POST',
			url: '/api-key',
			payload: inputs,
		});
		t.equal(response.statusCode, 404, 'should return a 404 response');
		t.same(response.json(), {
			username: inputs.username,
			error: 'No API key found for user; please generate one before proceeding!',
		}, 'should return an appropriate error response');
	} catch (err) {
		t.fail('should not have thrown an error');
	}

	t.end();
});

tap.test('routes > auth.route > getAPIKeyRoute should return an error for an invalid set of user credentials', async (t) => {
	t.plan(2);

	const server = getFreshServer();
	t.teardown(() => {
		server.close();
	});

	server.route(getAPIKeyRoute);
	await server.ready();

	const inputs = {
		username: word(),
		password: word(),
	};
	try {
		const response = await server.inject({
			method: 'POST',
			url: '/api-key',
			payload: inputs,
		});
		t.equal(response.statusCode, 401, 'should return a 401 response');
		t.same(response.json(), {
			username: inputs.username,
			error: 'Credentials provided were incorrect; please try again!',
		}, 'should return an appropriate error response');
	} catch (err) {
		t.fail('should not have thrown an error');
	}

	t.end();
});
