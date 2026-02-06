SELECT user_id, COUNT(*) AS total
FROM events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 day'
GROUP BY user_id
ORDER BY total DESC
LIMIT 20;
