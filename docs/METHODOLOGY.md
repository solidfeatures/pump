# Metodologia de Treinamento — Antigravity Fitness

Baseado em **Jayme de Lamadrid — *Musculação para Naturais***.  
Este documento é a referência técnica completa para a IA de planejamento de treinos.  
A IA **SEMPRE** deve cruzar este documento com os dados históricos reais do atleta (`v_exercise_progress`, `v_weekly_volume`, `v_ai_context`) antes de prescrever qualquer sessão ou ajuste.

---

## 1. Princípio Fundamental

Periodização por blocos como base, com recheios de periodização ondulatória e linear para otimizar os estímulos de hipertrofia ao longo do tempo. Para o atleta natural, **a recuperação é o que garante a supercompensação** — volume sem recuperação adequada é volume lixo.

---

## 2. Estrutura do Macrociclo

O macrociclo anual é dividido em duas etapas estratégicas:

```
ETAPA 1 — Força e Potência
  ├─ Acumulação    (2 mesos × ~4 semanas)
  ├─ Transição     (1 meso  × ~4 semanas)
  ├─ Intensificação (1-2 mesos × ~4 semanas)
  └─ Semana de Teste (1 semana)

ETAPA 2 — Hipertrofia e Resistência
  ├─ Hipertrofia e Resistência (4 mesos × ~4 semanas)
  │    Meso 1: 80% RM, esquema 8×2→6×3→5×4→4×5
  │    Meso 2: Progressão por reps (8→9→10 por semana)
  │    Meso 3: Drop Set como técnica principal
  │    Meso 4: Super Set + periodização ondulante diária
  └─ Hipertrofia Pico (2 mesos × ~4 semanas)
       Meso 1: Falsa Pirâmide, RPE 9-10
       Meso 2: Ápice do volume (MRV), +1 dia/semana, RPE 10
```

---

## 3. Parâmetros por Fase

### Etapa 1 — Força e Potência

| Fase | Duração | RIR Alvo | Distribuição | Foco de Progressão |
|------|---------|----------|--------------|-------------------|
| Acumulação | 2 × ~4 sem | 2 | 40% tensão / 60% metabólico | Aumentar séries semanalmente (linear inversa) |
| Transição | 1 × ~4 sem | 2 | 60% tensão / 40% metabólico | Reduzir descanso ou adicionar pausas isométricas |
| Intensificação | 1-2 × ~4 sem | 1 | 70% tensão / 30% metabólico | Aumentar carga absoluta |
| Semana de Teste | 1 semana | 0 | — | 1RM ou AMRAP em todos os exercícios principais |

### Etapa 2 — Hipertrofia

| Fase | RIR Alvo | Distribuição | Técnica de Intensidade |
|------|----------|--------------|----------------------|
| Hipertrofia e Resistência (M1-M4) | 0–1 | 40% tensão / 60% metabólico | Normal → Drop Set (M3) → Super Set (M4) |
| Hipertrofia Pico (M1) | ~0 | 30% tensão / 70% metabólico | Falsa Pirâmide |
| Hipertrofia Pico (M2) | ~0 | 30% tensão / 70% metabólico | Volume máximo (MRV), RPE 10 |

**Tensão mecânica** = exercícios multiarticulares livres (Squat, Deadlift, Bench, Row, OHP)  
**Estresse metabólico** = isoladores e máquinas (Leg Extension, Cable Fly, Lateral Raise, etc.)

---

## 4. Gatilhos de Transição de Fase

A IA monitora **4 gatilhos** continuamente e age automaticamente quando acionados:

### Gatilho 1: MRV_REACHED
```
CONDIÇÃO:
  volume_semanal[grupo_muscular] >= 20 séries
  AND tendência_tonelagem IN ('↔️ Estagnado', '⬇️ Regressão')

AÇÃO:
  → Prescrever deload (-50% volume, semana seguinte)
  → Avançar: Acumulação → Intensificação
```

### Gatilho 2: NEURAL_PLATEAU
```
CONDIÇÃO:
  semanas_estagnadas >= 2 consecutivas
  AND energy_level >= 6/10 (recuperação boa)
  AND sleep_hours >= 6
  AND volume_semanal < 15 séries (não é overtraining)

AÇÃO:
  → Se fase atual = Intensificação: acionar Semana de Teste (1RM/AMRAP)
  → Após os testes: transição para Etapa 2
```

### Gatilho 3: TEMPORAL
```
CONDIÇÃO: semanas na fase atual >= limite temporal

MAPEAMENTO:
  Acumulação:    2 mesos completados (~8 semanas) → Transição
  Transição:     1 meso completado  (~4 semanas) → Intensificação
  Intensificação: 2 mesos completados → Semana de Teste
  H&R Meso 3:   semana 9-12 da fase → ativar Drop Set
  H&R Meso 4:   semana 13-16 da fase → ativar Super Set

NOTA: TEMPORAL é fallback; MRV_REACHED e NEURAL_PLATEAU têm precedência.
```

