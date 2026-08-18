INSERT INTO assessment_questions (id, text, question_type, display_order, published) VALUES
  ('question_1', 'Which activity interests you most?', 'single-choice', 1, TRUE),
  ('question_2', 'Which kind of problem would you enjoy solving?', 'single-choice', 2, TRUE),
  ('question_3', 'What would you most like to create?', 'single-choice', 3, TRUE),
  ('question_4', 'Which strength would you like to use more often?', 'single-choice', 4, TRUE),
  ('question_5', 'Which work environment sounds most engaging?', 'single-choice', 5, TRUE)
ON CONFLICT (id) DO UPDATE SET
  text = EXCLUDED.text,
  question_type = EXCLUDED.question_type,
  display_order = EXCLUDED.display_order,
  published = EXCLUDED.published;

INSERT INTO assessment_options (id, question_id, label, scoring, display_order) VALUES
  ('option_1_a', 'question_1', 'Building intelligent software', '{"career_ai_engineer":3}', 1),
  ('option_1_b', 'question_1', 'Finding patterns in data', '{"career_data_analyst":3}', 2),
  ('option_1_c', 'question_1', 'Understanding how people use products', '{"career_ux_researcher":3}', 3),
  ('option_1_d', 'question_1', 'Protecting systems and information', '{"career_cybersecurity_analyst":3}', 4),
  ('option_2_a', 'question_2', 'How can a model make a useful prediction?', '{"career_ai_engineer":2}', 1),
  ('option_2_b', 'question_2', 'What does this dataset tell us?', '{"career_data_analyst":2}', 2),
  ('option_2_c', 'question_2', 'Why is this experience difficult to use?', '{"career_ux_researcher":2,"career_product_designer":1}', 3),
  ('option_2_d', 'question_2', 'How could this system be made safer?', '{"career_cybersecurity_analyst":2}', 4),
  ('option_3_a', 'question_3', 'An intelligent application', '{"career_ai_engineer":2}', 1),
  ('option_3_b', 'question_3', 'A clear report with evidence', '{"career_data_analyst":2}', 2),
  ('option_3_c', 'question_3', 'A tested prototype for people', '{"career_product_designer":3,"career_ux_researcher":1}', 3),
  ('option_3_d', 'question_3', 'A secure technical solution', '{"career_cybersecurity_analyst":2}', 4),
  ('option_4_a', 'question_4', 'Analytical thinking', '{"career_ai_engineer":1,"career_data_analyst":2}', 1),
  ('option_4_b', 'question_4', 'Curiosity about people', '{"career_ux_researcher":2}', 2),
  ('option_4_c', 'question_4', 'Visual and creative communication', '{"career_product_designer":2}', 3),
  ('option_4_d', 'question_4', 'Careful attention to risk', '{"career_cybersecurity_analyst":2}', 4),
  ('option_5_a', 'question_5', 'A collaborative engineering lab', '{"career_ai_engineer":1}', 1),
  ('option_5_b', 'question_5', 'A research and reporting studio', '{"career_data_analyst":1,"career_ux_researcher":1}', 2),
  ('option_5_c', 'question_5', 'A design critique studio', '{"career_product_designer":2}', 3),
  ('option_5_d', 'question_5', 'A security operations center', '{"career_cybersecurity_analyst":2}', 4)
ON CONFLICT (id) DO UPDATE SET
  question_id = EXCLUDED.question_id,
  label = EXCLUDED.label,
  scoring = EXCLUDED.scoring,
  display_order = EXCLUDED.display_order;
