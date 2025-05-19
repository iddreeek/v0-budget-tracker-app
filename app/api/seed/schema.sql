-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

-- Create budgets table with name and date range
CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create transactions table with budget_id
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default categories if they don't exist
INSERT INTO categories (name) 
VALUES 
  ('Housing'),
  ('Food'),
  ('Transportation'),
  ('Entertainment'),
  ('Utilities'),
  ('Healthcare'),
  ('Shopping'),
  ('Education'),
  ('Salary'),
  ('Investments'),
  ('Side Hustle'),
  ('Other')
ON CONFLICT (name) DO NOTHING;
