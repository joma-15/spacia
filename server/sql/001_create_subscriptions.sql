-- Run once against the existing Spacia MySQL database.
-- Every existing and future user starts as free/cancelled until you update the row.
CREATE TABLE IF NOT EXISTS subscriptions (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  plan ENUM('free', 'monthly', 'annual') NOT NULL DEFAULT 'free',
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'cancelled',
  started_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_subscriptions_user (user_id),
  CONSTRAINT subscriptions_ibfk_1
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO subscriptions (id, user_id, plan, status)
SELECT UUID(), users.id, 'free', 'cancelled'
FROM users
LEFT JOIN subscriptions ON subscriptions.user_id = users.id
WHERE subscriptions.user_id IS NULL;

UPDATE subscriptions SET plan = 'free', status = 'cancelled';

-- To grant a user Premium manually:
-- UPDATE subscriptions SET status = 'active', plan = 'annual' WHERE user_id = '<user-id>';
