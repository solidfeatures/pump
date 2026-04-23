const fs = require('fs');

let content = fs.readFileSync('./supabase/seed_exercises.sql', 'utf8');

// Replace standard insert
//   (1, 'Bench Press', 'Bench Press', 'Empurrão Horizontal', 'Composto', 4),
content = content.replace(/\((\d+),\s*'/g, (match, id) => {
  const uuid = `00000000-0000-0000-0000-${id.padStart(12, '0')}`;
  return `('${uuid}', '`;
});

// Replace in exercise_muscles
//   (1, 'Peitoral', 'Peitoral Maior', 1),
// But we need to make sure we only replace the first argument. 
// Wait, the previous regex was replacing (1, '... with ('uuid', '...
// This will work for exercise_muscles too because it also has a string as the second argument!
// Let's test it: (1, 'Peitoral', 'Peitoral Maior', 1) -> ('00000000-0000-0000-0000-000000000001', 'Peitoral', 'Peitoral Maior', 1)

fs.writeFileSync('./supabase/seed_exercises_uuid.sql', content);
console.log('Fixed seed file created: supabase/seed_exercises_uuid.sql');
