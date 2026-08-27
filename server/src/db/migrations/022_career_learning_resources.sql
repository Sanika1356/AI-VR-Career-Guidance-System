-- Migration 022: fill the authored learning-resource catalog for every seeded career.
-- The resource table is intentionally append-only at the catalog level: upserts keep deployments idempotent.

INSERT INTO learning_resources (
  id, career_id, skill_id, title, description, url, provider, source_type, resource_type,
  cost_model, duration_minutes, level, format, language_code, accessibility,
  freshness_date, license_name, verified, display_order
) VALUES
  (
    'resource_ux_nng_articles', 'career_ux_researcher', 'skill_user_research',
    'UX and Usability Articles',
    'Research-based articles on user research methods, interviews, usability testing, and evidence-led design.',
    'https://www.nngroup.com/articles/', 'Nielsen Norman Group', 'catalog', 'article',
    'free', 240, 'all', 'reading', 'en',
    '{"captions":false,"transcript":false,"textAlternative":true}'::jsonb,
    DATE '2026-08-27', 'Site terms', TRUE, 1
  ),
  (
    'resource_ux_w3c_wai', 'career_ux_researcher', 'skill_user_research',
    'W3C Web Accessibility Initiative',
    'Foundational accessibility guidance for evaluating experiences with a wider range of users and needs.',
    'https://www.w3.org/WAI/', 'World Wide Web Consortium', 'catalog', 'documentation',
    'free', 180, 'all', 'reading', 'en',
    '{"captions":false,"transcript":false,"textAlternative":true}'::jsonb,
    DATE '2026-08-27', 'W3C Document License', TRUE, 2
  ),
  (
    'resource_ux_gov_user_research', 'career_ux_researcher', 'skill_communication',
    'GOV.UK User Research Guidance',
    'Practical guidance for planning, conducting, and communicating user research in a service team.',
    'https://www.gov.uk/service-manual/user-research', 'GOV.UK Service Manual', 'catalog', 'guide',
    'free', 120, 'beginner', 'reading', 'en',
    '{"captions":false,"transcript":false,"textAlternative":true}'::jsonb,
    DATE '2026-08-27', 'Open Government Licence', TRUE, 3
  ),
  (
    'resource_product_material_design', 'career_product_designer', 'skill_prototyping',
    'Material Design 3',
    'A practical design system reference for interface patterns, components, layout, and accessibility.',
    'https://m3.material.io/', 'Material Design', 'catalog', 'guide',
    'free', 240, 'all', 'reference', 'en',
    '{"captions":false,"transcript":false,"textAlternative":true}'::jsonb,
    DATE '2026-08-27', 'Apache License 2.0', TRUE, 1
  ),
  (
    'resource_product_mdn_css', 'career_product_designer', 'skill_html_css',
    'MDN CSS Guides',
    'Reference and tutorials for layout, responsive styling, visual hierarchy, and interface implementation.',
    'https://developer.mozilla.org/en-US/docs/Web/CSS', 'MDN Web Docs', 'catalog', 'documentation',
    'free', 180, 'beginner', 'reading', 'en',
    '{"captions":false,"transcript":false,"textAlternative":true}'::jsonb,
    DATE '2026-08-27', 'CC BY-SA 2.5', TRUE, 2
  ),
  (
    'resource_product_wcag', 'career_product_designer', NULL,
    'Web Content Accessibility Guidelines',
    'The W3C accessibility standard for making web content more usable for people with disabilities.',
    'https://www.w3.org/WAI/standards-guidelines/wcag/', 'World Wide Web Consortium', 'catalog', 'guide',
    'free', 240, 'all', 'reference', 'en',
    '{"captions":false,"transcript":false,"textAlternative":true}'::jsonb,
    DATE '2026-08-27', 'W3C Document License', TRUE, 3
  ),
  (
    'resource_cyber_owasp_wstg', 'career_cybersecurity_analyst', 'skill_cybersecurity',
    'OWASP Web Security Testing Guide',
    'A structured reference for web application security testing, threat discovery, and reporting.',
    'https://owasp.org/www-project-web-security-testing-guide/', 'OWASP Foundation', 'catalog', 'guide',
    'free', 360, 'intermediate', 'reading', 'en',
    '{"captions":false,"transcript":false,"textAlternative":true}'::jsonb,
    DATE '2026-08-27', 'CC BY-SA 4.0', TRUE, 1
  ),
  (
    'resource_cyber_nist_csf', 'career_cybersecurity_analyst', 'skill_cybersecurity',
    'NIST Cybersecurity Framework 2.0',
    'A framework and set of quick-start resources for understanding and improving cybersecurity risk management.',
    'https://www.nist.gov/cyberframework', 'National Institute of Standards and Technology', 'catalog', 'guide',
    'free', 300, 'all', 'reference', 'en',
    '{"captions":false,"transcript":false,"textAlternative":true}'::jsonb,
    DATE '2026-08-27', 'U.S. Government work', TRUE, 2
  ),
  (
    'resource_cyber_mdn_security', 'career_cybersecurity_analyst', 'skill_apis',
    'MDN Web Security',
    'Guides to common web security risks and defensive practices for applications and users.',
    'https://developer.mozilla.org/en-US/docs/Web/Security', 'MDN Web Docs', 'catalog', 'documentation',
    'free', 180, 'beginner', 'reading', 'en',
    '{"captions":false,"transcript":false,"textAlternative":true}'::jsonb,
    DATE '2026-08-27', 'CC BY-SA 2.5', TRUE, 3
  )
ON CONFLICT (id) DO UPDATE SET
  career_id = EXCLUDED.career_id,
  skill_id = EXCLUDED.skill_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  url = EXCLUDED.url,
  provider = EXCLUDED.provider,
  source_type = EXCLUDED.source_type,
  resource_type = EXCLUDED.resource_type,
  cost_model = EXCLUDED.cost_model,
  duration_minutes = EXCLUDED.duration_minutes,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  language_code = EXCLUDED.language_code,
  accessibility = EXCLUDED.accessibility,
  freshness_date = EXCLUDED.freshness_date,
  license_name = EXCLUDED.license_name,
  verified = EXCLUDED.verified,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Rollback: delete only these authored rows by id if the seed must be reverted.
