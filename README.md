# 🎬 CineGraph — Intelligent Talent & Discovery Network

An interactive graph intelligence application built on **CognoDB Cloud** to uncover indirect industry connections, resolve multi-degree collaborative patterns, and deliver relationship-aware content recommendations.

---

## 1. Real-World Problem Solved

Traditional recommendation systems in streaming platforms and talent discovery engines rely on vector similarity or aggregate popularity. This introduces major operational and analytical challenges:

* **The "Cold Start" & Siloed Discovery Problem:** Relational databases treat movies and talent as static rows. Discovering creative clusters—such as actors who repeatedly work with specific directors or second-degree collaborators who frequently share ensembles—requires recursive self-joins across multiple junction tables.
* **Complex Multi-Hop Traversals in SQL:** In an RDBMS, querying *"Find all movies starring actors who have acted alongside Leonardo DiCaprio, but exclude movies DiCaprio himself appeared in"* requires 4+ table joins and self-referencing subqueries. As the database scales, query latency degrades exponentially ($O(N^k)$).
* **Degree of Separation Bottleneck:** Identifying how two industry professionals are connected (e.g., the "Six Degrees" problem) in a relational schema requires recursive Common Table Expressions (CTEs), resulting in full table scans and high memory locks.

### How CineGraph Solves This
CineGraph models the cinematic landscape as a property graph backed by **CognoDB**. By utilizing index-free adjacency:
1. **Traversals execute in constant time $O(k)$** relative to local neighbor degree rather than total table volume.
2. **2-Hop & N-Hop recommendation algorithms** run in single-digit milliseconds to surface hidden collaboration clusters.
3. **Dynamic shortest-path analysis** instantly traces the exact professional chain connecting any two creators.

---

## 2. Why a Graph Database?

| Feature | Relational Schema (PostgreSQL / MySQL) | Graph Database (CognoDB / openCypher) |
| :--- | :--- | :--- |
| **Multi-Hop Traversal** | Deep nested `JOIN` queries across multiple junction tables | Natural path matching: `(p1)-[:ACTED_IN]->()<-[:ACTED_IN]-(p2)` |
| **Shortest Path** | Complex recursive CTEs, heavy CPU/memory overhead | Built-in `shortestPath()` graph algorithm |
| **Schema Evolution** | Rigorous table alterations and foreign key restructuring | Flexible property graph (nodes and edges expand naturally) |
| **Query Readability** | Verbose multi-line SQL with aliases and group-bys | Clean, declarative openCypher pattern matching |

---

## 3. Data Model & Architecture

### Graph Schema (Mermaid.js)

```mermaid
graph LR
    P[Person] -->|:DIRECTED| M[Movie]
    P -->|:ACTED_IN {role}| M
    M -->|:IN_GENRE| G[Genre]
    P -.->|2-Hop Traversal| P