### Gatilho 4: PEAK_FATIGUE
```
CONDIÇÃO:
  fase_atual = 'Hipertrofia_Pico' AND meso_number = 2
  AND volume_semanal próximo de 20 séries (MRV)
  AND avg_rpe >= 9 nas últimas 2 semanas
  AND técnicas avançadas em uso (Falsa Pirâmide)

AÇÃO:
  → Prescrever +1 dia de treino na semana (Full Body ou Pernas/Braços)
  → Após conclusão do meso: declarar fim do macrociclo
  → Recomendar: competição / fotos / deload prolongado / início de novo macrociclo
```

---

## 5. Cálculo de Volume

### 5.1 Séries Válidas (Working Sets)
Contar apenas: `set_type IN ('Working Set', 'Top Set', 'Back Off Set')` **E** `rpe >= 7`.  
Warming Set e Feeder Set = contribuição zero ao volume.

### 5.2 Series Factor (Distribuição por Músculo)

| Tipo de Exercício | Músculo Primário | Músculos Secundários |
|------------------|-----------------|---------------------|
| Monoarticular (isolador) | 1.0 × séries | — |
| Multiarticular (composto) | 1.0 × séries | 0.5 × séries cada |

**Subdivisão do Deltóide:**
- Movimento de **Push** (Supino, Desenvolvimento, Fly) → volume secundário = Deltóide Anterior
- Movimento de **Pull** (Remada, Pulldown, Face Pull) → volume secundário = Deltóide Posterior

**Exemplos:**
```
4 séries válidas de Supino Reto:
  → +4 Peitoral (primário)
  → +2 Deltóide Anterior (secundário)
  → +2 Tríceps (secundário)

4 séries válidas de Agachamento Livre:
  → +4 Quadríceps (primário)
  → +2 Glúteo (secundário)
  → +2 Isquiotibiais (secundário)

3 séries válidas de Tríceps Corda:
  → +3 Tríceps (primário único)
```

### 5.3 Faixas de Volume Semanal

| Status | Séries/semana | Ação da IA |
|--------|--------------|------------|
| `SEM_TREINO` | 0–4 | Músculo não recebe estímulo |
| `VOLUME_BAIXO` | 5–9 | Abaixo do MEV — aumentar |
| `ZONA_OTIMA` | 10–14 | Manter e progredir |
| `PROXIMO_MRV` | 15–19 | Monitorar recuperação |
| `MRV_ATINGIDO` | 20+ | Acionar Gatilho 1 |

---

## 6. Progressão de Carga

### 6.1 Prioridade (nunca pular etapas)
```
1° REPETIÇÕES — aumentar reps dentro da faixa prescrita
2° PESO       — aumentar carga quando topo da faixa é atingido
3° VOLUME     — adicionar séries apenas após 2 semanas travadas
```

### 6.2 Progressão Dupla
Ciclar entre reps e peso. Exemplo com alvo 3×8-12:
```
Sessão A: 3×8 @ 80kg (base)
Sessão B: 3×9 @ 80kg (reps ↑)
Sessão C: 3×10 @ 80kg (reps ↑)
Sessão D: 3×12 @ 80kg (topo da faixa atingido)
Sessão E: 3×8 @ 84kg  (peso ↑, reps resetam)
```

### 6.3 Árvore de Decisão para Estagnação

```
performance_caindo (menos reps com mesmo peso)?
  ├── SIM → fadiga ou MRV → DIMINUIR VOLUME
  └── NÃO (performance travada)
        ├── treino fácil (sem pump, recuperação rápida, sono bom)?
        │     └── SIM → ADICIONAR 2 SÉRIES SEMANAIS
        └── treino pesado (dor articular, cansaço, sono ruim)?
              └── SIM → DELOAD ou REDUZIR SÉRIES

Esperar 2 microciclos consecutivos estagnados antes de agir.
Uma sessão ruim isolada ≠ estagnação.
```

### 6.4 Métricas de Progresso

| Métrica | Fórmula | Uso |
|---------|---------|-----|
| Tonelagem | `load_kg × reps` | Métrica principal — work output por sessão |
| 1RM Epley | `load_kg × (1 + reps / 30)` | Iguala progresso entre faixas de reps |
| Status | `last_tonnage vs prev_tonnage` | `⬆️ Progressão` / `↔️ Estagnado` / `⬇️ Regressão` |
| Média 4 sessões | `AVG(últimas 4 tonelagens)` | Suaviza outliers, revela tendência real |

---

## 7. Tempos de Descanso

Regra geral: **inversamente proporcional ao número de reps**.

