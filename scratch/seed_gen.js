const fs = require('fs');

const csv = fs.readFileSync('docs/treinos - Exercicios.csv', 'utf8');
const lines = csv.split('\n').filter(line => line.trim() !== '');
const header = lines[0].split(',');

const exercises = new Map();

for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    const id = row[0];
    const name = row[1];
    const group = row[2];
    const pattern = row[3];
    const muscle = row[4];
    const factor = row[5];
    const demand = row[6];
    const classification = row[7];

    if (!exercises.has(name)) {
        exercises.set(name, {
            name,
            pattern,
            classification,
            demand: parseInt(demand),
            muscles: []
        });
    }

    exercises.get(name).muscles.push({
        group,
        muscle,
        factor: parseFloat(factor)
    });
}

let sql = '';

// Upsert exercises
for (const [name, ex] of exercises) {
    sql += `INSERT INTO exercises (name, movement_pattern, classification, neural_demand) 
VALUES ('${name.replace(/'/g, "''")}', '${ex.pattern.replace(/'/g, "''")}', '${ex.classification.replace(/'/g, "''")}', ${ex.demand})
ON CONFLICT (name) DO UPDATE SET 
    movement_pattern = EXCLUDED.movement_pattern,
    classification = EXCLUDED.classification,
    neural_demand = EXCLUDED.neural_demand;\n`;
}

// Get exercise IDs and insert muscles
sql += `\nDO $$\nDECLARE\n    ex_id UUID;\nBEGIN\n`;

for (const [name, ex] of exercises) {
    sql += `    SELECT id INTO ex_id FROM exercises WHERE name = '${name.replace(/'/g, "''")}';\n`;
    for (const m of ex.muscles) {
        sql += `    INSERT INTO exercise_muscles (exercise_id, muscle_group, muscle, series_factor)
    VALUES (ex_id, '${m.group.replace(/'/g, "''")}', '${m.muscle.replace(/'/g, "''")}', ${m.factor})
    ON CONFLICT (exercise_id, muscle) DO UPDATE SET 
        series_factor = EXCLUDED.series_factor,
        muscle_group = EXCLUDED.muscle_group;\n`;
    }
}

sql += `END $$;`;

fs.writeFileSync('supabase/seed_exercises.sql', sql);
console.log('Seed SQL generated: supabase/seed_exercises.sql');
