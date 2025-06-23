-- Script per fare backup e ripristino degli utenti
-- Prima facciamo un backup della tabella users esistente

-- 1. Crea una tabella di backup
CREATE TABLE IF NOT EXISTS users_backup AS 
SELECT * FROM users;

-- 2. Verifica il contenuto della tabella di backup
SELECT 'Backup creato con' as info, COUNT(*) as total_users FROM users_backup;

-- 3. Mostra tutti gli utenti nel backup
SELECT id, name, email, role, created_at FROM users_backup ORDER BY name;

-- 4. Se necessario, possiamo ripristinare dalla tabella di backup
-- TRUNCATE users;
-- INSERT INTO users SELECT * FROM users_backup;

-- 5. Verifica che la tabella users abbia la struttura corretta
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
