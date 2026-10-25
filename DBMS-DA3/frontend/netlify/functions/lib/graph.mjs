/**
 * SwiftShip Netlify Functions - Neo4j Graph Explorer Service
 * Queries live Neo4j AuraDB graph nodes, relationships, and structural statistics.
 */
import { runQuery } from './database.mjs';

export function sanitizeProperties(props = {}) {
  const sanitized = { ...props };
  const sensitiveKeys = ['password', 'secret', 'token', 'auth', 'credentials'];
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      delete sanitized[key];
    }
  }
  return sanitized;
}

export function getNodeCaption(labels = [], props = {}, id = '') {
  if (props.trackingNumber) return props.trackingNumber;
  if (props.name) return props.name;
  if (props.customerId) return props.customerId;
  if (props.branchId) return props.branchId;
  if (props.ticketNumber) return props.ticketNumber;
  if (props.registrationNumber) return props.registrationNumber;
  if (props.serviceName) return props.serviceName;
  if (props.paymentId) return props.paymentId;
  if (props.agentId) return props.agentId;
  if (props.routeId) return props.routeId;
  const primary = labels[0] || 'Node';
  const shortId = String(id).replace(/[^a-zA-Z0-9]/g, '').slice(-4) || '1';
  return `${primary} #${shortId}`;
}

export async function getGraphOverview(query = {}) {
  // Clamp limits to prevent overloading serverless response
  let nodeLimit = parseInt(query.nodeLimit || query.limit || '80', 10);
  if (isNaN(nodeLimit) || nodeLimit < 1) nodeLimit = 80;
  if (nodeLimit > 200) nodeLimit = 200;

  let relLimit = parseInt(query.relationshipLimit || query.relLimit || '120', 10);
  if (isNaN(relLimit) || relLimit < 1) relLimit = 120;
  if (relLimit > 300) relLimit = 300;

  const labelFilter = query.label ? String(query.label).trim() : null;
  const searchFilter = query.search ? String(query.search).trim() : null;

  // 1. Fetch nodes matching filter
  let nodeCypher = '';
  const nodeParams = { nodeLimit };

  if (labelFilter && searchFilter) {
    nodeCypher = `
      MATCH (n)
      WHERE $label IN labels(n) AND (
        any(prop IN keys(n) WHERE toString(n[prop]) =~ '(?i).*' + $search + '.*')
      )
      RETURN elementId(n) AS id, labels(n) AS labels, properties(n) AS properties
      LIMIT toInteger($nodeLimit)
    `;
    nodeParams.label = labelFilter;
    nodeParams.search = searchFilter;
  } else if (labelFilter) {
    nodeCypher = `
      MATCH (n)
      WHERE $label IN labels(n)
      RETURN elementId(n) AS id, labels(n) AS labels, properties(n) AS properties
      LIMIT toInteger($nodeLimit)
    `;
    nodeParams.label = labelFilter;
  } else if (searchFilter) {
    nodeCypher = `
      MATCH (n)
      WHERE any(prop IN keys(n) WHERE toString(n[prop]) =~ '(?i).*' + $search + '.*')
      RETURN elementId(n) AS id, labels(n) AS labels, properties(n) AS properties
      LIMIT toInteger($nodeLimit)
    `;
    nodeParams.search = searchFilter;
  } else {
    nodeCypher = `
      MATCH (n)
      RETURN elementId(n) AS id, labels(n) AS labels, properties(n) AS properties
      LIMIT toInteger($nodeLimit)
    `;
  }

  const rawNodes = await runQuery(nodeCypher, nodeParams);
  const nodes = rawNodes.map(rn => {
    const labels = Array.isArray(rn.labels) ? rn.labels : [];
    const props = sanitizeProperties(rn.properties || {});
    return {
      id: rn.id,
      labels,
      primaryLabel: labels[0] || 'Unknown',
      caption: getNodeCaption(labels, props, rn.id),
      properties: props
    };
  });

  const nodeIds = nodes.map(n => n.id);

  // 2. Fetch relationships between returned nodes
  let edges = [];
  if (nodeIds.length > 0) {
    const relCypher = `
      MATCH (s)-[r]->(t)
      WHERE elementId(s) IN $nodeIds AND elementId(t) IN $nodeIds
      RETURN elementId(r) AS id, type(r) AS type,
             elementId(s) AS source, elementId(t) AS target,
             properties(r) AS properties
      LIMIT toInteger($relLimit)
    `;
    const rawRels = await runQuery(relCypher, { nodeIds, relLimit });
    edges = rawRels.map(rr => ({
      id: rr.id,
      type: rr.type,
      source: rr.source,
      target: rr.target,
      properties: sanitizeProperties(rr.properties || {})
    }));
  }

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
    // If stats query fails (e.g. timeout or empty db), use current counts
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
