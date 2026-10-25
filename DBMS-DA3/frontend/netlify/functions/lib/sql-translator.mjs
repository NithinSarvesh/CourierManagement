/**
 * SwiftShip Netlify Functions - SQL-to-Cypher Translator & Validator
 * Translates a secure, strictly read-only subset of ANSI SQL into parameterized Neo4j Cypher queries.
 * Validates tables, columns, joins, operators, and parameters against the authoritative Neo4j graph model.
 */
import { runQuery } from './database.mjs';

// Authoritative Graph Schema Model
export const GRAPH_SCHEMA = {
  Customer: {
    label: 'Customer',
    defaultAlias: 'c',
    properties: {
      customerId: 'customerId',
      name: 'name',
      email: 'email',
      phone: 'phone',
      address: 'address'
    }
  },
  Parcel: {
    label: 'Parcel',
    defaultAlias: 'p',
    properties: {
      trackingNumber: 'trackingNumber',
      weight: 'weight',
      deliveryCharge: 'deliveryCharge',
      status: 'status'
    }
  },
  Branch: {
    label: 'Branch',
    defaultAlias: 'b',
    properties: {
      branchId: 'branchId',
      name: 'name',
      city: 'city'
    }
  },
  DeliveryAgent: {
    label: 'DeliveryAgent',
    defaultAlias: 'da',
    properties: {
      agentId: 'agentId',
      name: 'name',
      phone: 'phone',
      status: 'status'
    }
  },
  Vehicle: {
    label: 'Vehicle',
    defaultAlias: 'v',
    properties: {
      vehicleId: 'vehicleId',
      registration: 'registration',
      type: 'type',
      capacityKg: 'capacityKg',
      status: 'status'
    }
  },
  CourierService: {
    label: 'CourierService',
    defaultAlias: 'cs',
    properties: {
      serviceId: 'serviceId',
      name: 'name',
      baseCharge: 'baseCharge',
      estimatedDays: 'estimatedDays',
      description: 'description',
      active: 'active'
    }
  },
  TrackingEvent: {
    label: 'TrackingEvent',
    defaultAlias: 'te',
    properties: {
      eventId: 'eventId',
      location: 'location',
      status: 'status',
      timestamp: 'timestamp',
      remarks: 'remarks'
    }
  },
  DeliveryAttempt: {
    label: 'DeliveryAttempt',
    defaultAlias: 'att',
    properties: {
      attemptId: 'attemptId',
      attemptNumber: 'attemptNumber',
      result: 'result',
      remarks: 'remarks',
      timestamp: 'timestamp'
    }
  },
  Payment: {
    label: 'Payment',
    defaultAlias: 'pay',
    properties: {
      paymentId: 'paymentId',
      amount: 'amount',
      method: 'method',
      status: 'status',
      paymentDate: 'paymentDate',
      transactionRef: 'transactionRef'
    }
  },
  SupportTicket: {
    label: 'SupportTicket',
    defaultAlias: 'st',
    properties: {
      ticketId: 'ticketId',
      subject: 'subject',
      priority: 'priority',
      status: 'status',
      remarks: 'remarks',
      createdAt: 'createdAt'
    }
  },
  Staff: {
    label: 'Staff',
    defaultAlias: 's',
    properties: {
      staffId: 'staffId',
      name: 'name',
      role: 'role',
      email: 'email',
      branchId: 'branchId',
      active: 'active'
    }
  }
};

