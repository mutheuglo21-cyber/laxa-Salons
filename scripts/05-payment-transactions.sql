-- Add payment tracking tables for Pesapal integration

-- ============================================
-- PAYMENT_TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  merchant_reference VARCHAR(255) UNIQUE NOT NULL,
  pesapal_tracking_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KES',
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled')),
  pesapal_response JSONB,
  callback_url TEXT,
  ipn_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT check_reference CHECK (
    (order_id IS NOT NULL AND appointment_id IS NULL) OR
    (order_id IS NULL AND appointment_id IS NOT NULL)
  )
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_merchant_ref ON payment_transactions(merchant_reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_pesapal_tracking ON payment_transactions(pesapal_tracking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_appointment_id ON payment_transactions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(payment_status);

-- Trigger for updated_at
CREATE TRIGGER update_payment_transactions_updated_at 
BEFORE UPDATE ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update order/appointment payment status when transaction completes
CREATE OR REPLACE FUNCTION update_payment_status_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    NEW.completed_at = NOW();
    
    -- Update order payment status
    IF NEW.order_id IS NOT NULL THEN
      UPDATE orders
      SET 
        payment_status = 'paid',
        payment_method = NEW.payment_method,
        status = CASE WHEN status = 'pending' THEN 'processing' ELSE status END
      WHERE id = NEW.order_id;
    END IF;
    
    -- Update appointment payment status
    IF NEW.appointment_id IS NOT NULL THEN
      UPDATE appointments
      SET 
        payment_status = 'paid',
        payment_method = NEW.payment_method,
        status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END
      WHERE id = NEW.appointment_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_status_trigger
BEFORE UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_payment_status_on_transaction();
