import fs from 'fs';
import path from 'path';

const csvPath = 'c:/Projetos/pump/docs/treinos - Exercicios.csv';
const outputPath = 'c:/Projetos/pump/supabase/seed_exercises.sql';

function escape(str: string) {
  return str.replace(/'/g, "''");
}

function run() {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const headers = lines[0].split(',');
  
  const exercises = new Map<number, any>();
  const muscles: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const id = parseInt(values[0]);
    const name = values[1];
    const group = values[2];
    const movementPattern = values[3];
    const muscle = values[4];
    const seriesFactor = parseFloat(values[5]);
    const neuralDemand = parseInt(values[6]);
    const classification = values[7];

    if (!exercises.has(id)) {
      exercises.set(id, {
        id,
        name,
        nameEn: name, // Using same name as EN for now
        movementPattern,
        classification,
        neuralDemand
      });
    }

    muscles.push({
      exerciseId: id,
      muscleGroup: group,
      muscle,
      seriesFactor
    });
  }

  let sql = '-- Seed exercises generated from CSV\n\n';

  sql += 'INSERT INTO exercises (id, name, name_en, movement_pattern, classification, neural_demand)\nVALUES\n';
  const exerciseRows = Array.from(exercises.values()).map(ex => {
    return `  (${ex.id}, '${escape(ex.name)}', '${escape(ex.nameEn)}', '${escape(ex.movementPattern)}', '${escape(ex.classification)}', ${ex.neuralDemand})`;
  });
  sql += exerciseRows.join(',\n') + '\n';
  sql += `ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  movement_pattern = EXCLUDED.movement_pattern,
  classification = EXCLUDED.classification,
  neural_demand = EXCLUDED.neural_demand;

-- Inserir mapeamentos de músculos
INSERT INTO exercise_muscles (exercise_id, muscle_group, muscle, series_factor)
VALUES
`;

  const muscleRows = muscles.map(m => {
    return `  (${m.exerciseId}, '${escape(m.muscleGroup)}', '${escape(m.muscle)}', ${m.seriesFactor})`;
  });
  sql += muscleRows.join(',\n') + '\n';
  sql += 'ON CONFLICT (exercise_id, muscle) DO NOTHING;\n';

  fs.writeFileSync(outputPath, sql);
  console.log(`Seed file generated at ${outputPath}`);
}

run();