// Aliases and pluralization normalization maps
const TABLE_NAME_MAP = {
  customer: 'Customer',
  customers: 'Customer',
  parcel: 'Parcel',
  parcels: 'Parcel',
  branch: 'Branch',
  branches: 'Branch',
  deliveryagent: 'DeliveryAgent',
  deliveryagents: 'DeliveryAgent',
  delivery_agent: 'DeliveryAgent',
  delivery_agents: 'DeliveryAgent',
  agent: 'DeliveryAgent',
  agents: 'DeliveryAgent',
  vehicle: 'Vehicle',
  vehicles: 'Vehicle',
  courierservice: 'CourierService',
  courierservices: 'CourierService',
  courier_service: 'CourierService',
  courier_services: 'CourierService',
  service: 'CourierService',
  services: 'CourierService',
  trackingevent: 'TrackingEvent',
  trackingevents: 'TrackingEvent',
  tracking_event: 'TrackingEvent',
  tracking_events: 'TrackingEvent',
  deliveryattempt: 'DeliveryAttempt',
  deliveryattempts: 'DeliveryAttempt',
  delivery_attempt: 'DeliveryAttempt',
  delivery_attempts: 'DeliveryAttempt',
  payment: 'Payment',
  payments: 'Payment',
  supportticket: 'SupportTicket',
  supporttickets: 'SupportTicket',
  support_ticket: 'SupportTicket',
  support_tickets: 'SupportTicket',
  ticket: 'SupportTicket',
  tickets: 'SupportTicket',
  staff: 'Staff'
};

const PROPERTY_NAME_MAP = {
  customer_id: 'customerId',
  customerid: 'customerId',
  full_name: 'name',
  fullname: 'name',
  name: 'name',
  email: 'email',
  phone_number: 'phone',
  phonenumber: 'phone',
  phone: 'phone',
  address: 'address',
  city: 'city',
  tracking_number: 'trackingNumber',
  trackingnumber: 'trackingNumber',
  weight: 'weight',
  weight_kg: 'weight',
  weightkg: 'weight',
  delivery_charge: 'deliveryCharge',
  deliverycharge: 'deliveryCharge',
  status: 'status',
  branch_id: 'branchId',
  branchid: 'branchId',
  branch_name: 'name',
  branchname: 'name',
  agent_id: 'agentId',
  agentid: 'agentId',
  vehicle_id: 'vehicleId',
  vehicleid: 'vehicleId',
  registration: 'registration',
  registration_number: 'registration',
  registrationnumber: 'registration',
  vehicle_type: 'type',
  vehicletype: 'type',
  type: 'type',
  capacity_kg: 'capacityKg',
  capacitykg: 'capacityKg',
  capacity: 'capacityKg',
  service_id: 'serviceId',
  serviceid: 'serviceId',
  service_name: 'name',
  servicename: 'name',
  base_rate: 'baseCharge',
  baserate: 'baseCharge',
  base_charge: 'baseCharge',
  basecharge: 'baseCharge',
  estimated_days: 'estimatedDays',
  estimateddays: 'estimatedDays',
  description: 'description',
  active: 'active',
  event_id: 'eventId',
  eventid: 'eventId',
  location: 'location',
  timestamp: 'timestamp',
  remarks: 'remarks',
  attempt_id: 'attemptId',
  attemptid: 'attemptId',
  attempt_number: 'attemptNumber',
  attemptnumber: 'attemptNumber',
  result: 'result',
  payment_id: 'paymentId',
  paymentid: 'paymentId',
  amount: 'amount',
  payment_method: 'method',
  paymentmethod: 'method',
  method: 'method',
  payment_status: 'status',
  paymentstatus: 'status',
  payment_date: 'paymentDate',
  paymentdate: 'paymentDate',
  transaction_ref: 'transactionRef',
  transactionref: 'transactionRef',
  ticket_id: 'ticketId',
  ticketid: 'ticketId',
  subject: 'subject',
  priority: 'priority',
  created_at: 'createdAt',
  createdat: 'createdAt',
  staff_id: 'staffId',
  staffid: 'staffId',
  role: 'role'
};

