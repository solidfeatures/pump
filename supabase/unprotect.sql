-- ====================================================================================
-- Script: unprotect.sql
-- Descrição: Desativa e remove as proteções contra comandos DROP no banco de dados.
-- Aviso: Use isso apenas quando precisar deletar tabelas/views ativamente.
-- ====================================================================================

-- Opção 1: Desativar temporariamente (Remova os comentários para usar)
-- Isso mantém o gatilho no banco, mas ele não será acionado.
-- ALTER EVENT TRIGGER abort_unexpected_drop DISABLE;
-- [SEUS COMANDOS DROP AQUI]
-- ALTER EVENT TRIGGER abort_unexpected_drop ENABLE;

-- ====================================================================================

-- Opção 2: Remoção Definitiva (Ativo por padrão neste script)
-- Isso remove permanentemente a barreira de proteção.

-- 1. Remove o Event Trigger
DROP EVENT TRIGGER IF EXISTS abort_unexpected_drop;

-- 2. Remove a função bloqueadora associada
DROP FUNCTION IF EXISTS protect_critical_objects();

-- Nota: Para reativar a proteção no futuro, será necessário executar o script 
-- que cria a função e o gatilho novamente.


-- =============================================
-- REATIVAR
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
CREATE EVENT TRIGGER trg_protect_schema
ON sql_drop
EXECUTE FUNCTION protect_critical_objects();