import { array, boolean, name, number, word } from 'minifaker';
import { createSandbox } from 'sinon';
import tap from 'tap';
import 'minifaker/locales/en';
import DBInstance from '../../database/db';
import * as salaryMethods from '../../models/salary';
import type { SalaryInformation } from '../../models/salary';
import { getRandomCurrency } from '../helpers/random-currency';

tap.test('models > salary > addSalary() should add a new record and return the inserted record along with row id', (t) => {
	t.plan(2);
	const sandbox = createSandbox();
	t.teardown(() => sandbox.restore());

	const input: SalaryInformation = {
		name: name(),
		salary: number({ min: 100000, max: 500000, float: false }),
		currency: getRandomCurrency(),
		on_contract: boolean(),
		department: word(),
		sub_department: word(),
	};

	const mockRowId = number({ min: 100, max: 999, float: false });
	const insertSpy = sandbox.stub(DBInstance, 'insert').returns(mockRowId);

	const output = salaryMethods.addSalary(input);
	t.ok(
		insertSpy.calledWithExactly('salaries', {
			...input,
			on_contract: input.on_contract ? 1 : 0,
		}),
		'insert command should be called with given input while also handling bool<>integer type casting for on_contract field',
	);
	t.same(output, { id: mockRowId, ...input }, 'should return original input along with inserted row id');
	t.end();
});

tap.test('models > salary > removeSalary() should delete a given record and return deletion status', (t) => {
	t.plan(2);
	const sandbox = createSandbox();
	t.teardown(() => sandbox.restore());

	const input = number({ min: 100, max: 999, float: false });

	const mockDeletedRowCount = number({ min: 0, max: 10, float: false });
	const deleteSpy = sandbox.stub(DBInstance, 'delete').returns(mockDeletedRowCount);

	const output = salaryMethods.removeSalary(input);
	t.ok(
		deleteSpy.calledWithExactly('salaries', {
			rowid: input,
		}),
		'delete command should be called with given input for rowid',
	);
	t.same(output, Boolean(mockDeletedRowCount), 'should return true if at least 1 record was deleted, otherwise false');
	t.end();
});

tap.test('models > salary > getAllSalaries() should return all salary records along with row id', (t) => {
	t.plan(2);
	const sandbox = createSandbox();
	t.teardown(() => sandbox.restore());

	const mockSalaryData = array(number({ min: 1, max: 100, float: false }), (index) => {
		return {
			id: index,
			name: name(),
			salary: number({ min: 100000, max: 500000, float: false }),
			currency: getRandomCurrency(),
			on_contract: number({ min: 0, max: 1, float: false }),
			department: word(),
			sub_department: word(),
		};
	});
	const querySpy = sandbox.stub(DBInstance, 'query').returns(mockSalaryData);

	const output = salaryMethods.getAllSalaries();
	t.ok(
		querySpy.calledOnceWithExactly('SELECT ROWID as id, * FROM salaries'),
		'query command should be called with correct SELECT query',
	);
	t.same(
		output,
		mockSalaryData.map((s) => {
			return { ...s, on_contract: Boolean(s.on_contract) };
		}),
		'should return all salary records while also handling bool<>integer type casting for on_contract field',
	);
	t.end();
});

tap.test('models > salary > getStatsForSalaries() should return salary statistics for all records when no filters are provided', (t) => {
	t.plan(2);
	const sandbox = createSandbox();
	t.teardown(() => sandbox.restore());

	const mockSalaryStatsData = array(number({ min: 1, max: 1, float: false }), () => {
		return {
			avg: number({ float: true }),
			max: number({ float: false }),
			min: number({ float: false }),
		};
	});
	const querySpy = sandbox.stub(DBInstance, 'query').returns(mockSalaryStatsData);

	const output = salaryMethods.getStatsForSalaries();
	t.ok(
		querySpy.calledOnceWithExactly('SELECT AVG(salary) AS avg, MAX(salary) AS max, MIN(salary) AS min FROM salaries'),
		'query command should be called with correct SELECT query',
	);
	t.same(
		output,
		mockSalaryStatsData[0],
		'should return statistics for all salary records',
	);
	t.end();
});