// Verified Graph Relationship Patterns between entities
const RELATIONSHIP_PATTERNS = {
  'Customer:Parcel': { pattern: '(c:Customer)-[:BOOKED]->(p:Parcel)', from: 'Customer', to: 'Parcel' },
  'Parcel:Customer': { pattern: '(c:Customer)-[:BOOKED]->(p:Parcel)', from: 'Parcel', to: 'Customer' },
  'Parcel:Branch': { pattern: '(p:Parcel)-[:DESTINED_FOR]->(b:Branch)', from: 'Parcel', to: 'Branch' },
  'Branch:Parcel': { pattern: '(p:Parcel)-[:DESTINED_FOR]->(b:Branch)', from: 'Branch', to: 'Parcel' },
  'Parcel:CourierService': { pattern: '(p:Parcel)-[:USES_SERVICE]->(cs:CourierService)', from: 'Parcel', to: 'CourierService' },
  'CourierService:Parcel': { pattern: '(p:Parcel)-[:USES_SERVICE]->(cs:CourierService)', from: 'CourierService', to: 'Parcel' },
  'DeliveryAgent:Parcel': { pattern: '(da:DeliveryAgent)-[:ASSIGNED_TO]->(p:Parcel)', from: 'DeliveryAgent', to: 'Parcel' },
  'Parcel:DeliveryAgent': { pattern: '(da:DeliveryAgent)-[:ASSIGNED_TO]->(p:Parcel)', from: 'Parcel', to: 'DeliveryAgent' },
  'Vehicle:DeliveryAgent': { pattern: '(v:Vehicle)-[:ASSIGNED_TO]->(da:DeliveryAgent)', from: 'Vehicle', to: 'DeliveryAgent' },
  'DeliveryAgent:Vehicle': { pattern: '(v:Vehicle)-[:ASSIGNED_TO]->(da:DeliveryAgent)', from: 'DeliveryAgent', to: 'Vehicle' },
  'Parcel:TrackingEvent': { pattern: '(p:Parcel)-[:HAS_TRACKING_EVENT]->(te:TrackingEvent)', from: 'Parcel', to: 'TrackingEvent' },
  'TrackingEvent:Parcel': { pattern: '(p:Parcel)-[:HAS_TRACKING_EVENT]->(te:TrackingEvent)', from: 'TrackingEvent', to: 'Parcel' },
  'Parcel:DeliveryAttempt': { pattern: '(p:Parcel)-[:HAS_DELIVERY_ATTEMPT]->(att:DeliveryAttempt)', from: 'Parcel', to: 'DeliveryAttempt' },
  'DeliveryAttempt:Parcel': { pattern: '(p:Parcel)-[:HAS_DELIVERY_ATTEMPT]->(att:DeliveryAttempt)', from: 'DeliveryAttempt', to: 'Parcel' },
  'Parcel:Payment': { pattern: '(p:Parcel)-[:HAS_PAYMENT]->(pay:Payment)', from: 'Parcel', to: 'Payment' },
  'Payment:Parcel': { pattern: '(p:Parcel)-[:HAS_PAYMENT]->(pay:Payment)', from: 'Payment', to: 'Parcel' },
  'Customer:SupportTicket': { pattern: '(c:Customer)-[:RAISED]->(st:SupportTicket)', from: 'Customer', to: 'SupportTicket' },
  'SupportTicket:Customer': { pattern: '(c:Customer)-[:RAISED]->(st:SupportTicket)', from: 'SupportTicket', to: 'Customer' },
  'SupportTicket:Parcel': { pattern: '(st:SupportTicket)-[:ABOUT_PARCEL]->(p:Parcel)', from: 'SupportTicket', to: 'Parcel' },
  'Parcel:SupportTicket': { pattern: '(st:SupportTicket)-[:ABOUT_PARCEL]->(p:Parcel)', from: 'Parcel', to: 'SupportTicket' },
  'Staff:Branch': { pattern: '(s:Staff)-[:WORKS_AT]->(b:Branch)', from: 'Staff', to: 'Branch' },
  'Branch:Staff': { pattern: '(s:Staff)-[:WORKS_AT]->(b:Branch)', from: 'Branch', to: 'Staff' }
};

