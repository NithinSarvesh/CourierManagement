/**
 * SwiftShip Netlify Functions - Neo4j AuraDB Connection & Serialization
 */
import neo4j from 'neo4j-driver';

let driverInstance = null;

export function getDriver() {
  if (!driverInstance) {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USERNAME || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';

    driverInstance = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionPoolSize: 50,
      connectionTimeout: 15000,
      maxTransactionRetryTime: 15000
    });
  }
  return driverInstance;
}

export async function closeDriver() {
  if (driverInstance) {
    await driverInstance.close();
    driverInstance = null;
  }
}

export function getSession(mode = neo4j.session.WRITE) {
  const database = process.env.NEO4J_DATABASE || 'neo4j';
  const driver = getDriver();
  return driver.session({
    database,
    defaultAccessMode: mode
  });
}

/**
 * Converts Neo4j data structures (integers, datetimes, nodes, relationships)
 * recursively to native JavaScript primitives, objects, and arrays.
 */
export function toNative(val) {
  if (val === null || val === undefined) {
    return val;
  }

  // Neo4j Integer (64-bit)
  if (neo4j.isInt(val)) {
    return val.inSafeRange() ? val.toNumber() : val.toString();
  }

  // Neo4j Temporal types (DateTime, Date, LocalDateTime, Time, LocalTime)
  if (
    neo4j.isDateTime(val) ||
    neo4j.isDate(val) ||
    neo4j.isLocalDateTime(val) ||
    neo4j.isTime(val) ||
    neo4j.isLocalTime(val) ||
    neo4j.isDuration(val)
  ) {
    return val.toString();
  }

  // Neo4j Spatial Point
  if (neo4j.isPoint(val)) {
    return { x: val.x, y: val.y, z: val.z, srid: val.srid };
  }

  // Neo4j Node or Relationship object
  if (typeof val === 'object' && val.properties !== undefined) {
    return toNative(val.properties);
  }

  // Array
  if (Array.isArray(val)) {
    return val.map(item => toNative(item));
  }

  // Plain Object
  if (typeof val === 'object' && val.constructor === Object) {
    const result = {};
    for (const [key, prop] of Object.entries(val)) {
      result[key] = toNative(prop);
    }
    return result;
  }

  return val;
}

/**
 * Executes a Cypher query and returns mapped records as plain JavaScript objects.
 */
export async function runQuery(cypher, params = {}, { write = false } = {}) {
  const session = getSession(write ? neo4j.session.WRITE : neo4j.session.READ);
  try {
    const result = await session.run(cypher, params);
    return result.records.map(record => {
      const row = {};
      for (const key of record.keys) {
        row[key] = toNative(record.get(key));
      }
      return row;
    });
  } finally {
    await session.close();
  }
}

/**
 * Executes a function within a managed Neo4j transaction.
 */
export async function runTransaction(fn, { write = true } = {}) {
  const session = getSession(write ? neo4j.session.WRITE : neo4j.session.READ);
  try {
    if (write) {
      return await session.executeWrite(async tx => {
        const txRun = async (cypher, params = {}) => {
          const res = await tx.run(cypher, params);
          return res.records.map(record => {
            const row = {};
            for (const key of record.keys) {
              row[key] = toNative(record.get(key));
            }
            return row;
          });
        };
        return await fn(txRun);
      });
    } else {
      return await session.executeRead(async tx => {
        const txRun = async (cypher, params = {}) => {
          const res = await tx.run(cypher, params);
          return res.records.map(record => {
            const row = {};
            for (const key of record.keys) {
              row[key] = toNative(record.get(key));
            }
            return row;
          });
        };
        return await fn(txRun);
      });
    }
  } finally {
    await session.close();
  }
}

/**
 * Verifies database connection with a lightweight ping.
 */
export async function pingDatabase() {
  const rows = await runQuery('RETURN 1 AS ping');
  return rows.length > 0 && rows[0].ping === 1;
}
