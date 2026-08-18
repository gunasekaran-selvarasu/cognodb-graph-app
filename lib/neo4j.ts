import neo4j, { Driver } from 'neo4j-driver';

const uri = process.env.COGNODB_URI!;
const user = process.env.COGNODB_USER || 'cognodb';
const password = process.env.COGNODB_PASSWORD!;

let driver: Driver;

declare global {
  // Prevent multiple driver instances in serverless dev/runtime
  var __neo4jDriver: Driver | undefined;
}

if (!global.__neo4jDriver) {
  global.__neo4jDriver = neo4j.driver(
    uri,
    neo4j.auth.basic(user, password),
    {
      maxConnectionPoolSize: 10,
      connectionTimeout: 30000,
      maxConnectionLifetime: 3 * 60 * 1000, // 3 minutes
      connectionAcquisitionTimeout: 30000,
    }
  );
}

driver = global.__neo4jDriver;

export default driver;