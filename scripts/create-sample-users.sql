-- Creiamo alcuni utenti di esempio se non esistono
INSERT INTO users (id, name, email, password_hash, role, created_at) 
VALUES 
  (gen_random_uuid(), 'Mario Rossi', 'mario.rossi@entermed.it', '$2b$10$example', 'user', NOW()),
  (gen_random_uuid(), 'Giulia Bianchi', 'giulia.bianchi@entermed.it', '$2b$10$example', 'user', NOW()),
  (gen_random_uuid(), 'Luca Verdi', 'luca.verdi@entermed.it', '$2b$10$example', 'moderator', NOW()),
  (gen_random_uuid(), 'Admin User', 'admin@entermed.it', '$2b$10$example', 'admin', NOW())
ON CONFLICT (email) DO NOTHING;

-- Verifica che gli utenti siano stati creati
SELECT id, name, email, role FROM users ORDER BY name;
