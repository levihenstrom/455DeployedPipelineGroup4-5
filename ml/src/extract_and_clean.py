from __future__ import annotations

import os
from pathlib import Path

import numpy as np
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine


ROOT = Path(__file__).resolve().parents[2]
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
RAW_DIR = ROOT / "data" / "raw"
PROCESSED_DIR = ROOT / "data" / "processed"


def get_engine() -> Engine:
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is not set. Configure a Postgres connection string first.")
    if not DATABASE_URL.startswith("postgresql://"):
        raise ValueError("DATABASE_URL must be a PostgreSQL URL (postgresql://...).")
    return create_engine(DATABASE_URL)


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


def build_fraud_dataset(dfs: dict[str, pd.DataFrame]) -> pd.DataFrame:
    orders = dfs["orders"].copy()
    customers = dfs["customers"].copy()
    shipments = dfs["shipments"].copy()
    items = dfs["order_items"].copy()

    order_item_aggs = (
        items.groupby("order_id")
        .agg(
            total_items=("quantity", "sum"),
            unique_products=("product_id", "nunique"),
            avg_item_price=("unit_price", "mean"),
        )
        .reset_index()
    )

    fraud_df = orders.merge(customers, on="customer_id", how="left", suffixes=("", "_cust"))
    fraud_df = fraud_df.merge(
        shipments[["order_id", "shipping_method", "distance_band", "promised_days", "actual_days"]],
        on="order_id",
        how="left",
    )
    fraud_df = fraud_df.merge(order_item_aggs, on="order_id", how="left")

    fraud_df["promo_code"] = fraud_df["promo_code"].fillna("NONE")
    fraud_df["city"] = fraud_df["city"].fillna("UNKNOWN")
    fraud_df["state"] = fraud_df["state"].fillna("UNKNOWN")
    fraud_df["zip_code"] = fraud_df["zip_code"].fillna("00000")
    fraud_df["shipping_zip"] = fraud_df["shipping_zip"].fillna("00000")
    fraud_df["billing_zip"] = fraud_df["billing_zip"].fillna("00000")

    fraud_df["order_datetime"] = pd.to_datetime(fraud_df["order_datetime"], errors="coerce")
    fraud_df["created_at"] = pd.to_datetime(fraud_df["created_at"], errors="coerce")
    fraud_df["birthdate"] = pd.to_datetime(fraud_df["birthdate"], errors="coerce")

    fraud_df["customer_age"] = ((fraud_df["order_datetime"] - fraud_df["birthdate"]).dt.days / 365.25).clip(14, 100)
    fraud_df["account_age_days"] = (fraud_df["order_datetime"] - fraud_df["created_at"]).dt.days.clip(lower=0)
    fraud_df["items_per_order"] = fraud_df["total_items"].fillna(0)
    fraud_df["avg_item_price"] = fraud_df["avg_item_price"].fillna(0)
    fraud_df["shipping_to_subtotal_ratio"] = np.where(
        fraud_df["order_subtotal"] > 0,
        fraud_df["shipping_fee"] / fraud_df["order_subtotal"],
        0,
    )
    fraud_df["tax_to_subtotal_ratio"] = np.where(
        fraud_df["order_subtotal"] > 0,
        fraud_df["tax_amount"] / fraud_df["order_subtotal"],
        0,
    )

    fraud_df["is_active"] = fraud_df["is_active"].fillna(1).astype(int)
    fraud_df["promo_used"] = fraud_df["promo_used"].fillna(0).astype(int)
    fraud_df["is_fraud"] = fraud_df["is_fraud"].fillna(0).astype(int)

    selected_columns = [
        "order_id",
        "customer_id",
        "order_total",
        "order_subtotal",
        "shipping_fee",
        "tax_amount",
        "risk_score",
        "payment_method",
        "device_type",
        "ip_country",
        "promo_used",
        "customer_segment",
        "loyalty_tier",
        "gender",
        "state",
        "shipping_state",
        "shipping_method",
        "distance_band",
        "promised_days",
        "actual_days",
        "items_per_order",
        "unique_products",
        "avg_item_price",
        "customer_age",
        "account_age_days",
        "shipping_to_subtotal_ratio",
        "tax_to_subtotal_ratio",
        "is_fraud",
    ]
    fraud_df = fraud_df[selected_columns].copy()

    for col in ["unique_products", "promised_days", "actual_days"]:
        fraud_df[col] = fraud_df[col].fillna(0)
    for col in [
        "payment_method",
        "device_type",
        "ip_country",
        "customer_segment",
        "loyalty_tier",
        "gender",
        "state",
        "shipping_state",
        "shipping_method",
        "distance_band",
    ]:
        fraud_df[col] = fraud_df[col].fillna("UNKNOWN")

    return fraud_df


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
