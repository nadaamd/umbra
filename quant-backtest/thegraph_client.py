"""
Extraction des swaps Uniswap v3 depuis The Graph (réseau décentralisé).

On récupère les swaps tick-level de la pool cible sur la fenêtre du crash.
Chaque swap porte l'état exact de la pool à cet instant :
  - sqrtPriceX96 -> prix pool (pour la divergence de prix)
  - liquidity    -> liquidité active in-range (pour la vitesse de fuite)
  - amount0/1    -> flux (pour le déséquilibre et le volume)

Pagination robuste par curseur `id_gt` (pas de `skip`, qui plafonne à 5000
et peut sauter des lignes). On ordonne par id croissant et on avance le curseur.
"""
import os
import sys
import time
import requests
import pandas as pd

import config

SWAPS_QUERY = """
query Swaps($pool: String!, $start: Int!, $end: Int!, $lastId: String!) {
  swaps(
    first: 1000
    orderBy: id
    orderDirection: asc
    where: {
      pool: $pool
      timestamp_gte: $start
      timestamp_lt: $end
      id_gt: $lastId
    }
  ) {
    id
    timestamp
    amount0
    amount1
    amountUSD
    sqrtPriceX96
    tick
    liquidity
  }
}
"""


def _post(query: str, variables: dict) -> dict:
    if not config.THEGRAPH_API_KEY:
        sys.exit("❌ THEGRAPH_API_KEY manquant. Renseigne-le dans .env (cf. .env.example).")
    resp = requests.post(
        config.SUBGRAPH_URL,
        json={"query": query, "variables": variables},
        timeout=30,
    )
    resp.raise_for_status()
    payload = resp.json()
    if "errors" in payload:
        raise RuntimeError(f"Erreur GraphQL: {payload['errors']}")
    return payload["data"]


def fetch_swaps() -> pd.DataFrame:
    """Récupère tous les swaps de la fenêtre, avec pagination par curseur."""
    all_rows, last_id, page = [], "", 0
    print(f"⛓️  Fetch swaps {config.TOKEN0_SYMBOL}/{config.TOKEN1_SYMBOL} "
          f"[{config.START_TS} → {config.END_TS}]")

    while True:
        data = _post(SWAPS_QUERY, {
            "pool": config.POOL_ADDRESS.lower(),
            "start": config.START_TS,
            "end": config.END_TS,
            "lastId": last_id,
        })
        batch = data["swaps"]
        if not batch:
            break
        all_rows.extend(batch)
        last_id = batch[-1]["id"]
        page += 1
        print(f"   page {page:>3}  (+{len(batch):>4})  total={len(all_rows)}")
        if len(batch) < 1000:
            break
        time.sleep(0.15)  # courtoisie gateway

    if not all_rows:
        sys.exit("❌ 0 swap récupéré. Vérifie la pool, la fenêtre ou la clé API.")

    df = pd.DataFrame(all_rows)
    # Types numériques (les montants v3 sont en unités humaines signées)
    df["timestamp"] = df["timestamp"].astype("int64")
    for col in ["amount0", "amount1", "amountUSD"]:
        df[col] = df[col].astype("float64")
    for col in ["sqrtPriceX96", "tick", "liquidity"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.sort_values("timestamp").reset_index(drop=True)
    return df


def main():
    os.makedirs(config.DATA_DIR, exist_ok=True)
    df = fetch_swaps()
    df.to_csv(config.RAW_SWAPS_CSV, index=False)
    span_h = (df["timestamp"].max() - df["timestamp"].min()) / 3600
    print("\n✅ Extraction terminée")
    print(f"   swaps      : {len(df):,}")
    print(f"   fenêtre    : {span_h:.1f} h")
    print(f"   volume tot : ${df['amountUSD'].sum():,.0f}")
    print(f"   fichier    : {config.RAW_SWAPS_CSV}")


if __name__ == "__main__":
    main()