export function resolveTableName(raw) {
  if (!raw) return null;
  const clean = raw.trim().toLowerCase().replace(/[`"']/g, '');
  return TABLE_NAME_MAP[clean] || null;
}

export function resolvePropertyName(rawProp) {
  if (!rawProp) return null;
  const clean = rawProp.trim().toLowerCase().replace(/[`"']/g, '');
  return PROPERTY_NAME_MAP[clean] || null;
}

/**
 * Checks for mutation statements and multi-statement injection
 */
export function validateReadOnly(sql) {
  if (typeof sql !== 'string' || !sql.trim()) {
    throw new Error('SQL query string is required');
  }

  // Reject multi-statement queries (semicolon followed by non-whitespace)
  const trimmed = sql.trim().replace(/;+\s*$/, '');
  if (trimmed.includes(';')) {
    throw new Error('Multiple SQL statements are not permitted in read-only query mode');
  }

  // Reject forbidden keywords
  const forbidden = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE',
    'MERGE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'CALL', 'SET', 'REMOVE', 'DETACH'
  ];

  const wordPattern = /\b([a-zA-Z_]+)\b/g;
  let match;
  while ((match = wordPattern.exec(trimmed)) !== null) {
    const word = match[1].toUpperCase();
    if (forbidden.includes(word)) {
      throw new Error(`Mutating or administrative keyword '${word}' is not permitted. Only read-only SELECT queries are supported.`);
    }
  }

  // Must begin with SELECT
  if (!/^\s*SELECT\b/i.test(trimmed)) {
    throw new Error('Only SELECT queries are supported in Live Neo4j Query Mode.');
  }

  return trimmed;
}

export const validateSqlIsReadOnly = validateReadOnly;

/**
 * Parses and translates supported SQL queries to parameterized Cypher.
 */
export function translateSqlToCypher(sql) {
  const cleanSql = validateReadOnly(sql);

  // 1. Extract Limit
  let limitValue = 25;
  let limitMatch = cleanSql.match(/\bLIMIT\s+(\d+)\b/i);
  let withoutLimit = cleanSql;
  if (limitMatch) {
    limitValue = Math.min(Math.max(parseInt(limitMatch[1], 10), 1), 100);
    withoutLimit = cleanSql.replace(/\bLIMIT\s+\d+\b/i, '').trim();
  }

  // 2. Extract Order By
  let orderByClause = '';
  let withoutOrderBy = withoutLimit;
  const orderMatch = withoutLimit.match(/\bORDER\s+BY\s+([\s\S]+?)$/i);
  if (orderMatch) {
    orderByClause = orderMatch[1].trim();
    withoutOrderBy = withoutLimit.substring(0, orderMatch.index).trim();
  }

  // 3. Extract Group By
  let groupByClause = '';
  let withoutGroupBy = withoutOrderBy;
  const groupMatch = withoutOrderBy.match(/\bGROUP\s+BY\s+([\s\S]+?)$/i);
  if (groupMatch) {
    groupByClause = groupMatch[1].trim();
    withoutGroupBy = withoutOrderBy.substring(0, groupMatch.index).trim();
  }

  // 4. Extract Where
  let whereClause = '';
  let withoutWhere = withoutGroupBy;
  const whereMatch = withoutGroupBy.match(/\bWHERE\s+([\s\S]+?)$/i);
  if (whereMatch) {
    whereClause = whereMatch[1].trim();
    withoutWhere = withoutGroupBy.substring(0, whereMatch.index).trim();
  }

  // 5. Extract FROM & JOINs
  const fromMatch = withoutWhere.match(/\bFROM\s+([\s\S]+?)$/i);
  if (!fromMatch) {
    throw new Error('SQL syntax error: Missing FROM clause in SELECT statement.');
  }
  const fromAndJoins = fromMatch[1].trim();
  const selectPart = withoutWhere.substring(0, fromMatch.index).replace(/^\s*SELECT\s+/i, '').trim();

  // Parse Table and Joins
  const isDistinct = /^\s*DISTINCT\b/i.test(selectPart);
  const rawSelectItems = (isDistinct ? selectPart.replace(/^\s*DISTINCT\s+/i, '') : selectPart)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (rawSelectItems.length === 0) {
    throw new Error('SQL syntax error: No columns specified in SELECT projection.');
  }

  // Parse Tables in FROM
  const tableTokens = fromAndJoins.split(/\b(?:INNER\s+JOIN|LEFT\s+OUTER\s+JOIN|RIGHT\s+OUTER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|JOIN)\b/i);
  const baseTableExpr = tableTokens[0].trim();
  
  // Base table: "Parcel p" or "parcels AS p" or "Parcel"
  const baseParts = baseTableExpr.split(/\s+(?:AS\s+)?/i);
  const rawBaseTable = baseParts[0];
  const canonicalBase = resolveTableName(rawBaseTable);
  if (!canonicalBase) {
    const supported = Object.keys(GRAPH_SCHEMA).join(', ');
    throw new Error(`Unknown table '${rawBaseTable}'. Supported tables: ${supported}`);
  }
  const baseMeta = GRAPH_SCHEMA[canonicalBase];
  const baseAlias = baseParts[1] ? baseParts[1].trim() : baseMeta.defaultAlias;

  const aliasMap = new Map(); // alias -> Canonical Label
  aliasMap.set(baseAlias, canonicalBase);
  aliasMap.set(canonicalBase.toLowerCase(), canonicalBase);

  // Parse joined tables
  const joinedTables = [];
  if (tableTokens.length > 1) {
    for (let i = 1; i < tableTokens.length; i++) {
      const joinStr = tableTokens[i].trim();
      const onSplit = joinStr.split(/\bON\b/i);
      const joinTableExpr = onSplit[0].trim();
      const joinParts = joinTableExpr.split(/\s+(?:AS\s+)?/i);
      const rawJoinTable = joinParts[0];
      const canonicalJoin = resolveTableName(rawJoinTable);
      if (!canonicalJoin) {
        throw new Error(`Unknown table '${rawJoinTable}' in JOIN clause.`);
      }
      const joinMeta = GRAPH_SCHEMA[canonicalJoin];
      const joinAlias = joinParts[1] ? joinParts[1].trim() : joinMeta.defaultAlias;
      aliasMap.set(joinAlias, canonicalJoin);
      aliasMap.set(canonicalJoin.toLowerCase(), canonicalJoin);
      joinedTables.push({ label: canonicalJoin, alias: joinAlias });
    }
  }

  // Construct Cypher MATCH clauses
  const matchClauses = [];
  if (joinedTables.length === 0) {
    matchClauses.push(`MATCH (${baseAlias}:${canonicalBase})`);
  } else {
    // Build relationship paths
    let currentBase = canonicalBase;
    let currentAlias = baseAlias;
    matchClauses.push(`MATCH (${baseAlias}:${canonicalBase})`);

    for (const jt of joinedTables) {
      const key1 = `${currentBase}:${jt.label}`;
      const key2 = `${canonicalBase}:${jt.label}`;
      const relInfo = RELATIONSHIP_PATTERNS[key1] || RELATIONSHIP_PATTERNS[key2];

      if (!relInfo) {
        throw new Error(`No direct graph relationship pattern mapped between '${currentBase}' and '${jt.label}'.`);
      }

      // Substitute actual query aliases into pattern
      const fromAlias = relInfo.from === canonicalBase ? baseAlias : jt.alias;
      const toAlias = relInfo.to === canonicalBase ? baseAlias : jt.alias;

      // Extract rel type e.g. :BOOKED
      const relTypeMatch = relInfo.pattern.match(/-\[:([A-Z_]+)\]->/);
      const relType = relTypeMatch ? relTypeMatch[1] : 'RELATED_TO';

      matchClauses.push(`MATCH (${fromAlias}:${relInfo.from})-[:${relType}]->(${toAlias}:${relInfo.to})`);
    }
  }

  // Parse WHERE clause & extract parameters
  const params = {};
  let paramCounter = 0;
  let cypherWhere = '';

  if (whereClause) {
    let translatedWhere = whereClause;

    // 1. Handle IN (...) lists into parameterized array
    translatedWhere = translatedWhere.replace(/\bIN\s*\(\s*([^)]+)\s*\)/gi, (m, innerList) => {
      const items = innerList.split(',').map(s => {
        const trimmed = s.trim();
        if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
          return trimmed.slice(1, -1);
        }
        const num = Number(trimmed);
        return isNaN(num) ? trimmed : num;
      });
      const pName = `p${paramCounter++}`;
      params[pName] = items;
      return `IN $${pName}`;
    });

    // 2. Parameterize string literals '...'
    translatedWhere = translatedWhere.replace(/'([^']*)'/g, (m, strVal) => {
      const pName = `p${paramCounter++}`;
      params[pName] = strVal;
      return `$${pName}`;
    });

    // 3. Translate comparison operators and columns (skipping already parameterized $p...)
    translatedWhere = translatedWhere.replace(/(\$[a-zA-Z0-9_]+)|([a-zA-Z_][a-zA-Z0-9_]*)(?:\.([a-zA-Z_][a-zA-Z0-9_]*))?/g, (m, dollarParam, prefix, col) => {
      if (dollarParam) {
        return dollarParam;
      }

      // Check if SQL keyword
      const upper = m.toUpperCase();
      if (['AND', 'OR', 'NOT', 'LIKE', 'IN', 'IS', 'NULL', 'TRUE', 'FALSE'].includes(upper)) {
        return upper;
      }

      let targetAlias = baseAlias;
      let rawProperty = m;

      if (col) {
        targetAlias = prefix;
        rawProperty = col;
      }

      const entityLabel = aliasMap.get(targetAlias);
      if (!entityLabel) {
        // Might be unaliased column name
        const prop = resolvePropertyName(m);
        if (prop) {
          return `${baseAlias}.${prop}`;
        }
        return m;
      }

      const prop = resolvePropertyName(rawProperty);
      if (!prop) {
        throw new Error(`Property '${rawProperty}' is not recognized on entity '${entityLabel}'.`);
      }
      return `${targetAlias}.${prop}`;
    });

    // 4. Translate LIKE '%val%' to CONTAINS / STARTS WITH
    translatedWhere = translatedWhere.replace(/(\S+)\s+LIKE\s+\$(\w+)/gi, (m, colExpr, pName) => {
      const val = params[pName];
      if (typeof val === 'string') {
        if (val.startsWith('%') && val.endsWith('%')) {
          params[pName] = val.slice(1, -1);
          return `${colExpr} CONTAINS $${pName}`;
        }
        if (val.endsWith('%')) {
          params[pName] = val.slice(0, -1);
          return `${colExpr} STARTS WITH $${pName}`;
        }
        if (val.startsWith('%')) {
          params[pName] = val.slice(1);
          return `${colExpr} ENDS WITH $${pName}`;
        }
      }
      return `${colExpr} = $${pName}`;
    });

    // Translate != and <>
    translatedWhere = translatedWhere.replace(/!=/g, '<>');

    cypherWhere = `WHERE ${translatedWhere}`;
  }

  // Parse SELECT projection items
  const returnItems = [];
  for (const rawItem of rawSelectItems) {
    if (rawItem === '*') {
      returnItems.push(`${baseAlias}`);
      continue;
    }

    // Check for alias: expr AS alias
    const asParts = rawItem.split(/\s+AS\s+/i);
    const expr = asParts[0].trim();
    const outputAlias = asParts[1] ? asParts[1].trim() : null;

    // Check for aggregate functions: COUNT(x), SUM(x), AVG(x), MIN(x), MAX(x)
    const aggMatch = expr.match(/^(COUNT|SUM|AVG|MIN|MAX)\((.+?)\)$/i);
    if (aggMatch) {
      const func = aggMatch[1].toLowerCase();
      const inner = aggMatch[2].trim();
      let innerExpr = inner;
      let propName = 'all';

      if (inner !== '*' && inner !== '1') {
        const dotSplit = inner.split('.');
        const tAlias = dotSplit.length > 1 ? dotSplit[0].trim() : baseAlias;
        const col = dotSplit.length > 1 ? dotSplit[1].trim() : dotSplit[0].trim();
        const prop = resolvePropertyName(col);
        if (!prop) {
          throw new Error(`Unknown column '${col}' in aggregation function '${func}'.`);
        }
        propName = prop;
        innerExpr = `${tAlias}.${prop}`;
      } else {
        innerExpr = '*';
        propName = 'all';
      }

      const defaultAs = `${func}_${propName}`;
      returnItems.push(`${func}(${innerExpr}) AS ${outputAlias || defaultAs}`);
      continue;
    }

    // Regular column: p.trackingNumber or trackingNumber
    const dotParts = expr.split('.');
    const tAlias = dotParts.length > 1 ? dotParts[0].trim() : baseAlias;
    const rawCol = dotParts.length > 1 ? dotParts[1].trim() : dotParts[0].trim();

    const entityLabel = aliasMap.get(tAlias);
    if (!entityLabel) {
      throw new Error(`Unknown table alias '${tAlias}' in SELECT clause.`);
    }

    const prop = resolvePropertyName(rawCol);
    if (!prop) {
      const validProps = Object.keys(GRAPH_SCHEMA[entityLabel]?.properties || {}).join(', ');
      throw new Error(`Unknown column '${rawCol}' on entity '${entityLabel}'. Available: ${validProps}`);
    }

    const finalAlias = outputAlias || prop;
    returnItems.push(`${tAlias}.${prop} AS ${finalAlias}`);
  }

  // Parse ORDER BY
  let cypherOrderBy = '';
  if (orderByClause) {
    const orderParts = orderByClause.split(',').map(s => s.trim()).filter(Boolean);
    const cypherOrderItems = orderParts.map(item => {
      const parts = item.split(/\s+/);
      const colExpr = parts[0];
      const dir = parts[1] && parts[1].toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      const dotSplit = colExpr.split('.');
      const tAlias = dotSplit.length > 1 ? dotSplit[0].trim() : baseAlias;
      const rawCol = dotSplit.length > 1 ? dotSplit[1].trim() : dotSplit[0].trim();
      const prop = resolvePropertyName(rawCol);
      if (!prop) {
        return `${colExpr} ${dir}`;
      }
      return `${tAlias}.${prop} ${dir}`;
    });
    cypherOrderBy = `ORDER BY ${cypherOrderItems.join(', ')}`;
  }

  // Assemble Cypher
  let cypher = matchClauses.join('\n');
  if (cypherWhere) {
    cypher += `\n${cypherWhere}`;
  }
  cypher += `\nRETURN ${isDistinct ? 'DISTINCT ' : ''}${returnItems.join(', ')}`;
  if (cypherOrderBy) {
    cypher += `\n${cypherOrderBy}`;
  }
  cypher += `\nLIMIT toInteger($queryLimit)`;
  params.queryLimit = limitValue;

  return {
    cypher,
    parameters: params,
    baseTable: canonicalBase,
    isDistinct,
    limit: limitValue
  };
}

