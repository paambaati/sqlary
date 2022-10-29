import type { FastifyAuthFunction } from '@fastify/auth';
import fastify from 'fastify';

declare module 'fastify' {
	export interface FastifyInstance<
		HttpServer = Server,
		HttpRequest = IncomingMessage,
		HttpResponse = ServerResponse,
	> {
		/** Decorator plugin that allows anonymous access to a route. */
		allowAnonymous: FastifyAuthFunction;
	}
}
