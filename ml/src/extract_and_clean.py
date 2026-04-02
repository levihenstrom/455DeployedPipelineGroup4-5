from __future__ import annotations

import os
from pathlib import Path

import numpy as np
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

from fraud_features import build_fraud_dataset

ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "data" / "raw"
PROCESSED_DIR = ROOT / "data" / "processed"


def get_engine() -> Engine:
    """Postgres (Supabase) via DATABASE_URL, or local SQLite ``shop.db`` for offline work."""
    url = os.getenv("DATABASE_URL", "").strip()
    if url.startswith("postgresql://"):
        return create_engine(url)
    if url.startswith("sqlite:///"):
        return create_engine(url)

    shop_path = os.getenv("SHOP_DB_PATH", "").strip()
    db_file = Path(shop_path).resolve() if shop_path else (ROOT / "shop.db")
    if db_file.exists():
        return create_engine(f"sqlite:///{db_file}")

    if url:
        raise ValueError(
            "DATABASE_URL must start with postgresql:// or sqlite:/// "
            "(or unset it to use ./shop.db / SHOP_DB_PATH)."
        )
    raise FileNotFoundError(
        f"No database found. Add {ROOT / 'shop.db'}, set SHOP_DB_PATH, or set DATABASE_URL to Postgres."
    )


def load_table(engine: Engine, table_name: str) -> pd.DataFrame:
    return pd.read_sql_query(f"SELECT * FROM {table_name}", engine)


def export_raw_tables(engine: Engine) -> dict[str, pd.DataFrame]:
    tables = [
        "customers",
        "products",
        "orders",
        "order_items",
        "shipments",
        "product_reviews",
    ]
    dataframes: dict[str, pd.DataFrame] = {}
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    for table in tables:
        df = load_table(engine, table)
        dataframes[table] = df
        df.to_csv(RAW_DIR / f"{table}.csv", index=False)
    return dataframes


def build_delivery_dataset(dfs: dict[str, pd.DataFrame]) -> pd.DataFrame:
    shipments = dfs["shipments"].copy()
    orders = dfs["orders"].copy()
    customers = dfs["customers"].copy()
    items = dfs["order_items"].copy()

    order_item_aggs = (
        items.groupby("order_id")
        .agg(total_items=("quantity", "sum"), unique_products=("product_id", "nunique"))
        .reset_index()
    )

    delivery_df = shipments.merge(
        orders[
            [
                "order_id",
                "order_datetime",
                "shipping_state",
                "order_total",
                "order_subtotal",
                "shipping_fee",
                "tax_amount",
                "payment_method",
                "device_type",
                "ip_country",
                "promo_used",
                "customer_id",
            ]
        ],
        on="order_id",
        how="left",
    )
    delivery_df = delivery_df.merge(
        customers[["customer_id", "customer_segment", "loyalty_tier", "state"]],
        on="customer_id",
        how="left",
    )
    delivery_df = delivery_df.merge(order_item_aggs, on="order_id", how="left")

    delivery_df["ship_datetime"] = pd.to_datetime(delivery_df["ship_datetime"], errors="coerce")
    delivery_df["order_datetime"] = pd.to_datetime(delivery_df["order_datetime"], errors="coerce")
    delivery_df["hours_to_ship"] = (
        (delivery_df["ship_datetime"] - delivery_df["order_datetime"]).dt.total_seconds() / 3600
    ).clip(lower=0)
    delivery_df["actual_minus_promised"] = delivery_df["actual_days"] - delivery_df["promised_days"]
    delivery_df["shipping_to_subtotal_ratio"] = np.where(
        delivery_df["order_subtotal"] > 0,
        delivery_df["shipping_fee"] / delivery_df["order_subtotal"],
        0,
    )

    for col in ["carrier", "shipping_method", "distance_band", "shipping_state", "state"]:
        delivery_df[col] = delivery_df[col].fillna("UNKNOWN")
    for col in ["total_items", "unique_products", "hours_to_ship"]:
        delivery_df[col] = delivery_df[col].fillna(0)

    delivery_df["promo_used"] = delivery_df["promo_used"].fillna(0).astype(int)
    delivery_df["late_delivery"] = delivery_df["late_delivery"].fillna(0).astype(int)

    selected_columns = [
        "shipment_id",
        "order_id",
        "carrier",
        "shipping_method",
        "distance_band",
        "promised_days",
        "actual_days",
        "actual_minus_promised",
        "hours_to_ship",
        "shipping_state",
        "state",
        "order_total",
        "order_subtotal",
        "shipping_fee",
        "tax_amount",
        "shipping_to_subtotal_ratio",
        "payment_method",
        "device_type",
        "ip_country",
        "promo_used",
        "customer_segment",
        "loyalty_tier",
        "total_items",
        "unique_products",
        "late_delivery",
    ]
    return delivery_df[selected_columns].copy()


def main() -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    engine = get_engine()
    dfs = export_raw_tables(engine)

    fraud_df = build_fraud_dataset(dfs)
    delivery_df = build_delivery_dataset(dfs)

    fraud_df.to_csv(PROCESSED_DIR / "fraud_dataset.csv", index=False)
    delivery_df.to_csv(PROCESSED_DIR / "delivery_dataset.csv", index=False)

    print("Saved processed datasets:")
    print(f"- {PROCESSED_DIR / 'fraud_dataset.csv'} ({len(fraud_df)} rows)")
    print(f"- {PROCESSED_DIR / 'delivery_dataset.csv'} ({len(delivery_df)} rows)")


if __name__ == "__main__":
    main()