/**
 * Executes a validated SQL query against Neo4j AuraDB.
 */
export async function executeSqlQuery(sql, { dryRun = false } = {}) {
  const startTime = Date.now();
  const { cypher, parameters, baseTable } = translateSqlToCypher(sql);

  if (dryRun) {
    return {
      status: 'SUCCESS',
      query: sql,
      cypher,
      parameters,
      baseTable,
      dryRun: true,
      rowCount: 0,
      durationMs: Date.now() - startTime,
      columns: [],
      rows: []
    };
  }

  const rawRecords = await runQuery(cypher, parameters);
  const durationMs = Date.now() - startTime;

  // Extract columns
  let columns = [];
  if (rawRecords.length > 0) {
    columns = Object.keys(rawRecords[0]);
  }

  // Sanitize sensitive PII in results
  const rows = rawRecords.map(r => {
    const cleanRow = { ...r };
    if (cleanRow.email && typeof cleanRow.email === 'string') {
      const parts = cleanRow.email.split('@');
      cleanRow.email = parts.length === 2 && parts[0].length > 2
        ? `${parts[0][0]}•••${parts[0].slice(-1)}@${parts[1]}`
        : '•••@•••';
    }
    if (cleanRow.phone && typeof cleanRow.phone === 'string') {
      cleanRow.phone = cleanRow.phone.replace(/(\d{2,4})\d+(\d{2})/, '$1••••$2');
    }
    return cleanRow;
  });

  return {
    status: 'SUCCESS',
    query: sql,
    cypher,
    parameters,
    baseTable,
    rowCount: rows.length,
    durationMs,
    columns,
    rows
  };
}
