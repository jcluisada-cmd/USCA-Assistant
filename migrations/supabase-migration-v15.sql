-- ═══ USCA Connect — Migration v15 : Informations de sortie ═══
-- Destination (RAD / post-cure / autre), checklist documents (ordonnance, transport, bulletin, CRH)

ALTER TABLE patients ADD COLUMN IF NOT EXISTS sortie_info JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN patients.sortie_info IS 'Infos sortie : { destination: rad|postcure|autre, postcure_centre: slug, autre_precision: text, checklist: { ordonnance, transport, bulletin, crh } }';
