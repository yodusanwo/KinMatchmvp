-- Remove duplicate tribe rows from failed/partial onboarding saves (keeps oldest per user+name).

WITH duplicate_friends AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, lower(trim(name))
      ORDER BY created_at ASC
    ) AS rn
  FROM public.friends
)
DELETE FROM public.friends
WHERE id IN (SELECT id FROM duplicate_friends WHERE rn > 1);

WITH duplicate_held AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY holder_user_id, held_friend_id
      ORDER BY created_at ASC
    ) AS rn
  FROM public.held_relationships
  WHERE held_friend_id IS NOT NULL
)
DELETE FROM public.held_relationships
WHERE id IN (SELECT id FROM duplicate_held WHERE rn > 1);

WITH duplicate_barriers AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, barrier
      ORDER BY created_at ASC
    ) AS rn
  FROM public.reflection_barriers
)
DELETE FROM public.reflection_barriers
WHERE id IN (SELECT id FROM duplicate_barriers WHERE rn > 1);

SELECT
  (SELECT count(*) FROM public.friends) AS friends_remaining,
  (SELECT count(*) FROM public.held_relationships) AS held_remaining;
