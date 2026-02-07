-- Insert Missing Predefined Units
-- Run this SQL script in your MySQL to add the remaining units

-- Missing Quantity units (5 units)
INSERT INTO predefined_units (name, category) VALUES
('pack', 'Quantity'),
('bundle', 'Quantity'),
('set', 'Quantity'),
('pair', 'Quantity'),
('unit', 'Quantity');

-- Missing Area units (5 units)
INSERT INTO predefined_units (name, category) VALUES
('square meter', 'Area'),
('square foot', 'Area'),
('square yard', 'Area'),
('acre', 'Area'),
('hectare', 'Area');

-- Missing Temperature units (2 units)
INSERT INTO predefined_units (name, category) VALUES
('celsius', 'Temperature'),
('fahrenheit', 'Temperature');

-- Verify the count
SELECT COUNT(*) as total_units FROM predefined_units;
-- Should return 37

-- Show all units grouped by category
SELECT category, COUNT(*) as count FROM predefined_units GROUP BY category;
