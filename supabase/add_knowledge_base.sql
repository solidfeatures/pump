-- ============================================================================
-- AI KNOWLEDGE BASE — Antigravity Fitness
-- Execute no SQL Editor do Supabase APÓS o restore.sql.
-- Cria a tabela ai_coaching_rules e insere todas as regras da metodologia
-- de Jayme de Lamadrid. Adicione novas regras diretamente pela UI do Supabase.
-- ============================================================================

-- ── Tabela principal ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_coaching_rules (
  id           SERIAL PRIMARY KEY,
  category     TEXT NOT NULL,
    -- volume | progression | periodization | recovery | frequency
    -- technique | triggers | weak_points | nutrition_context | personal
  title        TEXT NOT NULL,
  rule         TEXT NOT NULL,        -- regra completa em linguagem natural
  source       TEXT DEFAULT 'Jayme de Lamadrid — Musculação para Naturais',
  priority     INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    -- 10 = crítico, IA DEVE seguir | 7-9 = importante | 4-6 = guideline | 1-3 = sugestão
  tags         TEXT[],               -- ex: ['compound','acumulação','quadríceps']
  is_active    BOOLEAN DEFAULT true,
  notes        TEXT,                 -- observações pessoais, exceções descobertas
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaching_rules_category ON ai_coaching_rules(category);
CREATE INDEX IF NOT EXISTS idx_coaching_rules_priority ON ai_coaching_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_coaching_rules_active   ON ai_coaching_rules(is_active);

ALTER TABLE ai_coaching_rules DISABLE ROW LEVEL SECURITY;

-- ── View para a IA consumir (apenas regras ativas, ordenadas por prioridade) ──
CREATE OR REPLACE VIEW v_ai_rules AS
SELECT id, category, title, rule, source, priority, tags, notes
FROM   ai_coaching_rules
WHERE  is_active = true
ORDER  BY priority DESC, category, id;

-- ============================================================================
-- SEED — Regras da Metodologia (Jayme de Lamadrid)
-- ============================================================================

-- ── CATEGORIA: periodization ─────────────────────────────────────────────────
INSERT INTO ai_coaching_rules (category, title, rule, priority, tags) VALUES

('periodization',
 'Estrutura do Macrociclo — Etapa 1: Força e Potência',
 'O macrociclo começa com a Etapa 1 (Força e Potência), composta por: 2 Mesociclos de Acumulação → 1 Mesociclo de Transição → 1-2 Mesociclos de Intensificação → 1 Semana de Teste. O objetivo desta etapa é construir base técnica e tolerância a volume para suportar a Etapa 2.',
 10, ARRAY['macrociclo','etapa1','força']),

('periodization',
 'Estrutura do Macrociclo — Etapa 2: Hipertrofia e Resistência',
 'A Etapa 2 (Hipertrofia e Resistência) sucede a Etapa 1 após os testes de 1RM. É composta por: 4 Mesociclos de Hipertrofia e Resistência → 2 Mesociclos de Hipertrofia Pico. Esta etapa é mais longa e utiliza periodização ondulante misturada com linear inversa.',
 10, ARRAY['macrociclo','etapa2','hipertrofia']),

('periodization',
 'Acumulação — Parâmetros',
 'Fase de Acumulação: 2 mesociclos de ~4 semanas cada. RIR alvo = 2. Distribuição: 40% tensão mecânica (multiarticulares livres) / 60% estresse metabólico (isoladores/máquinas). Lógica: aumentar séries gradativamente a cada semana (periodização linear inversa). Objetivo: melhorar capacidade de trabalho e técnica.',
 9, ARRAY['acumulação','etapa1','volume','rir']),

('periodization',
 'Transição — Parâmetros',
 'Fase de Transição: 1 mesociclo de ~4 semanas. Sem reduzir o volume total, muda-se o foco para exercícios de força. Nova distribuição: 60% tensão mecânica / 40% estresse metabólico. Progressão via redução de descanso ou adição de pausas isométricas, não pelo aumento de carga bruta.',
 9, ARRAY['transição','etapa1','força']),

('periodization',
 'Intensificação — Parâmetros',
 'Fase de Intensificação: 1-2 mesociclos de ~4 semanas. RIR alvo = 1. Distribuição: 70% tensão mecânica / 30% estresse metabólico. Volume total cai em relação à Acumulação; intensidade de carga aumenta significativamente. Foco em exercícios compostos livres e pesados.',
 9, ARRAY['intensificação','etapa1','carga','rir']),

('periodization',
 'Semana de Teste — 1RM e AMRAP',
 'A Etapa 1 termina obrigatoriamente com 1 semana de testes. A IA deve prescrever testes de 1RM (uma repetição máxima) ou AMRAP nos exercícios principais de cada padrão de movimento: Squat, Hinge, Press horizontal, Press vertical, Row, Pull. As novas marcas estabelecem o teto de força para calibrar cargas na Etapa 2.',
 10, ARRAY['teste','1rm','amrap','transição-etapa']),

('periodization',
 'Hipertrofia e Resistência — Meso 1',
 'Meso 1 da Etapa 2: trabalhar com 80% do RM para ter margem de volume. Esquema de progressão por semana: Semana 1 = 8 séries × 2 reps de diferença (ex: 8×2 por exercício). Semana 2 = 6×3. Semana 3 = 5×4. Semana 4 = 4×5. RIR próximo de 0-1. 40% tensão / 60% metabólico.',
 9, ARRAY['hipertrofia','etapa2','meso1','progressão']),

('periodization',
 'Hipertrofia e Resistência — Meso 2',
 'Meso 2 da Etapa 2: progressão estrita por repetições nas Working Sets. Se fez 8 reps na semana 1, tenta 9 na semana 2, 10 na semana 3. A carga permanece a mesma enquanto as reps sobem. RIR 0-1. Este meso consolida o novo patamar de volume antes de introduzir técnicas avançadas.',
 9, ARRAY['hipertrofia','etapa2','meso2','progressão-reps']),

('periodization',
 'Hipertrofia e Resistência — Meso 3 (Drop Set)',
 'Meso 3 da Etapa 2: introduz a técnica Drop Set como principal método de intensidade. O objetivo principal continua sendo acumular mais volume a cada microciclo. A IA deve indicar Drop Set nos exercícios principais de cada grupo muscular no final das Working Sets.',
 9, ARRAY['hipertrofia','etapa2','meso3','drop-set','técnica']),

('periodization',
 'Hipertrofia e Resistência — Meso 4 (Super Set)',
 'Meso 4 da Etapa 2: foco transita para periodização ondulante diária (alternando focos de intensidade na mesma sessão). Introdução de Super Sets, combinando exercícios antagonistas ou agonistas com menor demanda neural compartilhada.',
 9, ARRAY['hipertrofia','etapa2','meso4','super-set','técnica']),

('periodization',
 'Hipertrofia Pico — Meso 1 (Falsa Pirâmide)',
 'Meso 1 da Fase de Hipertrofia Pico: 30% tensão / 70% metabólico. Uso de Falsa Pirâmide (séries crescentes de repetições, ex: 6-8-10-12, reduzindo carga a cada série). Intensidade de esforço brutal, RPE 9-10 na maioria das séries. Maior foco em "pump" de todo o macrociclo.',
 9, ARRAY['hipertrofia-pico','etapa2','meso1','falsa-pirâmide']),

('periodization',
 'Hipertrofia Pico — Meso 2 (Ápice do Volume)',
 'Meso 2 da Fase de Hipertrofia Pico: ápice absoluto do macrociclo. Volume encostando no MRV (20 séries/semana por grupo muscular). RPE 10 na maior parte das séries. Adicionar +1 dia de treino na semana (Full Body ou Pernas/Braços) exclusivamente para suportar este pico de volume. Após este meso, fim do macrociclo (competição, fotos, descanso programado).',
 10, ARRAY['hipertrofia-pico','etapa2','meso2','mrv','frequência']);

-- ── CATEGORIA: triggers ───────────────────────────────────────────────────────
INSERT INTO ai_coaching_rules (category, title, rule, priority, tags) VALUES

('triggers',
 'Gatilho 1: MRV_REACHED — Teto de Volume',
 'QUANDO: volume semanal de qualquer grupo muscular ≥ 20 séries E a tendência de tonelagem mostra estagnação (↔) ou queda (↓). AÇÃO: prescrever deload (redução de 50% do volume na semana seguinte) e avançar da Acumulação para a Intensificação. A IA não deve continuar acumulando volume depois deste gatilho.',
 10, ARRAY['gatilho','mrv','deload','transição-fase']),

('triggers',
 'Gatilho 2: NEURAL_PLATEAU — Estagnação Neural',
 'QUANDO: 2 microciclos consecutivos com estagnação ou queda de performance E dados de recuperação estão bons (sono adequado, energia normal) E volume está moderado (<15 séries/semana — não é overtraining). AÇÃO: se ocorre na Intensificação → acionar Semana de Teste imediatamente (1RM/AMRAP). Após os testes → transição para Etapa 2.',
 10, ARRAY['gatilho','neural','platô','teste','transição-fase']),

('triggers',
 'Gatilho 3: TEMPORAL — Duração Estratégica',
 'QUANDO: contagem de semanas dentro do bloco atinge o limite. Limites: 2 mesos de Acumulação (~8 semanas) → Transição. 1 meso de Transição (~4 semanas) → Intensificação. Meso 3 de Hipertrofia e Resistência → introduzir Drop Set. Meso 4 → introduzir Super Set. O gatilho temporal é um fallback caso MRV_REACHED e NEURAL_PLATEAU não ocorram antes.',
 9, ARRAY['gatilho','temporal','semanas','transição-fase']),

('triggers',
 'Gatilho 4: PEAK_FATIGUE — Fadiga Máxima de Pico',
 'QUANDO: na Fase de Hipertrofia Pico Meso 2, os dados mostram técnicas avançadas em uso (Falsa Pirâmide), volume próximo do MRV, e RPE consistentemente 9-10. AÇÃO: sugerir +1 dia de frequência para suportar o volume. Após conclusão deste meso → declarar fim do macrociclo e recomendar fase de recuperação ativa ou competição/fotos.',
 10, ARRAY['gatilho','fadiga','mrv','frequência','fim-macrociclo']);

-- ── CATEGORIA: volume ─────────────────────────────────────────────────────────
INSERT INTO ai_coaching_rules (category, title, rule, priority, tags) VALUES

('volume',
 'Séries Válidas — Filtro de Working Sets',
 'A IA DEVE contabilizar volume APENAS em séries do tipo Working Set, Top Set ou Back Off Set com RPE ≥ 7. Warming Sets e Feeder Sets contribuem zero ao volume semanal. Séries abaixo de RPE 7 são descartadas do cálculo independente do tipo.',
 10, ARRAY['volume','working-set','rpe','filtro']),

('volume',
 'Series Factor — Exercícios Monoarticulares (Isoladores)',
 'Exercícios isoladores (ex: Rosca Direta, Tríceps Corda, Cadeira Extensora, Elevação Lateral): 100% das séries válidas vão para o grupo muscular primário. Nenhum volume secundário é contabilizado.',
 10, ARRAY['volume','series-factor','isolador','monoarticular']),

('volume',
 'Series Factor — Exercícios Multiarticulares (Compostos)',
 'Exercícios compostos (ex: Supino, Agachamento, Remada, Desenvolvimento): 100% das séries válidas vão para o músculo primário + 50% das séries válidas vão para cada músculo secundário. Exemplo: 4 séries de Supino Reto = +4 Peitoral, +2 Deltóide Anterior, +2 Tríceps.',
 10, ARRAY['volume','series-factor','composto','multiarticular']),

('volume',
 'Subdivisão do Deltóide por Vetor de Movimento',
 'Movimentos de EMPURRAR (Push): volume secundário de ombro vai para Deltóide Anterior. Movimentos de PUXAR (Pull): volume secundário de ombro vai para Deltóide Posterior. Exemplo: Supino → +2 Deltóide Anterior. Remada Curvada → +2 Deltóide Posterior.',
 10, ARRAY['volume','deltóide','push','pull','series-factor']),

('volume',
 'Faixas de Volume Semanal por Grupo Muscular',
 'MEV (Mínimo Efetivo): 10 séries/semana. Zona Ótima: 10-15 séries. Próximo do MRV: 15-20 séries. MRV (Máximo Recuperável): 20 séries — zona de perigo, avaliar deload. Abaixo do MEV o músculo não recebe estímulo suficiente para adaptar.',
 10, ARRAY['volume','mev','mrv','séries-semanais']),

('volume',
 'Volume Lixo — O que NÃO contar',
 'Séries de aquecimento geral, mobilidade, e qualquer série com RPE < 7 não devem ser contadas como volume de treinamento. Séries excessivamente fáceis (RPE < 7) têm valor hipertrófico negligenciável e devem ser descartadas da contabilização.',
 9, ARRAY['volume','filtro','aquecimento']),

('volume',
 'Densidade vs Volume — Progressão por Redução de Descanso',
 'Em certas fases (especialmente Transição), a IA pode prescrever progressão diminuindo o tempo de descanso mantendo carga e reps constantes. Isso aumenta a densidade do treino (mais trabalho por unidade de tempo) sem aumentar volume bruto.',
 7, ARRAY['volume','densidade','descanso','transição']);

-- ── CATEGORIA: progression ───────────────────────────────────────────────────
INSERT INTO ai_coaching_rules (category, title, rule, priority, tags) VALUES

('progression',
 'Prioridade de Progressão — Ordem Obrigatória',
 'A IA DEVE seguir esta ordem de progressão: 1° Repetições (aumentar reps dentro da faixa prescrita) → 2° Peso (aumentar carga quando o topo da faixa de reps é atingido consistentemente) → 3° Volume (adicionar séries apenas quando reps e peso travaram por 2 semanas). Nunca pular etapas.',
 10, ARRAY['progressão','reps','peso','volume','ordem']),

('progression',
 'Progressão Dupla — Definição e Aplicação',
 'Progressão Dupla = ciclar entre aumentar reps e aumentar peso. Funciona assim: se o alvo é 3×8-12, quando conseguir 3×12 com boa técnica → aumentar peso 2-5% na próxima sessão e recomeçar de 3×8. A tonelagem (volume de carga) deve crescer ao longo do tempo, mesmo que não seja a cada sessão.',
 10, ARRAY['progressão','dupla','tonelagem']),

('progression',
 'Estagnação — Árvore de Decisão',
 'Se performance está caindo (menos reps com mesmo peso): fadiga ou MRV — diminuir volume. Se performance está estagnada (mesmas marcas): avaliar contexto. Se treino está fácil (sem pump, recuperação rápida, sono bom) → adicionar 2 séries semanais. Se treino está pesado (dor articular, sono ruim, baixa energia) → deload ou reduzir séries.',
 10, ARRAY['progressão','estagnação','fadiga','deload','decisão']),

('progression',
 'Regra das 2 Semanas — Quando Ajustar Volume',
 'Somente ajustar volume (adicionar ou remover séries) quando a estagnação de reps E peso persistir por 2 microciclos consecutivos. Uma sessão ruim isolada não justifica mudança de volume — pode ser dia de baixa recuperação, sono insuficiente ou estresse externo.',
 9, ARRAY['progressão','volume','ajuste','2-semanas']),

('progression',
 'Tonelagem como Métrica Principal de Progresso',
 'A tonelagem (load_kg × reps) é a métrica mais fiel do trabalho real. Um atleta pode progredir aumentando tonelagem mesmo sem aumentar a carga na barra (ex: mais reps com mesmo peso). A IA deve sempre comparar tonelagem da última sessão com a sessão anterior para classificar: ⬆️ Progressão | ↔️ Estagnado | ⬇️ Regressão.',
 9, ARRAY['tonelagem','progressão','métrica']),

('progression',
 ' 1RM Epley — Equalização entre Faixas de Repetição',
 '1RM estimado = carga × (1 + reps / 30). Permite comparar evolução entre faixas de repetição diferentes. Se o 1RM estimado subiu de 100kg para 105kg, houve ganho de força real, independente de ter feito 5 reps pesadas ou 12 reps moderadas.',
 8, ARRAY['1rm','epley','força','métrica']);

-- ── CATEGORIA: recovery ───────────────────────────────────────────────────────
INSERT INTO ai_coaching_rules (category, title, rule, priority, tags) VALUES

('recovery',
 'Tabela de Descanso por Faixa de Repetição',
 'Regra de ouro: descanso inversamente proporcional ao número de reps. Tabela: ≥10 reps (metabólico) = 1:00-1:45min. 8-9 reps = 1:45-2:15min. 6-7 reps = 2:15-2:45min. 5 reps (força, séries 1-3) = 2:30-3:30min. 5 reps (força, série 4+) = 3:00-4:00min. <5 reps (tensão máxima) = 3:30-4:30min.',
 10, ARRAY['descanso','recuperação','reps','timer']),

('recovery',
 'Descanso Nunca Prejudica a Série Seguinte',
 'O tempo de descanso não deve ser um fator que prejudique o rendimento da próxima série, exceto quando a IA acionar especificamente uma progressão por redução de densidade. Encurtar o descanso sem intenção explícita é um erro — compromete a qualidade das séries subsequentes.',
 9, ARRAY['descanso','qualidade','série']),

('recovery',
 'Deload — Protocolo de Aplicação',
 'Deload = reduzir volume em 50% mantendo intensidade relativa similar. Deve ser prescrito quando: MRV_REACHED for acionado, performance caindo com volume moderado, atleta relata dor articular ou fadiga excessiva acumulada. Duração: 1 semana. Após deload, reiniciar com volume MEV e progredir.',
 9, ARRAY['deload','recuperação','volume','fadiga']);

-- ── CATEGORIA: frequency ─────────────────────────────────────────────────────
INSERT INTO ai_coaching_rules (category, title, rule, priority, tags) VALUES

('frequency',
 'Frequência Base — 3 a 4 Dias por Semana',
 'Para a maioria dos atletas naturais, 3-4 dias de treino por semana é o sweet spot. Permite condensar volume em sessões produtivas com recuperação adequada (muscular, articular e neural). Evitar diluir volume em 5-6 dias para fazer poucos exercícios por dia — prejudica aderência e recuperação nervosa.',
 10, ARRAY['frequência','4-dias','recuperação']),

('frequency',
 'Divisão Recomendada — Upper/Lower ou Push/Pull/Legs',
 'Modelos de divisão preferidos para 4 dias: Upper/Lower (segunda, terça, quinta, sexta) ou Push/Pull/Legs+Upper. Intercalar dias de descanso é obrigatório — nunca 4 dias consecutivos sem descanso. Para grupos musculares grandes (costas, pernas), considerar frequência 2x/semana dividindo o volume total.',
 8, ARRAY['frequência','divisão','upper-lower','push-pull']),

('frequency',
 'Frequência 2 — Quando Dividir Músculo em 2 Dias',
 'Dividir o volume de um grupo muscular em 2 sessões semanais quando: o volume semanal total excede o que pode ser feito com qualidade em uma única sessão, especialmente para grupos grandes (costas, pernas). Aplicar Upper/Lower ou Full Body para acomodar esta divisão sem comprometer a recuperação.',
 8, ARRAY['frequência','frequência-2','divisão','volume']),

('frequency',
 '+1 Dia de Frequência — Apenas no Pico Final',
 'A única exceção para adicionar um dia extra de treino na semana é no Mesociclo 2 da Fase de Hipertrofia Pico, quando o atleta encosta no MRV com RPE 10. Neste momento específico, adicionar 1 dia de Full Body ou Pernas/Braços para suportar o volume de pico. Fora desta situação, manter 3-4 dias.',
 10, ARRAY['frequência','+1-dia','hipertrofia-pico','mrv']);

-- ── CATEGORIA: technique ─────────────────────────────────────────────────────
INSERT INTO ai_coaching_rules (category, title, rule, priority, tags) VALUES

('technique',
 'Drop Set — Aplicação Correta',
 'Drop Set: ao final de uma Working Set, reduzir a carga (geralmente 15-20%) e continuar imediatamente sem descanso. Conta como séries adicionais de volume. Introduzir no Meso 3 da Etapa 2. Usar principalmente no último exercício de cada grupo muscular na sessão para maximizar recrutamento sem comprometer as séries principais anteriores.',
 8, ARRAY['drop-set','técnica','meso3']),

('technique',
 'Super Set — Aplicação Correta',
 'Super Set: realizar dois exercícios em sequência sem descanso completo entre eles. Mais eficiente com antagonistas (ex: bíceps + tríceps, peito + costas) ou músculos de baixa competição neural. Introduzir no Meso 4 da Etapa 2. Permite maior densidade de treino sem sacrificar performance nos principais movimentos.',
 8, ARRAY['super-set','técnica','meso4','antagonistas']),

('technique',
 'Falsa Pirâmide — Aplicação Correta',
 'Falsa Pirâmide: séries com reps crescentes e carga decrescente. Exemplo: 4 séries com progressão 6-8-10-12 reps, reduzindo a carga a cada série para manter qualidade técnica. Gera estresse metabólico acumulado alto. Usar na Fase de Hipertrofia Pico Meso 1 com RPE 9-10 em todas as séries.',
 8, ARRAY['falsa-pirâmide','técnica','hipertrofia-pico']),

('technique',
 'Rest-Pause — Uso Ocasional',
 'Rest-Pause: dentro de uma série, fazer uma micro-pausa de 10-15 segundos ao atingir falha técnica e continuar por mais algumas repetições. Aumenta volume total por série. Usar com cautela — alto custo de recuperação. Reservar para fases de pico de intensidade.',
 6, ARRAY['rest-pause','técnica','intensidade']),

('technique',
 'Pausa Isométrica — Progressão na Transição',
 'Pausas isométricas (segurar a posição de maior tensão por 1-3 segundos) são o principal método de progressão na Fase de Transição quando volume e carga não sobem. Ex: Agachamento com pausa no fundo, Supino com barra no peito. Aumenta tempo sob tensão sem elevar carga absoluta.',
 7, ARRAY['isométrica','pausa','transição','técnica']);

-- ── CATEGORIA: weak_points ───────────────────────────────────────────────────
INSERT INTO ai_coaching_rules (category, title, rule, priority, tags) VALUES

('weak_points',
 'Ponto Fraco — Protocolo Sequencial de Correção',
 'Antes de simplesmente adicionar volume para um ponto fraco, a IA deve seguir esta sequência: 1) Filtro de experiência (apenas intermediários/avançados). 2) Auditoria técnica (verificar padrão de movimento). 3) Reposicionamento (mover o exercício para o início da sessão). 4) Frequência 2 (dividir volume em 2 dias). Apenas se tudo isso falhar → aumentar séries totais.',
 8, ARRAY['ponto-fraco','protocolo','volume','técnica']),

('weak_points',
 'Iniciantes — Não Aplicar Correção de Ponto Fraco',
 'Para iniciantes com 2-4 músculos "fracos", a IA NÃO deve prescrever ajuste isolado de volume. A resposta correta é desenvolvimento geral do físico. Ajuste fino de volume para grupos atrasados é estratégia exclusiva de intermediários e avançados.',
 9, ARRAY['ponto-fraco','iniciante','experência']),

('weak_points',
 'Reposicionamento — Exercício Fraco no Início',
 'Mover o exercício do grupo muscular fraco para o início da sessão é a primeira intervenção prática. O rendimento é máximo no início do treino — pré-fadiga já compromete a qualidade do estímulo. Esta ação sozinha frequentemente resolve o problema sem adicionar volume.',
 8, ARRAY['ponto-fraco','ordem','sessão']),

('weak_points',
 'Fatores Genéticos e Estruturais — Limitações Reais',
 'Inserções musculares, formato ósseo e alavancas articulares são imutáveis e podem limitar a estética final de certos músculos. A IA deve alertar o atleta quando um "ponto fraco" pode ser explicado por fatores estruturais para gerenciar expectativas e evitar volume desnecessário em busca de resultado impossível.',
 7, ARRAY['genética','estrutural','ponto-fraco','expectativas']);

-- ── CATEGORIA: nutrition_context (base para cruzamento futuro) ───────────────
INSERT INTO ai_coaching_rules (category, title, rule, priority, tags) VALUES

('nutrition_context',
 'Sinal de Baixa Energia — Indicador de Nutrição Insuficiente',
 'Se energy_level (de body_metrics) estiver consistentemente abaixo de 6/10 e performance estiver caindo, pode ser déficit calórico severo ou baixo carboidrato pré-treino. A IA deve considerar este fator antes de prescrever mais volume ou reduzir cargas — sinalizar ao atleta que nutrição pode ser o limitador.',
 7, ARRAY['nutrição','energia','performance','body-metrics']),

('nutrition_context',
 'Sono e Recuperação — Threshold Mínimo',
 'Sono abaixo de 6h/noite (sleep_hours em body_metrics) é um sinal de alerta. Com sleep_hours < 6 consistentemente, não aumentar volume nem intensidade — manter o atual ou reduzir. Recuperação inadequada torna qualquer progressão contraproducente.',
 8, ARRAY['sono','recuperação','body-metrics','volume']);
