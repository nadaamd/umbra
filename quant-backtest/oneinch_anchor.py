"""
Ancre 1inch — coût d'exécution LIVE d'une évacuation de $1M USDC -> USDT.

Rôle dans le backtest : point d'ancrage "marché calme, liquidité profonde".
On calibre le modèle de slippage historique pour qu'il colle à ce coût réel
en conditions normales, puis on le laisse exploser sur la liquidité effondrée
du crash. -> matérialise le sponsor 1inch dans le même graphe que The Graph.

En prod (Mission 3), c'est ce même endpoint qui exécute l'évacuation réelle.
"""
import sys
import requests

import config

QUOTE_URL = "https://api.1inch.dev/swap/v6.0/1/quote"


def live_exit_slippage(position_usd: float = None) -> dict:
    """Interroge 1inch pour le slippage live d'une sortie USDC->USDT."""
    position_usd = position_usd or config.POSITION_USD
    amount_raw = int(position_usd * 10 ** 6)   # USDC : 6 décimales

    if not config.ONEINCH_API_KEY:
        return {
            "ok": False,
            "slippage": config.SLIP_CALM_DEFAULT,
            "note": "ONEINCH_API_KEY absente -> fallback 5 bps (défaut calme).",
        }

    try:
        resp = requests.get(
            QUOTE_URL,
            params={"src": config.USDC_ADDRESS, "dst": config.USDT_ADDRESS,
                    "amount": str(amount_raw)},
            headers={"Authorization": f"Bearer {config.ONEINCH_API_KEY}"},
            timeout=15,
        )
        resp.raise_for_status()
        out_raw = float(resp.json()["dstAmount"])
        out_usdt = out_raw / 10 ** 6               # USDT : 6 décimales
        slippage = max(0.0, 1.0 - out_usdt / position_usd)
        return {
            "ok": True,
            "slippage": slippage,
            "out_usdt": out_usdt,
            "note": f"1inch live : ${position_usd:,.0f} USDC -> {out_usdt:,.0f} USDT "
                    f"({slippage*1e4:.1f} bps)",
        }
    except Exception as e:
        return {
            "ok": False,
            "slippage": config.SLIP_CALM_DEFAULT,
            "note": f"1inch indisponible ({e}) -> fallback 5 bps.",
        }


if __name__ == "__main__":
    r = live_exit_slippage()
    print(r["note"])
    print(f"slippage calme retenu : {r['slippage']*1e4:.1f} bps")
    if not r["ok"]:
        print("→ pour l'ancre live, ajoute ONEINCH_API_KEY dans .env "
              "(clé gratuite sur https://portal.1inch.dev/).", file=sys.stderr)
