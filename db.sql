
-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS crowdsnap_analytics;

-- Use the database
USE crowdsnap_analytics;

-- ============================================================================
-- Section 1: Grid/Matrix Data Tables
-- ============================================================================

-- Create grid_data table for storing matrix/grid details
CREATE TABLE IF NOT EXISTS grid_data (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  grid_id VARCHAR(100) NOT NULL UNIQUE,
  grid_name VARCHAR(255) NOT NULL,
  grid_type VARCHAR(50) NOT NULL COMMENT 'text, multi, checkbox',
  metadata JSON NOT NULL COMMENT 'columns and rows configuration',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_grid_id (grid_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create grid_rows table for storing row data
CREATE TABLE IF NOT EXISTS grid_rows (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  grid_id VARCHAR(100) NOT NULL,
  row_name VARCHAR(100) NOT NULL,
  row_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (grid_id) REFERENCES grid_data(grid_id) ON DELETE CASCADE,
  INDEX idx_grid_id (grid_id),
  INDEX idx_row_name (row_name),
  UNIQUE KEY unique_grid_row (grid_id, row_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create grid_cells table for storing individual cell values
CREATE TABLE IF NOT EXISTS grid_cells (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  grid_id VARCHAR(100) NOT NULL,
  row_name VARCHAR(100) NOT NULL,
  column_name VARCHAR(100) NOT NULL,
  cell_value VARCHAR(500),
  user_input BOOLEAN DEFAULT FALSE,
  notes JSON,
  response_id VARCHAR(100) COMMENT 'for multi-type responses',
  response_datetime TIMESTAMP NULL,
  response_ip VARCHAR(45),
  response_guid VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (grid_id) REFERENCES grid_data(grid_id) ON DELETE CASCADE,
  INDEX idx_grid_id (grid_id),
  INDEX idx_row_name (row_name),
  INDEX idx_column_name (column_name),
  INDEX idx_response_id (response_id),
  INDEX idx_cell_search (grid_id, row_name, column_name),
  FULLTEXT INDEX ft_cell_value (cell_value),
  UNIQUE KEY unique_cell (grid_id, row_name, column_name, response_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create grid_search_index table for optimized searching
CREATE TABLE IF NOT EXISTS grid_search_index (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  grid_id VARCHAR(100) NOT NULL,
  search_text VARCHAR(300) NOT NULL,
  row_name VARCHAR(100),
  column_name VARCHAR(100),
  cell_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (grid_id) REFERENCES grid_data(grid_id) ON DELETE CASCADE,
  INDEX idx_grid_search (grid_id, search_text),
  FULLTEXT INDEX ft_search_text (search_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
