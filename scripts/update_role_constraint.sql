-- Identifica il nome esatto del vincolo sulla colonna role
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
    AND conname LIKE '%role%';

    IF constraint_name IS NOT NULL THEN
        -- Rimuove il vincolo esistente
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT ' || constraint_name;
        
        -- Aggiunge il nuovo vincolo che include "moderator"
        EXECUTE 'ALTER TABLE users ADD CONSTRAINT ' || constraint_name || ' CHECK (role IN (''admin'', ''user'', ''moderator''))';
        
        RAISE NOTICE 'Vincolo % aggiornato con successo', constraint_name;
    ELSE
        RAISE NOTICE 'Nessun vincolo trovato sulla colonna role';
    END IF;
END $$;

-- Aggiorna eventuali utenti con is_moderator = true
UPDATE users
SET role = 'moderator'
WHERE role = 'user' AND is_moderator = true;
