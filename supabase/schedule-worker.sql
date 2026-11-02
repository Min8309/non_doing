-- Enable Supabase Cron (pg_cron), pg_net, and Vault in the dashboard first.
-- Create a Vault secret called non_doing_cron_secret with the SAME random value
-- as CRON_SECRET in Vercel. Enter the value in the UI, never commit it to SQL.
-- This schedule calls the protected Vercel endpoint every minute. It does NOT
-- require Vercel Pro cron. Check runtime quotas/pricing in your own accounts.
select cron.schedule(
 'non-doing-letters-every-minute',
 '* * * * *',
 $job$
 select net.http_get(
  url := 'https://nondoing-238b.vercel.app/api/letter-worker',
  headers := jsonb_build_object(
   'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='non_doing_cron_secret'),
   'Content-Type', 'application/json'
  ),
  timeout_milliseconds := 60000
 );
 $job$
);
-- Run once. To change a schedule later, use cron.alter_job or cron.unschedule.
