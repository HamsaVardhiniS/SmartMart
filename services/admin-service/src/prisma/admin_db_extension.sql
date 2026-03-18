-- USERS
CREATE TABLE admin_users (
    user_id SERIAL PRIMARY KEY,
    employee_id INT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INT REFERENCES roles(role_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FEATURE FLAGS
CREATE TABLE feature_flags (
    flag_id SERIAL PRIMARY KEY,
    feature_name VARCHAR(100) UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE
);

-- APPROVAL SYSTEM
CREATE TABLE approval_requests (
    request_id BIGSERIAL PRIMARY KEY,
    requested_by INT,
    action_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'PENDING',
    approved_by INT,
    request_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);