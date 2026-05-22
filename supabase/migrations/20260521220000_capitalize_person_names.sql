-- Title-case stored person names (friends + users).
UPDATE public.friends
SET name = initcap(trim(regexp_replace(name, '\s+', ' ', 'g')))
WHERE name IS NOT NULL
  AND name <> initcap(trim(regexp_replace(name, '\s+', ' ', 'g')));

UPDATE public.users
SET name = initcap(trim(regexp_replace(name, '\s+', ' ', 'g')))
WHERE name IS NOT NULL
  AND name <> initcap(trim(regexp_replace(name, '\s+', ' ', 'g')));
