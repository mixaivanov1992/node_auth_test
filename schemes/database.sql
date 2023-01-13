CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    password VARCHAR(255),
    is_email BOOLEAN
);
CREATE TABLE "token" (
    id SERIAL PRIMARY KEY,
    refresh_token VARCHAR(255),
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES "user" (id)
);