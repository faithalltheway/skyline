-- Grant ADMIN role to the site owner's real registered account so they can
-- stop relying on the publicly-documented demo admin credentials
-- (admin@onthespot.demo) on production. Scoped to a single known user id so
-- this can never accidentally affect another account.
UPDATE "User"
SET "role" = 'ADMIN'
WHERE "id" = 'cmsza9e770000bsbhuv3huc0u'
  AND "email" = 'staystrong8830@gmail.com';
