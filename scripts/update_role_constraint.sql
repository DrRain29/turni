-- Script per aggiornare il vincolo sulla colonna role nella tabella users

-- Identifica il nome esatto del vincolo sulla colonna role
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
    AND pg_get_constraintdef(oid) LIKE '%CHECK (role%';
    
    IF constraint_name IS NOT NULL THEN
        -- Rimuovi il vincolo esistente
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Vincolo % rimosso con successo', constraint_name;
        
        -- Aggiungi il nuovo vincolo che include "moderator"
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'moderator'));
        RAISE NOTICE 'Nuovo vincolo users_role_check aggiunto con successo';
    ELSE
        RAISE NOTICE 'Nessun vincolo sulla colonna role trovato';
        
        -- Aggiungi comunque il nuovo vincolo
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'moderator'));
        RAISE NOTICE 'Nuovo vincolo users_role_check aggiunto';
    END IF;
END $$;

-- Verifica che il vincolo sia stato aggiunto correttamente
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass
AND pg_get_constraintdef(oid) LIKE '%CHECK (role%';

-- Aggiorna eventuali utenti esistenti con is_moderator = true
UPDATE users SET role = 'moderator' WHERE is_moderator = true;
