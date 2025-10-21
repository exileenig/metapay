-- Helper functions for balance management
-- Run this script after creating the tables

-- Function to increment seller balance (used when transactions complete)
CREATE OR REPLACE FUNCTION increment_seller_balance(seller_id INTEGER, amount NUMERIC)
RETURNS void AS $$
BEGIN
  UPDATE sellers 
  SET balance = balance + amount 
  WHERE id = seller_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement seller balance (used when payouts are requested)
CREATE OR REPLACE FUNCTION decrement_seller_balance(seller_id INTEGER, amount NUMERIC)
RETURNS void AS $$
BEGIN
  UPDATE sellers 
  SET balance = balance - amount 
  WHERE id = seller_id;
END;
$$ LANGUAGE plpgsql;
