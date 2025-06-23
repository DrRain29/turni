-- Script per verificare e correggere la tabella users

-- 1. Verifica la struttura attuale della tabella
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Verifica i vincoli esistenti
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users';

-- 3. Se la tabella non esiste o ha problemi, ricreiamola
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inserisci alcuni utenti di esempio se la tabella è vuota
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@entermed.it', 'admin123', 'admin'),
('Test User', 'test@entermed.it', 'test123', 'user'),
('Moderator User', 'mod@entermed.it', 'mod123', 'moderator')
ON CONFLICT (email) DO NOTHING;

-- 5. Verifica il risultato
SELECT id, name, email, role, created_at FROM users ORDER BY name;
