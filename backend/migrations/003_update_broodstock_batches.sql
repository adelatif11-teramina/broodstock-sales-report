-- Add new fields to broodstock_batches table for enhanced tracking

ALTER TABLE broodstock_batches 
ADD COLUMN IF NOT EXISTS initial_quantity INTEGER,
ADD COLUMN IF NOT EXISTS species VARCHAR(255),
ADD COLUMN IF NOT EXISTS strain VARCHAR(255),
ADD COLUMN IF NOT EXISTS age_weeks DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS weight_grams DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS health_status VARCHAR(20) DEFAULT 'good' CHECK (health_status IN ('excellent', 'good', 'fair', 'poor')),
ADD COLUMN IF NOT EXISTS quarantine_status VARCHAR(20) DEFAULT 'pending' CHECK (quarantine_status IN ('pending', 'in_progress', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing records to set initial_quantity equal to available_quantity where not set
UPDATE broodstock_batches 
SET initial_quantity = available_quantity 
WHERE initial_quantity IS NULL;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_broodstock_batches_species ON broodstock_batches (species);
CREATE INDEX IF NOT EXISTS idx_broodstock_batches_health_status ON broodstock_batches (health_status);
CREATE INDEX IF NOT EXISTS idx_broodstock_batches_quarantine_status ON broodstock_batches (quarantine_status);

-- Update sample data with new fields
UPDATE broodstock_batches 
SET 
  species = CASE 
    WHEN batch_code LIKE '%001' OR batch_code LIKE '%003' THEN 'Penaeus monodon'
    WHEN batch_code LIKE '%002' OR batch_code LIKE '%004' THEN 'Penaeus vannamei'
    ELSE 'Penaeus monodon'
  END,
  strain = CASE 
    WHEN batch_code LIKE '%001' OR batch_code LIKE '%003' THEN 'Black Tiger Premium'
    WHEN batch_code LIKE '%002' OR batch_code LIKE '%004' THEN 'White Shrimp Standard'
    ELSE NULL
  END,
  age_weeks = 12.5,
  weight_grams = 25.0,
  health_status = 'excellent',
  quarantine_status = 'completed',
  notes = 'Initial batch imported from legacy system'
WHERE species IS NULL;