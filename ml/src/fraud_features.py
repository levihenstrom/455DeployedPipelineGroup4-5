"""Shared fraud feature frame built from operational tables (Postgres / SQLite export)."""
from __future__ import annotations
import numpy as np
import pandas as pd

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
    fraud_df["order_datetime"] = pd.to_datetime(fraud_df["order_datetime"], utc=True, errors="coerce")
    fraud_df["created_at"] = pd.to_datetime(fraud_df["created_at"], utc=True, errors="coerce")
    fraud_df["birthdate"] = pd.to_datetime(fraud_df["birthdate"], utc=True, errors="coerce")
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
        "order_id", "customer_id", "order_total", "order_subtotal",
        "shipping_fee", "tax_amount", "risk_score", "payment_method",
        "device_type", "ip_country", "promo_used", "customer_segment",
        "loyalty_tier", "gender", "state", "shipping_state",
        "shipping_method", "distance_band", "promised_days", "actual_days",
        "items_per_order", "unique_products", "avg_item_price",
        "customer_age", "account_age_days", "shipping_to_subtotal_ratio",
        "tax_to_subtotal_ratio", "is_fraud",
    ]
    fraud_df = fraud_df[selected_columns].copy()
    for col in ["unique_products", "promised_days", "actual_days"]:
        fraud_df[col] = fraud_df[col].fillna(0)
    for col in [
        "payment_method", "device_type", "ip_country", "customer_segment",
        "loyalty_tier", "gender", "state", "shipping_state",
        "shipping_method", "dis
