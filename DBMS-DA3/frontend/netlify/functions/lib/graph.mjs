/**
 * SwiftShip Netlify Functions - Neo4j Graph Explorer Service
 * Queries live Neo4j AuraDB graph nodes, relationships, and structural statistics.
 * Prioritizes connected subgraphs and relationships so edges render seamlessly between nodes.
 */
import { runQuery } from './database.mjs';

/**
 * Strips secrets, tokens, credentials, and masks PII (email, phone).
 */
export function sanitizeProperties(props = {}) {
  const sanitized = { ...props };
  const sensitiveKeys = ['password', 'secret', 'token', 'auth', 'credentials'];
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      delete sanitized[key];
    }
  }

  // Mask PII: Email
  if (sanitized.email && typeof sanitized.email === 'string') {
    const parts = sanitized.email.split('@');
    if (parts.length === 2 && parts[0].length > 2) {
      sanitized.email = `${parts[0][0]}•••${parts[0].slice(-1)}@${parts[1]}`;
    } else {
      sanitized.email = '•••@•••';
    }
  }

  // Mask PII: Phone
  if (sanitized.phone && typeof sanitized.phone === 'string') {
    sanitized.phone = sanitized.phone.replace(/(\d{2,4})\d+(\d{2})/, '$1••••$2');
  }

  return sanitized;
}

/**
 * Returns human-readable label or identifier for node rendering.
 */
export function getNodeCaption(labels = [], props = {}, id = '') {
  if (props.trackingNumber) return props.trackingNumber;
  if (props.name) return props.name;
  if (props.customerId) return props.customerId;
  if (props.branchId) return props.branchId;
  if (props.ticketNumber) return props.ticketNumber;
  if (props.registrationNumber) return props.registrationNumber;
  if (props.registration) return props.registration;
  if (props.serviceName) return props.serviceName;
  if (props.paymentId) return props.paymentId;
  if (props.agentId) return props.agentId;
  if (props.routeId) return props.routeId;
  const primary = labels[0] || 'Node';
  const shortId = String(id).replace(/[^a-zA-Z0-9]/g, '').slice(-4) || '1';
  return `${primary} #${shortId}`;
}

/**
 * Fetches connected nodes, relationships, and database schema statistics.
 * Relationship-first traversal ensures edges are not orphaned or omitted.
 */
