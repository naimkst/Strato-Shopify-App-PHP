-- Add warm-edge glazing choices to Tab 5 / Isolierglas.
-- The new rows copy the existing 2-fach and 3-fach glass images.

INSERT INTO tab_options (
    tab_id,
    subtab_id,
    section_id,
    option_type,
    label,
    value_key,
    image_url,
    price,
    extra_json,
    depends_on,
    base_img
)
SELECT
    NULL,
    s.id,
    NULL,
    '',
    '2-fach Verglasung Warme Kante',
    '2',
    src.image_url,
    '0.00',
    '{"heading":"2-fach Verglasung Warme Kante","subheading":"Warme Kante Gratis"}',
    '',
    COALESCE(src.base_img, '')
FROM subtabs s
JOIN tab_options src
    ON src.subtab_id = s.id
    AND src.label = '2-fach Verglasung'
WHERE s.tab_id = 5
    AND LOWER(s.name) LIKE '%isolierglas%'
    AND NOT EXISTS (
        SELECT 1
        FROM tab_options existing
        WHERE existing.subtab_id = s.id
            AND LOWER(existing.label) = LOWER('2-fach Verglasung Warme Kante')
    )
LIMIT 1;

INSERT INTO tab_options (
    tab_id,
    subtab_id,
    section_id,
    option_type,
    label,
    value_key,
    image_url,
    price,
    extra_json,
    depends_on,
    base_img
)
SELECT
    NULL,
    s.id,
    NULL,
    '',
    '3-fach Verglasung warme Kante',
    '4',
    src.image_url,
    '0.00',
    '{"heading":"3-fach Verglasung warme Kante","subheading":"Warme Kante Gratis"}',
    '',
    COALESCE(src.base_img, '')
FROM subtabs s
JOIN tab_options src
    ON src.subtab_id = s.id
    AND src.label = '3-Fach Verglasung'
WHERE s.tab_id = 5
    AND LOWER(s.name) LIKE '%isolierglas%'
    AND NOT EXISTS (
        SELECT 1
        FROM tab_options existing
        WHERE existing.subtab_id = s.id
            AND LOWER(existing.label) = LOWER('3-fach Verglasung warme Kante')
    )
LIMIT 1;

-- Rollback:
-- DELETE FROM tab_options
-- WHERE subtab_id IN (
--     SELECT id FROM subtabs WHERE tab_id = 5 AND LOWER(name) LIKE '%isolierglas%'
-- )
-- AND label IN (
--     '2-fach Verglasung Warme Kante',
--     '3-fach Verglasung warme Kante'
-- );
