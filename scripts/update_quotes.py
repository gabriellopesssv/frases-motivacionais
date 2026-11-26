import json
from datetime import date, datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "quotes_catalog.json"
OUTPUT = ROOT / "quotes.json"
EPOCH = date(2025, 1, 1)


def build_payload(today: date) -> dict:
    quotes = json.loads(CATALOG.read_text(encoding="utf-8"))
    if len(quotes) < 2:
        raise ValueError("The quote catalog must contain at least two quotes.")

    daily_index = (today - EPOCH).days % len(quotes)
    return {
        "updatedAt": today.isoformat(),
        "dailyQuoteId": quotes[daily_index]["id"],
        "quotes": quotes,
    }


def main() -> None:
    today = datetime.now(timezone.utc).date()
    payload = build_payload(today)
    OUTPUT.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Updated {OUTPUT.name} with {len(payload['quotes'])} quotes for {today}.")


if __name__ == "__main__":
    main()
