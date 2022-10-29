import type { RouteHandler, RouteOptions } from 'fastify';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { getStatsForSalariesByDepartmentAndSubDepartment } from '../models/salary';
import type { GetSalaryStatsRoute } from './get-salary-stats.route';

const getSalaryByDepartmentAndSubDepartmentHandler: RouteHandler<GetSalaryStatsRoute> = (request, reply) => {
	const { currency, on_contract } = request.query;
	const queryResult = getStatsForSalariesByDepartmentAndSubDepartment({
		currency: currency?.toUpperCase(),
		onContract: on_contract,
	});
	reply.send(queryResult);
};

export const getSalaryByDepartmentAndSubDepartmentRoute: RouteOptions<
	Server,
	IncomingMessage,
	ServerResponse,
	GetSalaryStatsRoute
> = {
	method: 'GET',
	url: '/salary/stats/department/sub-department',
	schema: {
		description:
			'API endpoint to get all salary statistics grouped by departments and sub-departments; can be optionally filtered by `currency` and `on_contract`',
		summary: 'Get salary statistics per department and sub-department',
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
				type: 'array',
				additionalProperties: false,
				additionalItems: false,
				items: {
					type: 'object',
					properties: {
						department: { type: 'string' },
						sub_department: { type: 'string' },
						avg: { type: 'number', minimum: 0 },
						max: { type: 'number', minimum: 0 },
						min: { type: 'number', minimum: 0 },
					},
				},
			},
		},
	},
	handler: getSalaryByDepartmentAndSubDepartmentHandler,
};
