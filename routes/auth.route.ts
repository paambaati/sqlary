import type { RouteGenericInterface, RouteHandler, RouteOptions } from 'fastify';
import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import AuthKeys from '../authx/keys';
import Users from '../authx/users';

interface APIKeyPayload {
	username: string;
	password: string;
}

interface APIKeyRoute extends RouteGenericInterface {
	Body: APIKeyPayload;
}

const getApiKeyHandler: RouteHandler<APIKeyRoute> = (request, reply) => {
	const payload = request.body;
	const { username, password } = payload;
	if (Users.has(username) && timingSafeEqual(Buffer.from(Users.get(username) || ''), Buffer.from(password))) {
		if (AuthKeys.has(username)) {
			return reply.code(200).send({
				username,
				apiKey: AuthKeys.get(username),
			});
		}
		return reply.code(404).send({
			username,
			error: 'No API key found for user; please generate one before proceeding!',
		});
	}
	return reply.code(401).send({
		username,
		error: 'Credentials provided were incorrect; please try again!',
	});
};

export const getAPIKeyRoute: RouteOptions<Server, IncomingMessage, ServerResponse, APIKeyRoute> = {
	method: 'POST',
	url: '/api-key',
	schema: {
		description:
			'API endpoint to get an API token for given user credentials; see `authx/users.ts` for a list of available user credentials',
		summary: 'Get API token',
		body: {
			type: 'object',
			additionalProperties: false,
			properties: {
				username: { type: 'string' },
				password: { type: 'string' },
			},
			required: [
				'username',
				'password',
			],
		},
		response: {
			200: {
				type: 'object',
				additionalProperties: false,
				properties: {
					username: { type: 'string' },
					apiKey: { type: 'string' },
				},
			},
			401: {
				type: 'object',
				additionalProperties: false,
				properties: {
					username: { type: 'string' },
					error: { type: 'string' },
				},
			},
			404: {
				type: 'object',
				additionalProperties: false,
				properties: {
					username: { type: 'string' },
					error: { type: 'string' },
				},
			},
		},
	},
	handler: getApiKeyHandler,
};
