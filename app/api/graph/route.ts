import { NextResponse } from 'next/server';
import neo4j from 'neo4j-driver';

const uri = process.env.COGNODB_URI!;
const user = process.env.COGNODB_USER || 'cognodb';
const password = process.env.COGNODB_PASSWORD!;

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'all';
  const personId = searchParams.get('personId') || 'p2';

  const session = driver.session();

  try {
    // Mode 1: 2-Hop Talent Recommendations
    if (mode === 'recommend') {
      const recQuery = `
        MATCH (target:Person {id: $personId})-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(coActor:Person)
        MATCH (coActor)-[:ACTED_IN]->(recMovie:Movie)
        WHERE NOT (target)-[:ACTED_IN]->(recMovie)
        RETURN recMovie.id AS id,
               recMovie.title AS title,
               recMovie.rating AS rating,
               collect(DISTINCT coActor.name) AS coActors,
               count(DISTINCT coActor) AS score
        ORDER BY score DESC, recMovie.rating DESC
        LIMIT 5
      `;
      const result = await session.run(recQuery, { personId });
      const recommendations = result.records.map((r) => ({
        id: r.get('id'),
        title: r.get('title'),
        rating: r.get('rating'),
        coActors: r.get('coActors'),
        score: r.get('score').toNumber ? r.get('score').toNumber() : r.get('score'),
      }));
      return NextResponse.json({ success: true, recommendations });
    }

    // Mode 2: Full Graph for Force-Directed Visualization
    const graphQuery = `
      MATCH (p:Person)-[r:ACTED_IN|DIRECTED]->(m:Movie)
      RETURN p.id AS sourceId, p.name AS sourceName, labels(p)[0] AS sourceType,
             m.id AS targetId, m.title AS targetName, labels(m)[0] AS targetType,
             type(r) AS relType, coalesce(r.role, '') AS role
      LIMIT 100
    `;

    const result = await session.run(graphQuery);
    const nodeMap = new Map<string, { id: string; name: string; type: string }>();
    const links: Array<{ source: string; target: string; type: string; role?: string }> = [];

    result.records.forEach((record) => {
      const sId = record.get('sourceId');
      const tId = record.get('targetId');

      if (!nodeMap.has(sId)) {
        nodeMap.set(sId, { id: sId, name: record.get('sourceName'), type: record.get('sourceType') });
      }
      if (!nodeMap.has(tId)) {
        nodeMap.set(tId, { id: tId, name: record.get('targetName'), type: record.get('targetType') });
      }

      links.push({
        source: sId,
        target: tId,
        type: record.get('relType'),
        role: record.get('role'),
      });
    });

    return NextResponse.json({
      success: true,
      nodes: Array.from(nodeMap.values()),
      links,
    });
  } catch (error: any) {
    console.error('Graph API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await session.close();
  }
}