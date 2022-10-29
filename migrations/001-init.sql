-- Down
DROP TABLE IF EXISTS `salaries`;

-- Up
CREATE TABLE `salaries` (
	name	INTEGER NOT NULL,
	salary	INTEGER NOT NULL,
	currency	TEXT NOT NULL,
	on_contract	INTEGER NOT NULL DEFAULT 0 CHECK (on_contract IN (0, 1)),
	department	TEXT NOT NULL,
	sub_department	TEXT NOT NULL
);

INSERT INTO salaries ('name', 'salary', 'currency', 'on_contract', 'department', 'sub_department') VALUES('Abhishek', 145000, 'USD', 0, 'Engineering', 'Platform');
INSERT INTO salaries ('name', 'salary', 'currency', 'on_contract', 'department', 'sub_department') VALUES('Anurag', 90000, 'USD', 1, 'Banking', 'Loan');
INSERT INTO salaries ('name', 'salary', 'currency', 'on_contract', 'department', 'sub_department') VALUES('Himani', 240000, 'USD', 0, 'Engineering', 'Platform');
INSERT INTO salaries ('name', 'salary', 'currency', 'on_contract', 'department', 'sub_department') VALUES('Yatendra', 30, 'USD', 0, 'Operations', 'CustomerOnboarding');
INSERT INTO salaries ('name', 'salary', 'currency', 'on_contract', 'department', 'sub_department') VALUES('Ragini', 30, 'USD', 0, 'Engineering', 'Platform');
INSERT INTO salaries ('name', 'salary', 'currency', 'on_contract', 'department', 'sub_department') VALUES('Nikhil', 110000, 'USD', 1, 'Engineering', 'Platform');
INSERT INTO salaries ('name', 'salary', 'currency', 'on_contract', 'department', 'sub_department') VALUES('Guljit', 30, 'USD', 0, 'Administration', 'Agriculture');
INSERT INTO salaries ('name', 'salary', 'currency', 'on_contract', 'department', 'sub_department') VALUES('Himanshu', 70000, 'EUR', 0, 'Operations', 'CustomerOnboarding');
INSERT INTO salaries ('name', 'salary', 'currency', 'on_contract', 'department', 'sub_department') VALUES('Anupam', 200000000, 'INR', 0, 'Engineering', 'Platform');
