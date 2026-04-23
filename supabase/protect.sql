-- =============================================
-- REATIVAR SEGURANÇA
-- ============================================= 

-- Função para bloquear o DROP de objetos específicos
CREATE OR REPLACE FUNCTION protect_critical_objects()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
    LOOP
        -- Lista de tabelas e views protegidas
        IF obj.object_name IN ('ai_coaching_rules', 'exercises', 'v_ai_context', 'workout_sets') THEN
            RAISE EXCEPTION 'BLOQUEIO DE SEGURANÇA: O objeto % é crítico e não pode ser deletado via automação.', obj.object_name;
        END IF;
    END LOOP;
END;
$$;
-- Cria o trigger que dispara em qualquer tentativa de DROP
DROP EVENT TRIGGER IF EXISTS trg_protect_schema;
CREATE EVENT TRIGGER trg_protect_schema
ON sql_drop
EXECUTE FUNCTION protect_critical_objects();
