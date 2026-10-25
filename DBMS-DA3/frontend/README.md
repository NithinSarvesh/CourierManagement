# SwiftShip Courier Management Frontend

## What changed for the project presentation
- Removed the invented personal greeting and replaced it with a neutral Courier Operations Overview.
- Replaced the Alex Smith profile with SwiftShip Admin.
- Added **Graph Explorer** to visualize branch, parcel and customer API records as nodes and relationship lines.
- Added **Query Builder** with guided node labels, properties, conditions, result limits, and a Cypher preview/copy action.
- Kept the existing REST API client and Netlify Functions architecture.

## Important graph/query note
The graph screen visualizes data returned by the current REST endpoints. Where the API does not expose actual relationship objects, the view uses inferred illustrative connections and labels this in the UI. It is not a direct Neo4j Browser visualization.

The query builder generates a read-only Cypher preview. It intentionally does **not** execute arbitrary Cypher because the current frontend API does not expose a general-purpose query endpoint. To execute queries, implement a secured backend endpoint that allowlists labels/properties and permits read-only queries only.

## Run locally
This repository uses Netlify Functions and the Neo4j driver. Use the project's configured environment and Netlify CLI for the full stack. Opening `index.html` directly may display the UI, but API calls require a running backend or deployed Netlify Functions.

## Update your GitHub repository
From a terminal opened in the repository folder:

```bash
git status
git add DBMS-DA3/frontend
git commit -m "feat(frontend): add graph explorer and guided query builder"
git push origin main
```

If you extracted only the `frontend` folder rather than the full repository, open the actual repository clone before running those Git commands. A ZIP download is not itself a Git repository and cannot push commits until placed in a clone.
