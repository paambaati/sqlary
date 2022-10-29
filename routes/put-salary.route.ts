import type { RouteGenericInterface, RouteHandler, RouteOptions } from 'fastify';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { addSalary } from '../models/salary';

interface AddSalaryPayload {
	name: string;
	salary: number;
	currency: string;
	on_contract?: boolean;
	department: string;
	sub_department: string;
}

interface PutSalaryRoute extends RouteGenericInterface {
	Body: AddSalaryPayload;
}

const addSalaryHandler: RouteHandler<PutSalaryRoute> = (request, reply) => {
	const payload = request.body;
	const queryResult = addSalary({
		name: payload.name,
		salary: payload.salary,
		currency: payload.currency.toUpperCase(),
		on_contract: Boolean(payload.on_contract),
		department: payload.department,
		sub_department: payload.sub_department,
	});
	reply.code(201).send(queryResult);
};

export const putSalaryRoute: RouteOptions<Server, IncomingMessage, ServerResponse, PutSalaryRoute> = {
	method: 'PUT',
	url: '/salary',
	schema: {
		description: 'API endpoint to add a new salary record',
		summary: 'Add a new salary record',
		headers: {
			type: 'object',
			additionalProperties: true,
			properties: {
				authorization: { type: 'string' },
			},
			required: ['authorization'],
		},
		body: {
			type: 'object',
			additionalProperties: false,
			properties: {
				name: { type: 'string' },
				salary: { type: 'number' },
				currency: { type: 'string' },
				on_contract: { type: 'boolean' },
				department: { type: 'string' },
				sub_department: { type: 'string' },
			},
			required: [
				'name',
				'salary',
				'currency',
				'department',
				'sub_department',
			],
		},
		response: {
			201: {
				type: 'object',
				additionalProperties: false,
				properties: {
					id: { type: 'number' },
					name: { type: 'string' },
					salary: { type: 'number' },
					currency: { type: 'string' },
					on_contract: { type: 'boolean' },
					department: { type: 'string' },
					sub_department: { type: 'string' },
				},
			},
		},
	},
	handler: addSalaryHandler,
};
