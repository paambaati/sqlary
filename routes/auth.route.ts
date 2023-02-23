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

	const return401 = () =>
		reply.code(401).send({
			username,
			error: 'Credentials provided were incorrect; please try again!',
		});

	const return404 = () =>
		reply.code(404).send({
			username,
			error: 'No API key found for user; please generate one before proceeding!',
		});

	if (Users.has(username)) {
		const lookedUpPassword = Users.get(username) as string;
		let passwordMatched = false;
		try {
			passwordMatched = timingSafeEqual(Buffer.from(lookedUpPassword), Buffer.from(password));
		} catch (err) {
			// NOTE: When password lengths do not match, `timingSafeEqual()` throws a `RangeError`,
			// as it expects both buffers to be of the same length. If we happen to catch any other
			// error, we log it just in case.
			/* istanbul ignore next */
			if (err instanceof Error && err.name !== 'RangeError') {
				request.log.warn(err, 'Timing-safe password equality check failed!');
			}
		}
		if (passwordMatched) {
			if (AuthKeys.has(username)) {
				return reply.code(200).send({
					username,
					apiKey: AuthKeys.get(username),
				});
			} else {
				return return404();
			}
		} else {
			return return401();
		}
	}
	return return401();
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
