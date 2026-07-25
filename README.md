# 🛑 CircuitBreaker.ai

> **Le disjoncteur financier autonome de la DeFi.**
> Détecte les risques systémiques (crises de liquidité, depegs) via un modèle quantitatif, et évacue automatiquement les fonds des utilisateurs vers un stablecoin sûr — **avant** que la pool ne s'effondre.

🏆 *ETH Global Lisbon 2026 — Tracks : The Graph · 0G · 1inch*

---

## 🎯 Le problème

Quand une pool DeFi part en crise (depeg, fuite de liquidité), l'utilisateur moyen s'en rend compte **trop tard** : le temps de comprendre, la liquidité s'est évaporée et le slippage de sortie a explosé. Les pertes de mars 2023 (depeg USDC), Terra/UST, stETH… se comptent en **milliards**.

## 💡 La solution

Un **disjoncteur** on-chain qui surveille en continu un **Score de Risque (CBRI, 0→100)** et déclenche une évacuation d'urgence dès que le seuil optimal `τ*` est franchi.

- **Modèle quant (CBRI)** — 3 signaux agrégés en *Noisy-OR* : vitesse de fuite de liquidité, déséquilibre de pool, divergence de prix.
- **Seuil optimal `τ*`** — prouvé par backtesting sur de vrais crashs : le point exact qui **maximise les fonds sauvés nets**.
- **Business model aligné** — *success fee* uniquement sur la perte évitée. On ne gagne que si l'utilisateur gagne.

## 🏗️ Architecture & Sponsors

| Couche | Sponsor | Rôle |
|---|---|---|
| **Données** | **The Graph** | Historique + temps réel des pools Uniswap v3 (swaps tick-level, liquidité, prix) |
| **IA / Infra** | **0G** | Stockage & traçabilité décentralisée du modèle et des scores de risque |
| **Exécution** | **1inch** | Best-execution multi-DEX de l'évacuation d'urgence |

> **Rigueur backtest vs prod :** le backtest **simule l'exécution contre la liquidité on-chain historique** (physique réelle de la pool via The Graph) ; la prod utilise **1inch** pour le routing live. On price le passé par la physique, on exécute le présent par le meilleur routeur.

## 📂 Structure

```
circuitbreaker-ai/
├── quant-backtest/     # Python — le cerveau (modèle CBRI + backtesting)
└── live-execution/     # TypeScript — les muscles (exécution 1inch)
```

## 📊 Résultat backtest — Depeg USDC (SVB, 11 mars 2023)

Rejoué sur **48 066 swaps réels** ($5,57 Md de volume) extraits via The Graph, pour une **position de $1M USDC**.

| | |
|---|---|
| **τ\* optimal** | **66 / 100** (plateau optimal [10–66], 0 faux positif en marché calme) |
| **Déclenchement** | 10/03 14:10 UTC — *17h avant le fond*, USDC encore à **$1.0000** |
| **Fond du depeg (sans agir)** | $0.8726 → position à **$872 595** |
| **💰 Fonds sauvés** | **$126 900 (12,7 %)** — success fee 10 % = **$12 690** |

**Le coût d'attendre** (chaque point de CBRI attendu = de l'argent perdu) :

| Seuil τ | Sortie | Prix | Slippage | Sauvés |
|---|---|---|---|---|
| **10–66 (τ\*)** | 10/03 14:10 | **$1.0000** | 5 bps | **$126.9k** |
| 67–72 | 11/03 00:15 | $0.9892 | 53 bps | $111.4k |
| 73–98 | 11/03 01:00 | $0.9726 | 91 bps | $91.1k |
| 99 | 11/03 03:00 | $0.9371 | **657 bps** | $2.9k |

> La liquidité active de la pool USDC/USDT s'effondre de **×23 000 000** pendant le crash → le slippage de sortie explose. Sortir à τ\* = quasi gratuit ; attendre la confirmation = mur de liquidité.

![CBRI vs prix](quant-backtest/output/fig1_cbri_vs_price.png)
![Fonds sauvés vs τ](quant-backtest/output/fig2_funds_saved_vs_tau.png)
![Explosion du slippage](quant-backtest/output/fig3_slippage_explosion.png)

## 🧮 Le modèle : CBRI (CircuitBreaker Risk Index)

3 sous-signaux normalisés par sigmoïde, agrégés en **Noisy-OR pondéré** (un disjoncteur saute si *un seul* signal vire au rouge) :

```
CBRI = 100 · (1 − ∏ᵢ (1 − wᵢ·sᵢ))        sᵢ = σ(αᵢ·(xᵢ − seuilᵢ))
```

| Signal | Mesure | Rôle | Source |
|---|---|---|---|
| **Fuite de liquidité** | vitesse de retrait LP (mints−burns / TVL·h) | **alerte précoce** | swaps + mints/burns |
| **Order-Flow Imbalance** | unidirectionnalité du flux | diagnostic (w=0 ici, non-discriminant) | swaps |
| **Divergence / depeg** | \|1 − prix USDC\| | **confirmation** | pool stable USDC/USDT |

## 🚀 Démarrage

```bash
cp .env.example .env      # THEGRAPH_API_KEY (requis) + ONEINCH_API_KEY (ancre live)
cd quant-backtest && pip install -r requirements.txt
python thegraph_client.py   # ① extraction des données du crash
python features.py          # ② calcul du CBRI
python backtest.py          # ③ backtest τ* + figures
```

---

*MVP hackathon — architecture publique assumée (pas de couche privacy/MEV sur ce périmètre).*