export async function getGraphOverview(query = {}) {
  let nodeLimit = parseInt(query.nodeLimit || query.limit || '80', 10);
  if (isNaN(nodeLimit) || nodeLimit < 1) nodeLimit = 80;
  if (nodeLimit > 200) nodeLimit = 200;

  let relLimit = parseInt(query.relationshipLimit || query.relLimit || '120', 10);
  if (isNaN(relLimit) || relLimit < 1) relLimit = 120;
  if (relLimit > 300) relLimit = 300;

  const labelFilter = query.label ? String(query.label).trim() : null;
  const searchFilter = query.search ? String(query.search).trim() : null;

  const nodesMap = new Map();
  const edgesMap = new Map();

  const addNode = (id, labels, properties) => {
    if (!id || nodesMap.has(id)) return;
    const safeLabels = Array.isArray(labels) ? labels : [];
    const safeProps = sanitizeProperties(properties || {});
    nodesMap.set(id, {
      id,
      labels: safeLabels,
      primaryLabel: safeLabels[0] || 'Unknown',
      caption: getNodeCaption(safeLabels, safeProps, id),
      properties: safeProps
    });
  };

  const addEdge = (id, type, source, target, properties) => {
    if (!id || edgesMap.has(id)) return;
    edgesMap.set(id, {
      id,
      type: type || 'RELATED_TO',
      source,
      target,
      properties: sanitizeProperties(properties || {})
    });
  };

  // 1. Fetch connected relationships first to maximize edge visibility
  try {
    if (labelFilter && searchFilter) {
      const relCypher = `
        MATCH (s)-[r]-(t)
        WHERE $label IN labels(s) AND (
          any(prop IN keys(s) WHERE toString(s[prop]) =~ '(?i).*' + $search + '.*')
        )
        RETURN elementId(s) AS sId, labels(s) AS sLabels, properties(s) AS sProps,
               elementId(r) AS rId, type(r) AS rType, properties(r) AS rProps,
               elementId(t) AS tId, labels(t) AS tLabels, properties(t) AS tProps,
               startNode(r) = s AS sIsStart
        LIMIT toInteger($relLimit)
      `;
      const relRows = await runQuery(relCypher, { label: labelFilter, search: searchFilter, relLimit });
      for (const row of relRows) {
        addNode(row.sId, row.sLabels, row.sProps);
        addNode(row.tId, row.tLabels, row.tProps);
        const sourceId = row.sIsStart ? row.sId : row.tId;
        const targetId = row.sIsStart ? row.tId : row.sId;
        addEdge(row.rId, row.rType, sourceId, targetId, row.rProps);
      }
    } else if (labelFilter) {
      const relCypher = `
        MATCH (s)-[r]-(t)
        WHERE $label IN labels(s)
        RETURN elementId(s) AS sId, labels(s) AS sLabels, properties(s) AS sProps,
               elementId(r) AS rId, type(r) AS rType, properties(r) AS rProps,
               elementId(t) AS tId, labels(t) AS tLabels, properties(t) AS tProps,
               startNode(r) = s AS sIsStart
        LIMIT toInteger($relLimit)
      `;
      const relRows = await runQuery(relCypher, { label: labelFilter, relLimit });
      for (const row of relRows) {
        addNode(row.sId, row.sLabels, row.sProps);
        addNode(row.tId, row.tLabels, row.tProps);
        const sourceId = row.sIsStart ? row.sId : row.tId;
        const targetId = row.sIsStart ? row.tId : row.sId;
        addEdge(row.rId, row.rType, sourceId, targetId, row.rProps);
      }
    } else if (searchFilter) {
      const relCypher = `
        MATCH (s)-[r]-(t)
        WHERE any(prop IN keys(s) WHERE toString(s[prop]) =~ '(?i).*' + $search + '.*')
        RETURN elementId(s) AS sId, labels(s) AS sLabels, properties(s) AS sProps,
               elementId(r) AS rId, type(r) AS rType, properties(r) AS rProps,
               elementId(t) AS tId, labels(t) AS tLabels, properties(t) AS tProps,
               startNode(r) = s AS sIsStart
        LIMIT toInteger($relLimit)
      `;
      const relRows = await runQuery(relCypher, { search: searchFilter, relLimit });
      for (const row of relRows) {
        addNode(row.sId, row.sLabels, row.sProps);
        addNode(row.tId, row.tLabels, row.tProps);
        const sourceId = row.sIsStart ? row.sId : row.tId;
        const targetId = row.sIsStart ? row.tId : row.sId;
        addEdge(row.rId, row.rType, sourceId, targetId, row.rProps);
      }
    } else {
      const relCypher = `
        MATCH (s)-[r]->(t)
        RETURN elementId(s) AS sId, labels(s) AS sLabels, properties(s) AS sProps,
               elementId(r) AS rId, type(r) AS rType, properties(r) AS rProps,
               elementId(t) AS tId, labels(t) AS tLabels, properties(t) AS tProps
        LIMIT toInteger($relLimit)
      `;
      const relRows = await runQuery(relCypher, { relLimit });
      for (const row of relRows) {
        addNode(row.sId, row.sLabels, row.sProps);
        addNode(row.tId, row.tLabels, row.tProps);
        addEdge(row.rId, row.rType, row.sId, row.tId, row.rProps);
      }
    }
  } catch (err) {
    // Continue even if relationship search encounters edge cases
  }

  // 2. If node quota remains, fetch standalone/matching nodes up to nodeLimit
  const remainingSlots = nodeLimit - nodesMap.size;
  if (remainingSlots > 0) {
    const existingNodeIds = Array.from(nodesMap.keys());
    let nodeCypher = '';
    const nodeParams = { remainingSlots, existingNodeIds };

    if (labelFilter && searchFilter) {
      nodeCypher = `
        MATCH (n)
        WHERE $label IN labels(n)
          AND NOT elementId(n) IN $existingNodeIds
          AND any(prop IN keys(n) WHERE toString(n[prop]) =~ '(?i).*' + $search + '.*')
        RETURN elementId(n) AS id, labels(n) AS labels, properties(n) AS properties
        LIMIT toInteger($remainingSlots)
      `;
      nodeParams.label = labelFilter;
      nodeParams.search = searchFilter;
    } else if (labelFilter) {
      nodeCypher = `
        MATCH (n)
        WHERE $label IN labels(n) AND NOT elementId(n) IN $existingNodeIds
        RETURN elementId(n) AS id, labels(n) AS labels, properties(n) AS properties
        LIMIT toInteger($remainingSlots)
      `;
      nodeParams.label = labelFilter;
    } else if (searchFilter) {
      nodeCypher = `
        MATCH (n)
        WHERE NOT elementId(n) IN $existingNodeIds
          AND any(prop IN keys(n) WHERE toString(n[prop]) =~ '(?i).*' + $search + '.*')
        RETURN elementId(n) AS id, labels(n) AS labels, properties(n) AS properties
        LIMIT toInteger($remainingSlots)
      `;
      nodeParams.search = searchFilter;
    } else {
      nodeCypher = `
        MATCH (n)
        WHERE NOT elementId(n) IN $existingNodeIds
        RETURN elementId(n) AS id, labels(n) AS labels, properties(n) AS properties
        LIMIT toInteger($remainingSlots)
      `;
    }

    try {
      const extraNodes = await runQuery(nodeCypher, nodeParams);
      for (const rn of extraNodes) {
        addNode(rn.id, rn.labels, rn.properties);
      }
    } catch (_) {}
  }

  const nodes = Array.from(nodesMap.values());
  const edges = Array.from(edgesMap.values());

  // 3. Database Summary Stats
  let labelStats = [];
  let totalNodes = 0;
  let totalRelationships = 0;

  try {
    const [lStats, rStats] = await Promise.all([
      runQuery(`
        MATCH (n)
        UNWIND labels(n) AS lbl
        RETURN lbl AS label, count(n) AS count
        ORDER BY count DESC
      `),
      runQuery(`
        MATCH ()-[r]->()
        RETURN count(r) AS totalRelationships
      `)
    ]);

    labelStats = (lStats || []).map(r => ({ label: r.label, count: Number(r.count || 0) }));
    totalNodes = labelStats.reduce((sum, item) => sum + item.count, 0);
    totalRelationships = Number(rStats[0]?.totalRelationships || 0);
  } catch (err) {
    totalNodes = nodes.length;
    totalRelationships = edges.length;
  }

  return {
    nodes,
    edges,
    stats: {
      totalNodes,
      totalRelationships,
      returnedNodes: nodes.length,
      returnedEdges: edges.length,
      nodeLimit,
      relationshipLimit: relLimit,
      filter: {
        label: labelFilter,
        search: searchFilter
      },
      availableLabels: labelStats
    }
  };
}