tap.test('models > salary > getStatsForSalaries() should return salary statistics for filtered records', (t) => {
	t.plan(3);
	const sandbox = createSandbox();
	t.teardown(() => sandbox.restore());

	const mockSalaryStatsData = array(number({ min: 1, max: 1, float: false }), () => {
		return {
			avg: number({ float: true }),
			max: number({ float: false }),
			min: number({ float: false }),
		};
	});
	const mockFilters = { currency: getRandomCurrency(), onContract: true };
	const mockPreparedStatement = {
		all: (_: unknown) => mockSalaryStatsData,
	};

	const prepareSpy = sandbox.stub(DBInstance, 'prepare').returns(mockPreparedStatement);
	const executeSpy = sandbox.spy(mockPreparedStatement, 'all');

	const output = salaryMethods.getStatsForSalaries(mockFilters);

	t.ok(
		prepareSpy.calledOnceWithExactly(
			'SELECT AVG(salary) AS avg, MAX(salary) AS max, MIN(salary) AS min FROM salaries WHERE currency=@currency AND WHERE on_contract=@onContract',
		),
		'prepare statement command should be called with correct SELECT query',
	);
	t.same(
		executeSpy.getCall(0).lastArg,
		{ currency: mockFilters.currency, onContract: mockFilters.onContract ? 1 : 0 },
		'prepared statement should be executed with the filters correctly applied  while also handling bool<>integer type casting for on_contract field',
	);
	t.same(
		output,
		mockSalaryStatsData[0],
		'should return statistics for all salary records with filters applied',
	);
	t.end();
});

tap.test('models > salary > getStatsForSalariesByDepartment() should return salary statistics for all records grouped by department when no filters are provided', (t) => {
	t.plan(2);
	const sandbox = createSandbox();
	t.teardown(() => sandbox.restore());

	const mockSalaryStatsPerDepartmentData = array(number({ min: 10, max: 100, float: false }), () => {
		return {
			department: word(),
			avg: number({ float: true }),
			max: number({ float: false }),
			min: number({ float: false }),
		};
	});
	const querySpy = sandbox.stub(DBInstance, 'query').returns(mockSalaryStatsPerDepartmentData);

	const output = salaryMethods.getStatsForSalariesByDepartment();
	t.ok(
		querySpy.calledOnceWithExactly(
			'SELECT department, AVG(salary) AS avg, MAX(salary) AS max, MIN(salary) AS min FROM salaries GROUP BY department',
		),
		'query command should be called with correct SELECT query and GROUP BY clause',
	);
	t.same(
		output,
		mockSalaryStatsPerDepartmentData,
		'should return statistics for all salary records grouped by department',
	);
	t.end();
});

tap.test('models > salary > getStatsForSalariesByDepartment() should return salary statistics for filtered records grouped by department', (t) => {
	t.plan(3);
	const sandbox = createSandbox();
	t.teardown(() => sandbox.restore());

	const mockSalaryStatsPerDepartmentData = array(number({ min: 10, max: 100, float: false }), () => {
		return {
			department: word(),
			avg: number({ float: true }),
			max: number({ float: false }),
			min: number({ float: false }),
		};
	});
	const mockFilters = { currency: getRandomCurrency(), onContract: true };
	const mockPreparedStatement = {
		all: (_: unknown) => mockSalaryStatsPerDepartmentData,
	};

	const prepareSpy = sandbox.stub(DBInstance, 'prepare').returns(mockPreparedStatement);
	const executeSpy = sandbox.spy(mockPreparedStatement, 'all');

	const output = salaryMethods.getStatsForSalariesByDepartment(mockFilters);

	t.ok(
		prepareSpy.calledOnceWithExactly(
			'SELECT department, AVG(salary) AS avg, MAX(salary) AS max, MIN(salary) AS min FROM salaries WHERE currency=@currency AND WHERE on_contract=@onContract GROUP BY department',
		),
		'prepare statement command should be called with correct SELECT query and GROUP BY clause',
	);
	t.same(
		executeSpy.getCall(0).lastArg,
		{ currency: mockFilters.currency, onContract: mockFilters.onContract ? 1 : 0 },
		'prepared statement should be executed with the filters correctly applied  while also handling bool<>integer type casting for on_contract field',
	);
	t.same(
		output,
		mockSalaryStatsPerDepartmentData,
		'should return statistics for all salary records with filters applied',
	);
	t.end();
});

