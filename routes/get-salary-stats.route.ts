import type { RouteGenericInterface, RouteHandler, RouteOptions } from 'fastify';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { getStatsForSalaries } from '../models/salary';

export interface GetSalaryStatsRoute extends RouteGenericInterface {
	Querystring: { currency?: string; on_contract?: boolean; };
}

const getSalaryStatsHandler: RouteHandler<GetSalaryStatsRoute> = (request, reply) => {
	const { currency, on_contract } = request.query;
	const queryResult = getStatsForSalaries({ currency: currency?.toUpperCase(), onContract: on_contract });
	reply.send(queryResult);
};

export const getSalaryStatsRoute: RouteOptions<Server, IncomingMessage, ServerResponse, GetSalaryStatsRoute> = {
	method: 'GET',
	url: '/salary/stats',
	schema: {
		description:
			'API endpoint to get all salary statistics; can be optionally filtered by `currency` and `on_contract`',
		summary: 'Get salary statistics',
		headers: {
			type: 'object',
			additionalProperties: true,
			properties: {
				authorization: { type: 'string' },
			},
			required: ['authorization'],
		},
		querystring: {
			type: 'object',
			additionalProperties: false,
			properties: {
				currency: { type: 'string' },
				on_contract: { type: 'boolean' },
			},
		},
		response: {
			200: {
				type: 'object',
				additionalProperties: false,
				properties: {
					avg: { type: 'number', minimum: 0 },
					max: { type: 'number', minum: 0 },
					min: { type: 'number', minimum: 0 },
				},
			},
		},
	},
	handler: getSalaryStatsHandler,
};
