"""
Extraction des données Uniswap v3 depuis The Graph (subgraphs, réseau décentralisé).

4 flux, chacun alimentant un morceau du CBRI :
  1. swaps (pool cible)      -> sqrtPriceX96 (prix) + amount0/1 (order flow / OFI)
  2. mints + burns (cible)   -> fuite de liquidité event-par-event (drain velocity)
  3. poolHourData (cible)    -> tvlUSD horaire (baseline pour normaliser la fuite)
  4. poolHourData (réf USDT) -> ETH/USD on-chain (pour isoler le depeg USDC)

Pagination robuste par curseur `id_gt` (pas de `skip`, plafonné à 5000).
"""
import os
import sys
import time
import requests
import pandas as pd

import config


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


def _paginate(entity: str, fields: str, pool: str, extra_where: str = "") -> list:
    """Pagine une entité event-level (swaps/mints/burns) par curseur id_gt."""
    query = f"""
    query Q($pool: String!, $start: Int!, $end: Int!, $lastId: String!) {{
      {entity}(
        first: 1000
        orderBy: id
        orderDirection: asc
        where: {{ pool: $pool, timestamp_gte: $start, timestamp_lt: $end, id_gt: $lastId {extra_where} }}
      ) {{ {fields} }}
    }}
    """
    rows, last_id, page = [], "", 0
    while True:
        data = _post(query, {
            "pool": pool.lower(),
            "start": config.START_TS,
            "end": config.END_TS,
            "lastId": last_id,
        })
        batch = data[entity]
        if not batch:
            break
        rows.extend(batch)
        last_id = batch[-1]["id"]
        page += 1
        print(f"   {entity:<6} page {page:>3}  (+{len(batch):>4})  total={len(rows)}")
        if len(batch) < 1000:
            break
        time.sleep(0.12)
    return rows


# ── 1. Swaps : prix + order flow ─────────────────────────────
def fetch_swaps(pool: str) -> pd.DataFrame:
    rows = _paginate("swaps", "id timestamp amount0 amount1 amountUSD sqrtPriceX96 tick", pool)
    df = pd.DataFrame(rows)
    if df.empty:
        sys.exit("❌ 0 swap récupéré. Vérifie la pool / la fenêtre / la clé.")
    df["timestamp"] = df["timestamp"].astype("int64")
    for c in ["amount0", "amount1", "amountUSD"]:
        df[c] = df[c].astype("float64")
    for c in ["sqrtPriceX96", "tick"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    return df.sort_values("timestamp").reset_index(drop=True)


# ── 2. Mints + Burns : fuite de liquidité ────────────────────
def fetch_liquidity_events(pool: str) -> pd.DataFrame:
    frames = []
    for entity, sign in [("mints", +1.0), ("burns", -1.0)]:
        rows = _paginate(entity, "id timestamp amountUSD amount0 amount1", pool)
        if rows:
            d = pd.DataFrame(rows)
            d["timestamp"] = d["timestamp"].astype("int64")
            d["amountUSD"] = d["amountUSD"].astype("float64")
            # signe : +liquidité ajoutée (mint), -liquidité retirée (burn)
            d["liq_usd_signed"] = sign * d["amountUSD"]
            d["type"] = entity
            frames.append(d[["timestamp", "type", "amountUSD", "liq_usd_signed"]])
    df = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame(
        columns=["timestamp", "type", "amountUSD", "liq_usd_signed"])
    return df.sort_values("timestamp").reset_index(drop=True)


# ── 3 & 4. poolHourData : TVL baseline + réf ETH/USD ─────────
def fetch_pool_hour_data(pool: str) -> pd.DataFrame:
    query = """
    query H($pool: String!, $start: Int!, $end: Int!, $skip: Int!) {
      poolHourDatas(
        first: 1000 skip: $skip
        orderBy: periodStartUnix orderDirection: asc
        where: { pool: $pool, periodStartUnix_gte: $start, periodStartUnix_lt: $end }
      ) { periodStartUnix liquidity tvlUSD volumeUSD token0Price token1Price }
    }
    """
    rows, skip = [], 0
    while True:
        data = _post(query, {"pool": pool.lower(), "start": config.START_TS,
                             "end": config.END_TS, "skip": skip})
        batch = data["poolHourDatas"]
        rows.extend(batch)
        if len(batch) < 1000:
            break
        skip += 1000
    df = pd.DataFrame(rows)
    if df.empty:
        return df
    df["timestamp"] = df["periodStartUnix"].astype("int64")
    for c in ["tvlUSD", "volumeUSD", "token0Price", "token1Price", "liquidity"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    return df.sort_values("timestamp").reset_index(drop=True)


def main():
    os.makedirs(config.DATA_DIR, exist_ok=True)
    print(f"⛓️  Fenêtre {config.CRASH_NAME}  [{config.START_TS} → {config.END_TS}]\n")

    print("① swaps (pool cible)")
    swaps = fetch_swaps(config.POOL_ADDRESS)
    swaps.to_csv(config.RAW_SWAPS_CSV, index=False)

    print("② mints/burns (pool cible)")
    liq = fetch_liquidity_events(config.POOL_ADDRESS)
    liq.to_csv(config.RAW_LIQ_CSV, index=False)

    print("③ poolHourData (pool cible — TVL baseline)")
    hourly = fetch_pool_hour_data(config.POOL_ADDRESS)
    hourly.to_csv(config.RAW_HOURLY_CSV, index=False)

    print("④ poolHourData (USDC/USDT — signal depeg direct)")
    ref = fetch_pool_hour_data(config.DEPEG_POOL_ADDRESS)
    ref.to_csv(config.RAW_DEPEG_HOURLY_CSV, index=False)

    print("\n✅ Extraction terminée")
    print(f"   swaps        : {len(swaps):,}  (vol ${swaps['amountUSD'].sum():,.0f})")
    print(f"   liq events   : {len(liq):,}  "
          f"(mints {sum(liq['type']=='mints')}, burns {sum(liq['type']=='burns')})")
    print(f"   pool hourly  : {len(hourly)} pts")
    print(f"   ref hourly   : {len(ref)} pts")
    print(f"   → {config.DATA_DIR}")


if __name__ == "__main__":
    main()
