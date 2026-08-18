import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local or .env from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.COGNODB_URI;
const user = process.env.COGNODB_USER || 'cognodb';
const password = process.env.COGNODB_PASSWORD;

if (!uri || !password) {
  console.error('Error: COGNODB_URI or COGNODB_PASSWORD is missing in your .env / .env.local file.');
  process.exit(1);
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function seed() {
  const session = driver.session();
  try {
    console.log('Connecting to CognoDB...');
    
    // Clear old test data
    console.log('Clearing existing data...');
    await session.run(`MATCH (n) DETACH DELETE n`);

    console.log('Populating nodes and relationships...');

    const seedCypher = `
      // Create Genres
      CREATE (sciFi:Genre {id: 'g1', name: 'Sci-Fi'})
      CREATE (action:Genre {id: 'g2', name: 'Action'})
      CREATE (drama:Genre {id: 'g3', name: 'Drama'})
      CREATE (crime:Genre {id: 'g4', name: 'Crime'})

      // Create Movies
      CREATE (inception:Movie {id: 'm1', title: 'Inception', releaseYear: 2010, rating: 8.8})
      CREATE (interstellar:Movie {id: 'm2', title: 'Interstellar', releaseYear: 2014, rating: 8.7})
      CREATE (darkKnight:Movie {id: 'm3', title: 'The Dark Knight', releaseYear: 2008, rating: 9.0})
      CREATE (oppenheimer:Movie {id: 'm4', title: 'Oppenheimer', releaseYear: 2023, rating: 8.9})
      CREATE (dunkirk:Movie {id: 'm5', title: 'Dunkirk', releaseYear: 2017, rating: 7.8})
      CREATE (shutterIsland:Movie {id: 'm6', title: 'Shutter Island', releaseYear: 2010, rating: 8.2})
      CREATE (tenet:Movie {id: 'm7', title: 'Tenet', releaseYear: 2020, rating: 7.3})

      // Create People
      CREATE (nolan:Person {id: 'p1', name: 'Christopher Nolan', born: 1970})
      CREATE (dicaprio:Person {id: 'p2', name: 'Leonardo DiCaprio', born: 1974})
      CREATE (cillian:Person {id: 'p3', name: 'Cillian Murphy', born: 1976})
      CREATE (hardy:Person {id: 'p4', name: 'Tom Hardy', born: 1977})
      CREATE (hathaway:Person {id: 'p5', name: 'Anne Hathaway', born: 1982})
      CREATE (bale:Person {id: 'p6', name: 'Christian Bale', born: 1974})
      CREATE (scorsese:Person {id: 'p7', name: 'Martin Scorsese', born: 1942})
      CREATE (markRylance:Person {id: 'p8', name: 'Mark Rylance', born: 1960})
      CREATE (robertPattinson:Person {id: 'p9', name: 'Robert Pattinson', born: 1986})

      // Movie - Genre Relationships
      CREATE (inception)-[:IN_GENRE]->(sciFi)
      CREATE (inception)-[:IN_GENRE]->(action)
      CREATE (interstellar)-[:IN_GENRE]->(sciFi)
      CREATE (interstellar)-[:IN_GENRE]->(drama)
      CREATE (darkKnight)-[:IN_GENRE]->(action)
      CREATE (darkKnight)-[:IN_GENRE]->(crime)
      CREATE (oppenheimer)-[:IN_GENRE]->(drama)
      CREATE (dunkirk)-[:IN_GENRE]->(action)
      CREATE (dunkirk)-[:IN_GENRE]->(drama)
      CREATE (shutterIsland)-[:IN_GENRE]->(drama)
      CREATE (shutterIsland)-[:IN_GENRE]->(crime)
      CREATE (tenet)-[:IN_GENRE]->(sciFi)
      CREATE (tenet)-[:IN_GENRE]->(action)

      // Directing Relationships
      CREATE (nolan)-[:DIRECTED]->(inception)
      CREATE (nolan)-[:DIRECTED]->(interstellar)
      CREATE (nolan)-[:DIRECTED]->(darkKnight)
      CREATE (nolan)-[:DIRECTED]->(oppenheimer)
      CREATE (nolan)-[:DIRECTED]->(dunkirk)
      CREATE (nolan)-[:DIRECTED]->(tenet)
      CREATE (scorsese)-[:DIRECTED]->(shutterIsland)

      // Acting Relationships
      CREATE (dicaprio)-[:ACTED_IN {role: 'Cobb'}]->(inception)
      CREATE (hardy)-[:ACTED_IN {role: 'Eames'}]->(inception)
      CREATE (cillian)-[:ACTED_IN {role: 'Robert Fischer'}]->(inception)

      CREATE (hathaway)-[:ACTED_IN {role: 'Brand'}]->(interstellar)

      CREATE (bale)-[:ACTED_IN {role: 'Bruce Wayne'}]->(darkKnight)
      CREATE (cillian)-[:ACTED_IN {role: 'Scarecrow'}]->(darkKnight)

      CREATE (cillian)-[:ACTED_IN {role: 'J. Robert Oppenheimer'}]->(oppenheimer)

      CREATE (hardy)-[:ACTED_IN {role: 'Farrier'}]->(dunkirk)
      CREATE (cillian)-[:ACTED_IN {role: 'Shivering Soldier'}]->(dunkirk)
      CREATE (markRylance)-[:ACTED_IN {role: 'Mr. Dawson'}]->(dunkirk)

      CREATE (dicaprio)-[:ACTED_IN {role: 'Teddy Daniels'}]->(shutterIsland)
      CREATE (markRylance)-[:ACTED_IN {role: 'Guest'}]->(shutterIsland)

      CREATE (robertPattinson)-[:ACTED_IN {role: 'Neil'}]->(tenet)
    `;

    await session.run(seedCypher);
    console.log('✅ Database successfully seeded!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();