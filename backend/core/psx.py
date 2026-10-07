import html
import re
from decimal import Decimal
from urllib.request import Request, urlopen

from django.core.cache import cache

_PRICE_RE = re.compile(r'quote__close">\s*Rs\.?\s*([\d,]+(?:\.\d+)?)')
_SYMBOL_RE = re.compile(r'href="/company/([A-Z0-9]+)" data-title="([^"]*)"')


def _fetch(path):
    request = Request(f"https://dps.psx.com.pk{path}", headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=8) as response:
        return response.read().decode("utf-8", "replace")


def parse_price(page):
    match = _PRICE_RE.search(page)
    return Decimal(match.group(1).replace(",", "")) if match else None


def get_price(symbol):
    """Latest PSX price for a symbol, or None if it can't be fetched."""
    # ponytail: scrapes the public PSX company page (their JSON endpoints reject server
    # requests) with a 60s per-process cache. Breaks if PSX changes the markup; swap in a
    # paid/official feed if this needs to be dependable.
    key = f"psx:{symbol}"
    price = cache.get(key)
    if price is None:
        try:
            price = parse_price(_fetch(f"/company/{symbol}"))
        except OSError:
            price = None
        if price is not None:
            cache.set(key, price, 60)
    return price


def parse_symbols(page):
    return [{"symbol": symbol, "name": html.unescape(name)} for symbol, name in _SYMBOL_RE.findall(page)]


def get_symbols():
    """All listed PSX symbols with company names (from the public screener page), cached for a day."""
    symbols = cache.get("psx:symbols")
    if symbols is None:
        try:
            symbols = parse_symbols(_fetch("/screener"))
        except OSError:
            symbols = []
        if symbols:
            cache.set("psx:symbols", symbols, 86400)
    return symbols
