import traps from '@dnlup/fastify-traps';
import auth from '@fastify/auth';
import type { FastifyAuthFunction } from '@fastify/auth';
import bearerAuthPlugin from '@fastify/bearer-auth';
import type { verifyBearerAuth } from '@fastify/bearer-auth';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Ajv from 'ajv';
import Fastify from 'fastify';
import type { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteGenericInterface, RouteOptions } from 'fastify';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import AuthKeys from './authx/keys';
import pkg from './package.json';
import { getAPIKeyRoute } from './routes/auth.route';
import { deleteSalaryRoute } from './routes/delete-salary.route';
import { getSalaryByDepartmentAndSubDepartmentRoute } from './routes/get-salary-by-department-and-sub-department.route';
import { getSalaryByDepartmentRoute } from './routes/get-salary-by-department.route';
import { getSalaryStatsRoute } from './routes/get-salary-stats.route';
import { getSalaryRoute } from './routes/get-salary.route';
import { putSalaryRoute } from './routes/put-salary.route';

const PORT = parseInt(process.env['PORT'] || '8080', 10);
const API_KEYS = new Set(AuthKeys.values());

/**
 * Attach authx handlers to a given route. This method intelligently
 * checks the given route, and if it alreadt has pre-handlers, it preserves
 * them will appending the authx handlers to them.
 * @param route Fastify route.
 * @param allowAnonymous @default false (Optional) If anonymous access should be allowed – use this for unprotected routes only.
 * @returns
 */
const attachAuthHandler = <T extends RouteGenericInterface>(
	route: RouteOptions<Server, IncomingMessage, ServerResponse, T>,
	allowAnonymous: boolean = false,
): RouteOptions<Server, IncomingMessage, ServerResponse, T> => {
	const existingPreHandlers: Array<preHandlerHookHandler<Server, IncomingMessage, ServerResponse, T>> =
		Array.isArray(route.preHandler)
			? route.preHandler
			: [route.preHandler].filter(Boolean) as Array<preHandlerHookHandler<Server, IncomingMessage, ServerResponse, T>>;
	const authFunctions: Array<FastifyAuthFunction> = [
		allowAnonymous ? server.allowAnonymous : undefined,
		server.verifyBearerAuth as verifyBearerAuth,
	]
		.filter(Boolean) as Array<FastifyAuthFunction>;
	const authPreHandlers = server.auth(authFunctions);
	const finalPreHandlers = existingPreHandlers.concat(authPreHandlers);
	return {
		...route,
		preHandler: finalPreHandlers,
	};
};

const ajv = new Ajv({
	// NOTE: We use the default Fastify + AJV options, except set the `removeAdditional` option to `true`
	// to remove all unknown properties and ensure our input validation is stricter by default.
	// REFER: https://www.fastify.io/docs/latest/Reference/Validation-and-Serialization/#validator-compiler
	coerceTypes: true,
	useDefaults: true,
	removeAdditional: true,
	strict: true,
	strictSchema: true,
	allErrors: true,
});

const server = Fastify({
	logger: {
		formatters: {
			level(level) {
				return { level };
			},
		},
		base: undefined,
		level: process.env.LOG_LEVEL || 'info',
	},
});

server.setValidatorCompiler(({ schema }) => {
	return ajv.compile(schema);
});

const app = async (): Promise<void> => {
	await server
		.register(auth)
		.register(bearerAuthPlugin, { addHook: false, keys: API_KEYS, verifyErrorLogLevel: 'debug' });
	server.decorate('allowAnonymous', (_: FastifyRequest, __: FastifyReply, done: Function) => {
		return done();
	});

	await server.register(swagger, {
		swagger: {
			info: {
				title: 'Sqlary – Salary API',
				description: 'Salary API endpoints from the Sqlary service',
				version: pkg.version,
				contact: pkg.author,
			},
			host: `localhost:${PORT}`,
			schemes: ['http'],
			consumes: ['application/json'],
			produces: ['application/json'],
		},
	});

	await server.register(swaggerUi, {
		routePrefix: '/docs',
		uiConfig: {
			docExpansion: 'list',
			deepLinking: true,
			maxDisplayedTags: 0,
			tryItOutEnabled: true,
			syntaxHighlight: {
				theme: 'monokai',
			},
		},
		staticCSP: true,
	});

	await server.register(traps);

	server.route(attachAuthHandler(getAPIKeyRoute, true));
	server.route(attachAuthHandler(getSalaryRoute));
	server.route(attachAuthHandler(putSalaryRoute));
	server.route(attachAuthHandler(deleteSalaryRoute));
	server.route(attachAuthHandler(getSalaryStatsRoute));
	server.route(attachAuthHandler(getSalaryByDepartmentRoute));
	server.route(attachAuthHandler(getSalaryByDepartmentAndSubDepartmentRoute));

	server.listen({ host: '0.0.0.0', port: PORT }, (err, address) => {
		if (err) {
			server.log.error(err);
			process.exit(1);
		}
		server.log.info(`Server listening at ${address}`);
	});

	await server.ready();
	server.swagger();
};

// NOTE: Spin up the server only when this file is run, and not when imported.
if (require.main === module) {
	(async () => {
		await app();
	})();
}

export { server };