tap.test('models > salary > getStatsForSalariesByDepartmentAndSubDepartment() should return salary statistics for all records grouped by department and sub-department when no filters are provided', (t) => {
	t.plan(2);
	const sandbox = createSandbox();
	t.teardown(() => sandbox.restore());

	const mockSalaryStatsPerDepartmentAndSubDepartmentData = array(number({ min: 10, max: 100, float: false }), () => {
		return {
			department: word(),
			sub_department: word(),
			avg: number({ float: true }),
			max: number({ float: false }),
			min: number({ float: false }),
		};
	});
	const querySpy = sandbox.stub(DBInstance, 'query').returns(mockSalaryStatsPerDepartmentAndSubDepartmentData);

	const output = salaryMethods.getStatsForSalariesByDepartmentAndSubDepartment();
	t.ok(
		querySpy.calledWithExactly(
			'SELECT department, sub_department, AVG(salary) AS avg, MAX(salary) AS max, MIN(salary) AS min FROM salaries GROUP BY department, sub_department',
		),
		'query command should be called with correct SELECT query and GROUP BY clauses',
	);
	t.same(
		output,
		mockSalaryStatsPerDepartmentAndSubDepartmentData,
		'should return statistics for all salary records grouped by department and sub-department',
	);
	t.end();
});

tap.test('models > salary > getStatsForSalariesByDepartmentAndSubDepartment() should return salary statistics for filtered records grouped by department and sub-department', (t) => {
	t.plan(3);
	const sandbox = createSandbox();
	t.teardown(() => sandbox.restore());

	const mockSalaryStatsPerDepartmentAndSubDepartmentData = array(number({ min: 10, max: 100, float: false }), () => {
		return {
			department: word(),
			sub_department: word(),
			avg: number({ float: true }),
			max: number({ float: false }),
			min: number({ float: false }),
		};
	});
	const mockFilters = { currency: getRandomCurrency(), onContract: true };
	const mockPreparedStatement = {
		all: (_: unknown) => mockSalaryStatsPerDepartmentAndSubDepartmentData,
	};

	const prepareSpy = sandbox.stub(DBInstance, 'prepare').returns(mockPreparedStatement);
	const executeSpy = sandbox.spy(mockPreparedStatement, 'all');

	const output = salaryMethods.getStatsForSalariesByDepartmentAndSubDepartment(mockFilters);

	t.ok(
		prepareSpy.calledWithExactly(
			'SELECT department, sub_department, AVG(salary) AS avg, MAX(salary) AS max, MIN(salary) AS min FROM salaries WHERE currency=@currency AND WHERE on_contract=@onContract GROUP BY department, sub_department',
		),
		'prepare statement command should be called with correct SELECT query and GROUP BY clauses',
	);
	t.same(
		executeSpy.getCall(0).lastArg,
		{ currency: mockFilters.currency, onContract: mockFilters.onContract ? 1 : 0 },
		'prepared statement should be executed with the filters correctly applied  while also handling bool<>integer type casting for on_contract field',
	);
	t.same(
		output,
		mockSalaryStatsPerDepartmentAndSubDepartmentData,
		'should return statistics for all salary records with filters applied',
	);
	t.end();
});
