import type { RouteHandler, RouteOptions } from 'fastify';
import { getAllSalaries } from '../models/salary';

const getSalaryHandler: RouteHandler = (_, reply) => {
	const queryResult = getAllSalaries();
	reply.send(queryResult);
};

export const getSalaryRoute: RouteOptions = {
	method: 'GET',
	url: '/salary',
	schema: {
		description: 'API endpoint to get all salary records',
		summary: 'Get all salary records',
		headers: {
			type: 'object',
			additionalProperties: true,
			properties: {
				authorization: { type: 'string' },
			},
			required: ['authorization'],
		},
		response: {
			200: {
				type: 'array',
				additionalProperties: false,
				additionalItems: false,
				items: {
					type: 'object',
					properties: {
						id: { type: 'number', minimum: 0 },
						name: { type: 'string' },
						salary: { type: 'number', minimum: 0 },
						currency: { type: 'string' },
						on_contract: { type: 'boolean' },
						department: { type: 'string' },
						sub_department: { type: 'string' },
					},
				},
			},
		},
	},
	handler: getSalaryHandler,
};
