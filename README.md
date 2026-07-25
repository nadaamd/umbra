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

## 🚀 Démarrage

```bash
cp .env.example .env      # renseigner THEGRAPH_API_KEY
cd quant-backtest
pip install -r requirements.txt
```

---

*MVP hackathon — architecture publique assumée (pas de couche privacy/MEV sur ce périmètre).*
