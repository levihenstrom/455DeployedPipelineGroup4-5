"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Customer {
  customer_id: number;
  full_name: string;
  email: string;
  customer_segment: string;
  loyalty_tier: string;
}

export default function SelectCustomerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setCustomers(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function selectCustomer(c: Customer) {
    document.cookie = `customer_id=${c.customer_id}; path=/; max-age=${60 * 60 * 24 * 30}`;
    document.cookie = `customer_name=${encodeURIComponent(c.full_name)}; path=/; max-age=${60 * 60 * 24 * 30}`;
    router.push("/dashboard");
  }

  const filtered = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section>
      <h2>Select Customer</h2>
      <p style={{ fontSize: 14, color: "#475569", marginBottom: 12 }}>
        Choose a customer to act as. No signup or login required.
      </p>
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", marginBottom: 12 }}
      />
      {loading && <p>Loading customers...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && filtered.length === 0 && <p>No customers found.</p>}
      <div style={{ display: "grid", gap: 8 }}>
        {filtered.map((c) => (
          <div
            key={c.customer_id}
            className="card"
            style={{ cursor: "pointer" }}
            onClick={() => selectCustomer(c)}
          >
            <div style={{ fontWeight: 600 }}>{c.full_name}</div>
            <div style={{ fontSize: 13, color: "#475569" }}>
              {c.email} &middot; {c.customer_segment} &middot; {c.loyalty_tier}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
