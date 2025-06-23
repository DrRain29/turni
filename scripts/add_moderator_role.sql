-- Questo script aggiorna il vincolo di controllo sulla colonna "role" nella tabella "users"
-- per consentire il valore "moderator" oltre a "user" e "admin"

-- Prima rimuoviamo il vincolo esistente
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Poi aggiungiamo un nuovo vincolo che include "moderator"
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'moderator'));

-- Verifichiamo che il vincolo sia stato aggiornato
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass AND conname = 'users_role_check';