| Reps Alvo | Descanso | Tipo de Trabalho |
|-----------|----------|-----------------|
| ≥ 10 | 1:00 – 1:45 min | Foco metabólico (isoladores/máquinas) |
| 8–9 | 1:45 – 2:15 min | Hipertrofia padrão |
| 6–7 | 2:15 – 2:45 min | Hipertrofia/força |
| 5 (séries 1-3) | 2:30 – 3:30 min | Trabalho de força |
| 5 (série 4+) | 3:00 – 4:00 min | Força — fadiga acumulada |
| < 5 | 3:30 – 4:30 min | Tensão máxima (compostos pesados) |

**Exceção:** Progressão por densidade — a IA pode prescrever redução intencional do descanso (ex: de 1:45 para 1:30) mantendo carga, como método de progressão na Fase de Transição.

---

## 8. Frequência de Treino

- **Base:** 3–4 dias/semana para a maioria dos atletas naturais
- **Divisão preferida:** Upper/Lower ou Push/Pull/Legs+Upper
- **Intercalar descanso:** nunca 4+ dias consecutivos sem descanso
- **Frequência 2** (músculo 2x/semana): aplicar quando volume do grupo é alto demais para uma sessão (ex: costas, pernas)
- **+1 dia extra:** APENAS no Hipertrofia Pico Meso 2 para suportar o volume de pico

Mais dias de treino **não significa mais resultado** para o natural. Condensar volume em sessões produtivas com recuperação adequada supera diluir em muitos dias com pouco trabalho por sessão.

---

## 9. Técnicas de Intensidade

| Técnica | Quando Usar | Como Aplicar |
|---------|-------------|--------------|
| **Drop Set** | H&R Meso 3+ | Reduzir carga 15-20% ao atingir falha técnica, continuar sem pausa |
| **Super Set** | H&R Meso 4+ | Combinar exercícios antagonistas (bíceps+tríceps) sem descanso completo |
| **Falsa Pirâmide** | Hipertrofia Pico M1 | Séries crescentes em reps com carga decrescente (6-8-10-12) |
| **Rest-Pause** | Pico de intensidade | Micro-pausa de 10-15s ao atingir falha, continuar por mais reps |
| **Pausa Isométrica** | Fase de Transição | Segurar posição de máxima tensão 1-3s por rep (Squat no fundo, Bench no peito) |

---

## 10. Protocolo de Correção de Pontos Fracos

Sequência **obrigatória** antes de adicionar volume:

```
1. FILTRO DE EXPERIÊNCIA
   Iniciante com músculos fracos? → Prescrever desenvolvimento geral, NÃO ajuste isolado.
   Intermediário/Avançado? → Prosseguir.

2. AUDITORIA TÉCNICA
   O padrão de movimento está correto? Escápulas, path da barra, profundidade, etc.
   Verificar fatores estruturais/genéticos (inserções, alavancas) que limitam estética.

3. REPOSICIONAMENTO
   Mover exercício do músculo fraco para o INÍCIO da sessão.
   (Rendimento máximo + sem pré-fadiga = melhor estímulo)

4. FREQUÊNCIA 2
   Dividir volume em 2 sessões semanais.
   Nunca empilhar todas as séries extras em um único dia.
   Adicionar sessão de Full Body ou Upper/Lower para acomodar.
```

---

## 11. Cruzamento com Dados do Atleta

A IA **DEVE** consultar as seguintes fontes antes de qualquer prescrição:

### Tabelas e Views obrigatórias
```sql
-- Status de volume atual por músculo
SELECT * FROM v_ai_context;

-- Progresso por exercício (última vs sessão anterior)
SELECT * FROM v_exercise_progress WHERE exercise_id = $1;

-- Volume das últimas semanas por músculo
SELECT * FROM v_weekly_volume
WHERE week_start >= CURRENT_DATE - INTERVAL '8 weeks'
ORDER BY muscle, week_start;

-- Regras da base de conhecimento (ordenadas por prioridade)
SELECT * FROM v_ai_rules;

-- Dados de recuperação e estado do atleta
SELECT * FROM body_metrics ORDER BY date DESC LIMIT 14;

-- Alertas clínicos ativos
SELECT * FROM clinical_alerts WHERE status_summary = 'ativo';
```

### Lógica de Cruzamento
1. **Volume atual** (v_ai_context) → identificar grupos em MRV, PROXIMO_MRV, VOLUME_BAIXO
2. **Progressão por exercício** (v_exercise_progress) → detectar Estagnação ou Regressão
3. **Recuperação** (body_metrics) → calibrar volume e intensidade
4. **Regras ativas** (v_ai_rules, priority ≥ 7) → aplicar à prescrição
5. **Alertas clínicos** → excluir exercícios contraindicados

