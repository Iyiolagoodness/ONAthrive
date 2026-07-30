
-- Notify customer on new bid
CREATE OR REPLACE FUNCTION public.notify_on_new_bid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.shipments%ROWTYPE;
BEGIN
  SELECT * INTO s FROM public.shipments WHERE id = NEW.shipment_id;
  IF s.id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    s.customer_id,
    'bid_received',
    'New bid on ' || s.title,
    'You received a bid of NGN ' || to_char(NEW.amount_ngn, 'FM999,999,999') || '.',
    '/shipments/' || s.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_new_bid ON public.bids;
CREATE TRIGGER trg_notify_on_new_bid
AFTER INSERT ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_bid();

-- Notify transporter when their bid is accepted / rejected
CREATE OR REPLACE FUNCTION public.notify_on_bid_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.shipments%ROWTYPE;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'accepted' THEN
    SELECT * INTO s FROM public.shipments WHERE id = NEW.shipment_id;
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.transporter_id,
      'bid_accepted',
      'Your bid was accepted',
      'You won the job "' || COALESCE(s.title, 'shipment') || '". Head to My Jobs to get started.',
      '/jobs'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_bid_status ON public.bids;
CREATE TRIGGER trg_notify_on_bid_status
AFTER UPDATE ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.notify_on_bid_status();

-- Notify both parties on shipment status changes
CREATE OR REPLACE FUNCTION public.notify_on_shipment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t TEXT;
  b TEXT;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'in_transit' THEN
    t := 'Shipment in transit';
    b := '"' || NEW.title || '" is now on the way.';
  ELSIF NEW.status = 'delivered' THEN
    t := 'Shipment delivered';
    b := '"' || NEW.title || '" has been marked delivered.';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (NEW.customer_id, 'shipment_' || NEW.status::text, t, b, '/shipments/' || NEW.id);

  IF NEW.assigned_transporter_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.assigned_transporter_id, 'shipment_' || NEW.status::text, t, b, '/jobs');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_shipment_status ON public.shipments;
CREATE TRIGGER trg_notify_on_shipment_status
AFTER UPDATE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.notify_on_shipment_status();

REVOKE EXECUTE ON FUNCTION public.notify_on_new_bid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_bid_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_shipment_status() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
