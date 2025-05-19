-- Create budget_spending table if it doesn't exist
CREATE TABLE IF NOT EXISTS budget_spending (
  id SERIAL PRIMARY KEY,
  budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(budget_id, transaction_id)
);
