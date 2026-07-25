#!/usr/bin/env bash
#
# E2E full-stack CircuitBreaker.ai — enchaîne toute la chaîne et vérifie
# chaque étape : données -> CBRI -> backtest τ* -> ancrage 0G -> évacuation.
# Sert de répétition générale avant la démo.
#
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(pwd)"
PASS=0; FAIL=0

step() { printf "\n\033[1m▶ %s\033[0m\n" "$1"; }
check() { # check "<label>" "<pattern>" "<texte>"  — compteurs dans le shell courant
  if printf '%s' "$3" | grep -q "$2"; then printf "  \033[32m✓\033[0m %s\n" "$1"; PASS=$((PASS+1))
  else printf "  \033[31m✗ %s\033[0m (motif manquant: %s)\n" "$1" "$2"; FAIL=$((FAIL+1)); fi
}
have() { # have "<label>" "<fichier>"
  if [ -f "$2" ]; then printf "  \033[32m✓\033[0m %s\n" "$1"; PASS=$((PASS+1))
  else printf "  \033[31m✗ %s\033[0m (absent: %s)\n" "$1" "$2"; FAIL=$((FAIL+1)); fi
}

# ── 0. Données (extraction si absentes) ──────────────────────
step "0. Données The Graph (depeg USDC mars 2023)"
cd "$ROOT/quant-backtest"
source .venv/bin/activate
SWAPS="data/swaps_USDC_depeg_SVB_2023-03.csv"
if [ ! -f "$SWAPS" ]; then
  echo "  extraction depuis The Graph…"
  python thegraph_client.py >/dev/null
fi
have "swaps présents" "$SWAPS"

# ── 1. CBRI ──────────────────────────────────────────────────
step "1. Calcul du CBRI (features.py)"
OUT=$(python features.py 2>/dev/null)
check "CBRI calculé"          "CBRI calculé"                    "$OUT"
check "CBRI sature à 100"     "CBRI max         : 100"          "$OUT"
check "fond USDC ~\$0.87"     "USDC min         : 0.87"         "$OUT"

# ── 2. Backtest τ* ───────────────────────────────────────────
step "2. Backtest τ* (backtest.py)"
OUT=$(python backtest.py 2>/dev/null)
check "τ* = 66"               "τ\* optimal                : 66" "$OUT"
check "fonds sauvés calculés" "FONDS SAUVÉS"                    "$OUT"
for f in fig1_cbri_vs_price fig2_funds_saved_vs_tau fig3_slippage_explosion; do
  have "figure $f.png" "output/$f.png"
done

# ── 3. Traçabilité 0G ────────────────────────────────────────
step "3. Ancrage 0G du modèle + scores (publish0g)"
cd "$ROOT/live-execution"
[ -d node_modules ] || npm install --silent >/dev/null 2>&1
OUT=$(npm run --silent publish0g 2>/dev/null)
check "attestation construite"   "Attestation CBRI construite"  "$OUT"
check "root hash 0G (0x…)"        "0G Storage root hash : 0x"    "$OUT"

# ── 4. Évacuation (démo Uniswap) ─────────────────────────────
step "4. Déclenchement du disjoncteur (démo Uniswap)"
OUT=$(npm run --silent demo 2>/dev/null | tr '\r' '\n')
check "disjoncteur déclenché"     "DISJONCTEUR DÉCLENCHÉ"        "$OUT"
check "évacuation via Uniswap"     "USDT en sortie\|USDT (modélisé" "$OUT"
check "position à l'abri"          "à l'abri en USDT"            "$OUT"

# ── Bilan ────────────────────────────────────────────────────
printf "\n\033[1m═══ E2E : %d ✓  /  %d ✗ ═══\033[0m\n" "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] && { echo "🟢 Chaîne complète opérationnelle."; exit 0; } \
                  || { echo "🔴 Des étapes ont échoué."; exit 1; }
