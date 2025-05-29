-- 1. Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'farmer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Update any 'user' roles to 'farmer' (for consistency)
UPDATE users
SET role = 'farmer'
WHERE role = 'user';

-- 3. Set default role to 'farmer' if it's not already
-- MySQL version-specific: for MySQL 8.x and above
ALTER TABLE users
ALTER COLUMN role SET DEFAULT 'farmer';

-- If you are using MySQL 5.x or older, use:
-- ALTER TABLE users MODIFY role VARCHAR(20) NOT NULL DEFAULT 'farmer';



CREATE TABLE IF NOT EXISTS rentals (
    rental_id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    farmer_id INT NOT NULL,
    owner_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL COMMENT 'Total cost in KSh based on price and duration',
    status ENUM('pending', 'approved', 'completed', 'canceled') DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON DELETE RESTRICT,
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS equipment (
    equipment_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_per_day DECIMAL(10, 2) NOT NULL COMMENT 'Rental price per day in KSh',
    owner_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



INSERT INTO equipment (name, description, price_per_day, owner_id) VALUES
('John Deere Tractor 5100M', 'A versatile tractor for plowing and planting.', 5000.00, 1),
('Kubota Tractor M7060', 'Reliable tractor for medium-sized farms.', 4500.00, 1),
('Rotary Plow 3-Point', 'Ideal for soil preparation.', 2000.00, 2),
('Seed Planter 4-Row', 'Efficient for large-scale planting.', 3500.00, 2),
('Massey Ferguson Harvester', 'High-capacity combine harvester.', 8000.00, 3),
('Irrigation Pump 5HP', 'Diesel-powered pump for irrigation.', 2500.00, 3),
('Tiller 7HP', 'For breaking up soil in small plots.', 1500.00, 1),
('Hay Baler Round', 'Creates compact bales for easy storage.', 3000.00, 2),
('Sprayer Boom 500L', 'For precise pesticide application.', 2200.00, 3),
('Disc Harrow 16-Blades', 'For soil tillage and weed control.', 2800.00, 1);


ALTER TABLE equipment ADD image_url VARCHAR(255) DEFAULT NULL COMMENT 'URL to equipment image';