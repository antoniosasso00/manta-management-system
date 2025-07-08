-- Aggiunge colonna image alla tabella users se non esiste già
-- Eseguire manualmente sul database di produzione Netlify

-- Controllo se la colonna esiste già
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'image'
        AND table_schema = 'public'
    ) THEN
        -- Aggiunge la colonna image se non esiste
        ALTER TABLE "users" ADD COLUMN "image" TEXT;
        RAISE NOTICE 'Colonna image aggiunta alla tabella users';
    ELSE
        RAISE NOTICE 'Colonna image già esistente nella tabella users';
    END IF;
END $$;