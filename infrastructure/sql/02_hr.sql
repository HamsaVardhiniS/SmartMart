CREATE TYPE employee_status_enum AS ENUM ('Active','Inactive');
CREATE TYPE leave_status_enum AS ENUM ('Pending','Approved','Rejected');

-- DEPARTMENTS
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(255) UNIQUE NOT NULL
);

-- EMPLOYEES
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    branch_id INT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    department_id INT REFERENCES departments(department_id),
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    address TEXT,
    dob DATE,
    gender VARCHAR(20),
    emergency_contact VARCHAR(20),
    hire_date DATE,
    status employee_status_enum DEFAULT 'Active',
    password_hash TEXT NOT NULL,
    bank_account_number VARCHAR(50) UNIQUE NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    salary NUMERIC(12,2) NOT NULL,
    allowed_leaves INT DEFAULT 12
);

-- MANAGER LINK
ALTER TABLE departments
ADD COLUMN manager_id INT REFERENCES employees(employee_id) ON DELETE SET NULL;

-- ATTENDANCE
CREATE TABLE attendance (
    attendance_id BIGSERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(employee_id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    total_hours NUMERIC(5,2),
    overtime_hours NUMERIC(5,2) DEFAULT 0,
    UNIQUE(employee_id, attendance_date),
    CONSTRAINT chk_time_valid CHECK (check_out_time IS NULL OR check_out_time >= check_in_time)
);

-- LEAVE BALANCE
CREATE TABLE leave_balance (
    employee_id INT PRIMARY KEY REFERENCES employees(employee_id) ON DELETE CASCADE,
    total_allowed INT NOT NULL,
    used_leaves INT DEFAULT 0,
    remaining_leaves INT GENERATED ALWAYS AS (total_allowed - used_leaves) STORED
);

-- LEAVE REQUESTS
CREATE TABLE leave_requests (
    leave_id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(employee_id) ON DELETE CASCADE,
    leave_type VARCHAR(30),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status leave_status_enum DEFAULT 'Pending'
);

-- PAYROLL
CREATE TABLE payroll (
    payroll_id BIGSERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(employee_id) ON DELETE CASCADE,
    payroll_month INT CHECK (payroll_month BETWEEN 1 AND 12),
    payroll_year INT NOT NULL,
    base_salary NUMERIC(12,2) NOT NULL,
    leave_deduction NUMERIC(12,2) DEFAULT 0,
    bonus NUMERIC(12,2) DEFAULT 0,
    net_salary NUMERIC(12,2) GENERATED ALWAYS AS (base_salary - leave_deduction + bonus) STORED,
    UNIQUE(employee_id, payroll_month, payroll_year)
);

-- PASSWORD RESET
CREATE TABLE password_resets (
    reset_id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(employee_id) ON DELETE CASCADE,
    reset_token TEXT NOT NULL,
    expiry_time TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE
);

-- INDEXES
CREATE INDEX idx_employee_status ON employees(status);
CREATE INDEX idx_employee_branch ON employees(branch_id);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, attendance_date);
CREATE INDEX idx_payroll_employee ON payroll(employee_id);

ALTER TABLE leave_balance 
ALTER COLUMN remaining_leaves TYPE INT;

CREATE TABLE event_log (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE failed_events (
  event_id TEXT,
  payload JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);