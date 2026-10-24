/**
 * SwiftShip Netlify Functions - Route Operations
 */
import { runQuery } from './database.mjs';

export async function exploreRoutes(fromBranchId = null, toBranchId = null) {
  let cypher = `
    MATCH (ob:Branch)<-[:ORIGINATED_AT]-(p:Parcel)-[:DESTINED_FOR]->(db:Branch)
    OPTIONAL MATCH (p)-[:USES_SERVICE]->(cs:CourierService)
    WHERE 1=1
  `;

  const params = {};
  if (fromBranchId && fromBranchId.trim()) {
    cypher += ' AND ob.branchId = $fromBranchId ';
    params.fromBranchId = fromBranchId.trim();
  }
  if (toBranchId && toBranchId.trim()) {
    cypher += ' AND db.branchId = $toBranchId ';
    params.toBranchId = toBranchId.trim();
  }

  cypher += `
    RETURN ob.branchId AS originBranchId, ob.name AS originBranchName, ob.city AS originCity,
           db.branchId AS destinationBranchId, db.name AS destinationBranchName, db.city AS destinationCity,
           count(p) AS parcelCount,
           collect(DISTINCT cs.name) AS servicesUsed,
           collect(DISTINCT p.trackingNumber) AS trackingNumbers
    ORDER BY parcelCount DESC
  `;

  const rows = await runQuery(cypher, params);

  return rows.map(r => ({
    originBranchId: r.originBranchId,
    originBranchName: r.originBranchName,
    originCity: r.originCity,
    destinationBranchId: r.destinationBranchId,
    destinationBranchName: r.destinationBranchName,
    destinationCity: r.destinationCity,
    parcelCount: Number(r.parcelCount || 0),
    servicesUsed: Array.isArray(r.servicesUsed) ? r.servicesUsed.filter(Boolean) : [],
    trackingNumbers: Array.isArray(r.trackingNumbers) ? r.trackingNumbers.filter(Boolean) : []
  }));
}
