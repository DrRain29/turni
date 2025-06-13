-- Questo script aggiorna la tabella "users" per supportare il ruolo "moderator"

-- 1. Aggiungiamo una colonna is_moderator per tracciare gli utenti moderatori
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_moderator BOOLEAN DEFAULT FALSE;

-- 2. Aggiorniamo il vincolo di controllo sulla colonna "role"
-- Prima verifichiamo se il vincolo esiste
DO $$
BEGIN
  -- Se il vincolo esiste, lo rimuoviamo
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_role_check' AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
    
    -- Poi aggiungiamo un nuovo vincolo che include "moderator"
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'moderator'));
    
    RAISE NOTICE 'Vincolo aggiornato con successo per includere il ruolo "moderator"';
  ELSE
    -- Se il vincolo non esiste con quel nome, cerchiamo altri vincoli sulla colonna role
    RAISE NOTICE 'Nessun vincolo chiamato "users_role_check" trovato. Verificare il nome del vincolo.';
  END IF;
END $$;

-- 3. Verifichiamo tutti i vincoli sulla tabella users
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;

-- 4. Verifichiamo la struttura della tabella users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users';
