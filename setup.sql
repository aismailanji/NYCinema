CREATE TABLE accounts (
    email VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE user_events (
    event_name VARCHAR(255),
    event_description TEXT,
    event_address VARCHAR(255),
    event_start TIMESTAMP,
    event_end TIMESTAMP,
    event_permalink TEXT,
    user_email VARCHAR(255)
);

CREATE TABLE user_movies (
    movie_title VARCHAR(255),
    movie_poster VARCHAR(255),
    movie_overview TEXT,
    user_email VARCHAR(255)
);

CREATE TABLE contact_messages (
    name VARCHAR(255),
    email VARCHAR(255),
    message TEXT,
    submitted_at TIMESTAMP
);


CREATE TABLE sightseeing_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    address VARCHAR(255),
    borough VARCHAR(255)
);
