-- Script per verificare i dati degli utenti
SELECT 
    id,
    name,
    email,
    role,
    created_at
FROM users
ORDER BY name;

-- Verifica anche i turni con user_id
SELECT 
    s.id,
    s.user_id,
    s.date,
    s.start_time,
    s.end_time,
    u.name as user_name,
    u.email as user_email
FROM shifts s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.status = 'scheduled'
ORDER BY s.date DESC
LIMIT 10;

-- Conta gli utenti
SELECT COUNT(*) as total_users FROM users;

-- Conta i turni
SELECT COUNT(*) as total_shifts FROM shifts WHERE status = 'scheduled';
