import DB from '../database/db';

interface RawSalaryInformation {
	id?: number;
	name: string;
	salary: number;
	currency: string;
	on_contract: 0 | 1;
	department: string;
	sub_department: string;
}

export interface SalaryInformation extends Omit<RawSalaryInformation, 'on_contract'> {
	on_contract: boolean;
}

export interface SalaryStatistics {
	avg: number;
	max: number;
	min: number;
}

export interface SalaryStatisticsPerDepartment extends SalaryStatistics {
	department: string;
}

export interface SalaryStatisticsPerDepartmentAndSubDepartment extends SalaryStatisticsPerDepartment {
	sub_department: string;
}

interface SalaryFilters {
	currency?: string;
	onContract?: boolean;
}

/**
 * Builds prepared statement parameters based on input filters.
 */
const buildFilters = (filters?: SalaryFilters): Record<string, string | number> => {
	const params: Record<string, string | number> = {};
	if (filters?.currency) {
		params.currency = filters.currency;
	}
	if (filters?.onContract !== undefined) {
		params.onContract = filters.onContract ? 1 : 0;
	}
	return params;
};

/**
 * Adds a salary record.
 *
 * @param salaryInfo Salary record payload.
 * @returns Inserted record, along with ROWID from the database.
 */
export const addSalary = (salaryInfo: SalaryInformation): SalaryInformation => {
	const rowId = DB.insert('salaries', {
		...salaryInfo,
		on_contract: salaryInfo.on_contract ? 1 : 0,
	});
	return Object.assign({
		id: rowId,
	}, salaryInfo);
};

/**
 * Removes a salary record.
 *
 * @param salaryRowId ROWID of the salary record.
 * @returns Deletion status.
 */
export const removeSalary = (salaryRowId: number): boolean => {
	const deletedRowCount = DB.delete('salaries', { rowid: salaryRowId });
	return Boolean(deletedRowCount);
};

/**
 * Lists all salary records (along with ROWID).
 */
export const getAllSalaries = (): Array<SalaryInformation> => {
	const baseQuery = `SELECT ROWID as id, * FROM salaries` as const;
	const queryResult = DB.query<RawSalaryInformation>(baseQuery);
	return queryResult.map((row) => {
		return {
			...row,
			on_contract: Boolean(row.on_contract),
		};
	});
};

/**
 * Returns statistics (average, maximum, minimum) for all (or filtered) salary records.
 *
 * @param filters (Optional) Filters for which records to consider.
 */
export const getStatsForSalaries = (filters?: SalaryFilters): SalaryStatistics => {
	const baseQuery = `SELECT AVG(salary) AS avg, MAX(salary) AS max, MIN(salary) AS min FROM salaries` as const;
	let additionalWhereClauses: Array<string> = [];
	if (filters?.currency) {
		additionalWhereClauses.push(`WHERE currency=@currency`);
	}
	if (filters?.onContract !== undefined) {
		additionalWhereClauses.push(`WHERE on_contract=@onContract`);
	}
	if (additionalWhereClauses.length) {
		const preparedQuery = DB.prepare(`${baseQuery} ${additionalWhereClauses.join(' AND ')}`);
		const result = preparedQuery.all(buildFilters(filters)) as Array<SalaryStatistics>;
		return result[0];
	}
	const result = DB.query<SalaryStatistics>(baseQuery);
	return result[0];
};

/**
 * Returns statistics (average, maximum, minimum) for all (or filtered) salary records grouped by their department.
 *
 * @param filters (Optional) Filters for which records to consider.
 */
export const getStatsForSalariesByDepartment = (
	filters?: SalaryFilters,
): Array<SalaryStatisticsPerDepartment> => {
	const baseQuery =
		`SELECT department, AVG(salary) AS avg, MAX(salary) AS max, MIN(salary) AS min FROM salaries` as const;
	const groupByClause = `GROUP BY department` as const;

	let additionalWhereClauses: Array<string> = [];
	if (filters?.currency) {
		additionalWhereClauses.push(`WHERE currency=@currency`);
	}
	if (filters?.onContract !== undefined) {
		additionalWhereClauses.push(`WHERE on_contract=@onContract`);
	}
	if (additionalWhereClauses.length) {
		const preparedQuery = DB.prepare(`${baseQuery} ${additionalWhereClauses.join(' AND ')} ${groupByClause}`);
		const result = preparedQuery.all(buildFilters(filters)) as Array<SalaryStatisticsPerDepartment>;
		return result;
	}
	const result = DB.query<SalaryStatisticsPerDepartment>(`${baseQuery} ${groupByClause}`);
	return result;
};

/**
 * Returns statistics (average, maximum, minimum) for all (or filtered) salary records grouped by their department _and_ sub-department.
 *
 * @param filters (Optional) Filters for which records to consider.
 */
export const getStatsForSalariesByDepartmentAndSubDepartment = (
	filters?: SalaryFilters,
): Array<SalaryStatisticsPerDepartmentAndSubDepartment> => {
	const baseQuery =
		`SELECT department, sub_department, AVG(salary) AS avg, MAX(salary) AS max, MIN(salary) AS min FROM salaries` as const;
	const groupByClause = `GROUP BY department, sub_department` as const;

	let additionalWhereClauses: Array<string> = [];
	if (filters?.currency) {
		additionalWhereClauses.push(`WHERE currency=@currency`);
	}
	if (filters?.onContract !== undefined) {
		additionalWhereClauses.push(`WHERE on_contract=@onContract`);
	}
	if (additionalWhereClauses.length) {
		const preparedQuery = DB.prepare(`${baseQuery} ${additionalWhereClauses.join(' AND ')} ${groupByClause}`);
		const result = preparedQuery.all(buildFilters(filters)) as Array<SalaryStatisticsPerDepartmentAndSubDepartment>;
		return result;
	}
	const result = DB.query<SalaryStatisticsPerDepartmentAndSubDepartment>(`${baseQuery} ${groupByClause}`);
	return result;
};
