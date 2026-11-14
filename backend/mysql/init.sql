CREATE DATABASE IF NOT EXISTS fitness_auth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

CREATE DATABASE IF NOT EXISTS fitness_data
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

GRANT ALL PRIVILEGES ON fitness_auth.* TO 'fitness'@'localhost';
GRANT ALL PRIVILEGES ON fitness_data.* TO 'fitness'@'localhost';
