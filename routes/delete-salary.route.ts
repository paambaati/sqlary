import type { RouteGenericInterface, RouteHandler, RouteOptions } from 'fastify';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { removeSalary } from '../models/salary';

interface DeleteSalaryPayload {
	id: number;
}

interface DeleteSalaryRoute extends RouteGenericInterface {
	Params: DeleteSalaryPayload;
}

const deleteSalaryHandler: RouteHandler<DeleteSalaryRoute> = (request, reply) => {
	const rowId = request.params.id;
	const queryResult = removeSalary(rowId);
	reply.code(queryResult ? 200 : 410).send({
		id: rowId,
		deleted: queryResult,
	});
};

export const deleteSalaryRoute: RouteOptions<Server, IncomingMessage, ServerResponse, DeleteSalaryRoute> = {
	method: 'DELETE',
	url: '/salary/:id',
	schema: {
		description:
			'API endpoint to delete a salary record. The "id" parameter comes from the get salaries API – see [`GET /salary`](#/default/get_salary)',
		summary: 'Delete a salary record',
		headers: {
			type: 'object',
			additionalProperties: true,
			properties: {
				authorization: { type: 'string' },
			},
			required: ['authorization'],
		},
		params: {
			type: 'object',
			additionalProperties: false,
			properties: {
				id: { type: 'number' },
			},
			required: ['id'],
		},
		response: {
			200: {
				type: 'object',
				additionalProperties: false,
				properties: {
					id: { type: 'number' },
					deleted: { type: 'boolean' },
				},
			},
			410: {
				type: 'object',
				additionalProperties: false,
				properties: {
					id: { type: 'number' },
					deleted: { type: 'boolean' },
				},
			},
		},
	},
	handler: deleteSalaryHandler,
};
