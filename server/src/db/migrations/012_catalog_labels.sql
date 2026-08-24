CREATE TABLE IF NOT EXISTS career_labels (
  career_id TEXT NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (career_id, language_code)
);

CREATE TABLE IF NOT EXISTS skill_labels (
  skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  name TEXT NOT NULL,
  PRIMARY KEY (skill_id, language_code)
);

INSERT INTO career_labels (career_id, language_code, name, description)
SELECT id, 'en', name, description FROM careers
ON CONFLICT (career_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO skill_labels (skill_id, language_code, name)
SELECT id, 'en', name FROM skills
ON CONFLICT (skill_id, language_code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO career_labels (career_id, language_code, name, description) VALUES
  ('career_ai_engineer', 'es', 'Ingeniero de IA', 'Desarrolla sistemas de software inteligentes y funciones de aprendizaje automático para resolver problemas prácticos.'),
  ('career_data_analyst', 'es', 'Analista de datos', 'Convierte datos estructurados en hallazgos claros, informes y decisiones para equipos y organizaciones.'),
  ('career_ux_researcher', 'es', 'Investigador de UX', 'Estudia a las personas y sus necesidades para ayudar a diseñar experiencias útiles, accesibles y comprensibles.'),
  ('career_product_designer', 'es', 'Diseñador de producto', 'Diseña experiencias de producto mediante la comprensión de usuarios, prototipos, interacción y comunicación.'),
  ('career_cybersecurity_analyst', 'es', 'Analista de ciberseguridad', 'Protege sistemas e información mediante el seguimiento de riesgos, la investigación de incidentes y la mejora de controles.' )
ON CONFLICT (career_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO skill_labels (skill_id, language_code, name) VALUES
  ('skill_python', 'es', 'Python'),
  ('skill_machine_learning', 'es', 'Aprendizaje automático'),
  ('skill_apis', 'es', 'APIs'),
  ('skill_data_analysis', 'es', 'Análisis de datos'),
  ('skill_sql', 'es', 'SQL'),
  ('skill_communication', 'es', 'Comunicación'),
  ('skill_user_research', 'es', 'Investigación de usuarios'),
  ('skill_prototyping', 'es', 'Prototipado'),
  ('skill_html_css', 'es', 'HTML y CSS'),
  ('skill_javascript', 'es', 'JavaScript'),
  ('skill_cybersecurity', 'es', 'Ciberseguridad'),
  ('skill_networking', 'es', 'Redes')
ON CONFLICT (skill_id, language_code) DO UPDATE SET name = EXCLUDED.name;

CREATE INDEX IF NOT EXISTS idx_career_labels_language ON career_labels(language_code);
CREATE INDEX IF NOT EXISTS idx_skill_labels_language ON skill_labels(language_code);
