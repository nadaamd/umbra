"""Rend les modules de quant-backtest/ importables depuis les tests."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
