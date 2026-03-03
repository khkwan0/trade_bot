CREATE TABLE telegram (
    id SERIAL PRIMARY KEY,
    tg_id INTEGER NOT NULL,
    prices_ttl INTEGER NOT NULL DEFAULT 300,
    token VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER telegram_updated_at
    BEFORE UPDATE ON telegram
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at();