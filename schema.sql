-- Users table to store user information
CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(30) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table to store user tasks with foreign key relationship
CREATE TABLE IF NOT EXISTS tasks(
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    user_id INTEGER NOT NULL REFERENCES users(id), --user_id number should exist same as users(id)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tasks_id_user_id_unique UNIQUE (id, user_id) --UNIQUE means should not be same
    -- This is NOT allowed —
    -- id  user_id
    -- 5   12
    -- 5   12

    -- This IS allowed
    -- id  user_id
    -- 5   12
    -- 6   12
); 