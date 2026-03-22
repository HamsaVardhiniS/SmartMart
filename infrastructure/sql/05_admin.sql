CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE permissions (
    permission_id SERIAL PRIMARY KEY,
    permission_name VARCHAR(150) UNIQUE NOT NULL,
    CONSTRAINT chk_permission_format CHECK (permission_name LIKE '%:%')
);

CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    user_id INT,
    action TEXT,
    module VARCHAR(50),
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);


CREATE TABLE system_config (
    config_id SERIAL PRIMARY KEY,
    config_key VARCHAR(150) UNIQUE NOT NULL,
    config_value TEXT NOT NULL
);

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

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_module_time ON audit_logs(module, timestamp);
