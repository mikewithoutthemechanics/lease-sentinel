-- Phase 2 communications: email, SMS and WhatsApp notification channels
ALTER TABLE notification_queue DROP CONSTRAINT IF EXISTS notification_queue_channel_check;
ALTER TABLE notification_queue ADD CONSTRAINT notification_queue_channel_check CHECK (channel IN ('email', 'sms', 'whatsapp'));
CREATE INDEX IF NOT EXISTS maintenance_notification_template_idx ON notification_queue(template, status, scheduled_for);