**Exemplo de prescrição contextualizada:**
```
v_ai_context → Peitoral: ZONA_OTIMA (12 séries), Bíceps: VOLUME_BAIXO (6 séries)
v_exercise_progress → Supino: ⬆️ Progressão, Rosca Direta: ↔️ Estagnado
body_metrics → sleep_hours: 5.5 (ALERTA), energy_level: 5

Decisão da IA:
- Não aumentar volume total (sono < 6h)
- Reposicionar Rosca Direta para início da sessão
- Manter volume de Supino (progredindo bem)
- Alertar sobre o sono como fator limitante
```

---

## 12. Base de Conhecimento Dinâmica (ai_coaching_rules)

A tabela `ai_coaching_rules` no banco de dados contém todas as regras desta metodologia em formato estruturado. O atleta pode adicionar novas regras a qualquer momento via Supabase Table Editor.

### Estrutura da tabela
```
category    — volume | progression | periodization | recovery | frequency |
               technique | triggers | weak_points | nutrition_context | personal
title       — nome da regra (para identificação rápida)
rule        — regra completa em linguagem natural (contexto para a IA)
source      — origem do conhecimento
priority    — 1-10 (10 = crítico, IA DEVE seguir; 1-3 = sugestão opcional)
tags        — array de tags para filtragem (ex: ['compound','acumulação'])
is_active   — true/false (desativar sem deletar)
notes       — observações pessoais, exceções descobertas na prática
```

### Como adicionar uma nova regra
1. Abrir Supabase → Table Editor → `ai_coaching_rules`
2. Clicar em **Insert row**
3. Preencher: `category`, `title`, `rule`, `priority`, `tags`
4. Salvar — a IA usará a regra na próxima prescrição

### Como desativar uma regra
Setar `is_active = false`. A regra fica no histórico mas não é consumida pela IA.

### View de consumo pela IA
```sql
SELECT * FROM v_ai_rules;
-- Retorna apenas regras ativas, ordenadas por priority DESC
```

---

## 13. Lesões e Restrições (clinical_alerts)

A tabela `clinical_alerts` permite registrar alertas clínicos com:
- `type` — tipo de lesão/restrição (ex: 'Tendinite', 'Dor Articular', 'Pós-cirúrgico')
- `body_region` — região afetada (ex: 'Ombro Direito', 'Joelho Esquerdo')
- `status_summary` — 'ativo' | 'resolvido' | 'monitorando'
- `recommendation` — instrução para a IA (ex: 'Evitar supino com barra, usar halteres')
- `alert_flag` — 'CRITICAL' | 'WARNING' | 'INFO'

A IA **NUNCA** deve prescrever exercícios contraindicados em alertas com `status_summary = 'ativo'` e `alert_flag = 'CRITICAL'`.

---

## 14. Governança de Banco de Dados e Segurança da IA

Para evitar perda de dados e corrupção do esquema (especialmente views e triggers não mapeados pelo Prisma):

1.  **Proibição de `db push`**: O comando `prisma db push` é proibido em ambientes que não sejam de teste isolado. Ele tenta sincronizar o banco ignorando migrações e pode deletar objetos vitais.
2.  **Fluxo de Migração Obrigatório**: Use sempre `npx prisma migrate dev --create-only`. O arquivo SQL gerado deve ser revisado manualmente pelo atleta/desenvolvedor.
3.  **Proteção Estrutural**: O banco utiliza um sistema de IDs inteiros (`SERIAL`) e diversas `VIEW`s customizadas. O Prisma deve ser configurado para respeitar esses tipos (ex: usar `Decimal` para valores monetários/pesos e `Int` para chaves).
4.  **Event Triggers**: Um Event Trigger SQL foi implementado para bloquear comandos `DROP` acidentais em tabelas e views críticas. Para realizar mudanças estruturais legítimas, o trigger deve ser desabilitado temporariamente pelo administrador.

---

## 15. Considerações Finais para a IA

1. **Dados reais > regras fixas.** Sempre calibrar prescrições pelos dados históricos reais do atleta, não apenas pelos parâmetros fixos da metodologia.
2. **Contexto de recuperação primeiro.** Antes de aumentar qualquer variável, verificar sono, energia e peso corporal recentes.
3. **Conservador em caso de dúvida.** Quando o contexto for ambíguo, preferir manutenção a progressão agressiva — é mais fácil adicionar estímulo do que recuperar de overtraining.
4. **Documentar raciocínio.** Registrar o motivo de cada prescrição no campo `ai_notes` de `planned_sessions` para rastreabilidade.
5. **Atualizar regras ao observar padrões.** Se um padrão de resposta ao treinamento for observado e não estiver nas regras, sugerir ao atleta adicionar uma nova entrada em `ai_coaching_rules`.
