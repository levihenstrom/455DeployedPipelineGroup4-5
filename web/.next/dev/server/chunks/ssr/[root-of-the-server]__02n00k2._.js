module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[project]/455DeployedPipelineGroup4-5/web/src/lib/dbStats.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCsvStats",
    ()=>getCsvStats
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
;
;
function getCsvStats() {
    try {
        const fraudCsv = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["readFileSync"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["join"])(process.cwd(), "..", "data", "processed", "fraud_dataset.csv"), "utf-8");
        const deliveryCsv = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["readFileSync"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["join"])(process.cwd(), "..", "data", "processed", "delivery_dataset.csv"), "utf-8");
        const fraudLines = fraudCsv.trim().split("\n");
        const deliveryLines = deliveryCsv.trim().split("\n");
        const fraudHeader = fraudLines[0].split(",");
        const deliveryHeader = deliveryLines[0].split(",");
        const fraudIdx = fraudHeader.indexOf("is_fraud");
        const lateIdx = deliveryHeader.indexOf("late_delivery");
        let fraudPositives = 0;
        let latePositives = 0;
        for(let i = 1; i < fraudLines.length; i += 1){
            const cols = fraudLines[i].split(",");
            if (Number(cols[fraudIdx]) === 1) fraudPositives += 1;
        }
        for(let i = 1; i < deliveryLines.length; i += 1){
            const cols = deliveryLines[i].split(",");
            if (Number(cols[lateIdx]) === 1) latePositives += 1;
        }
        return {
            rows: fraudLines.length - 1,
            fraudRate: fraudPositives / Math.max(1, fraudLines.length - 1),
            lateRate: latePositives / Math.max(1, deliveryLines.length - 1)
        };
    } catch  {
        return null;
    }
}
}),
"[project]/455DeployedPipelineGroup4-5/web/src/lib/supabase.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/455DeployedPipelineGroup4-5/web/node_modules/@supabase/supabase-js/dist/index.mjs [app-rsc] (ecmascript) <locals>");
;
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
const supabase = url && key ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(url, key) : null;
}),
"[project]/455DeployedPipelineGroup4-5/web/src/app/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HomePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/455DeployedPipelineGroup4-5/web/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$src$2f$lib$2f$dbStats$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/455DeployedPipelineGroup4-5/web/src/lib/dbStats.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/455DeployedPipelineGroup4-5/web/src/lib/supabase.ts [app-rsc] (ecmascript)");
;
;
;
async function HomePage() {
    // Prefer Supabase KPI view; fall back to locally processed CSV stats.
    const csvStats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$src$2f$lib$2f$dbStats$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCsvStats"])();
    let kpi = null;
    if (__TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["supabase"]) {
        try {
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["supabase"].from("vw_kpi_overview").select("*").single();
            if (!error && data) {
                kpi = {
                    total_orders: Number(data.total_orders),
                    fraud_rate_pct: Number(data.fraud_rate_pct),
                    late_delivery_rate_pct: Number(data.late_delivery_rate_pct)
                };
            }
        } catch  {
        // Keep fallback.
        }
    }
    const totalOrders = kpi?.total_orders ?? csvStats?.rows;
    const fraudRatePct = kpi?.fraud_rate_pct ?? (csvStats ? csvStats.fraudRate * 100 : null);
    const lateRatePct = kpi?.late_delivery_rate_pct ?? (csvStats ? csvStats.lateRate * 100 : null);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "grid",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "card",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "label",
                        children: "Total Orders"
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/page.tsx",
                        lineNumber: 31,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "value",
                        children: totalOrders ?? "N/A"
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/page.tsx",
                        lineNumber: 32,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/page.tsx",
                lineNumber: 30,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "card",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "label",
                        children: "Fraud Rate"
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/page.tsx",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "value",
                        children: fraudRatePct == null ? "N/A" : `${fraudRatePct.toFixed(2)}%`
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/page.tsx",
                        lineNumber: 36,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/page.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "card",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "label",
                        children: "Late Delivery Rate"
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/page.tsx",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "value",
                        children: lateRatePct == null ? "N/A" : `${lateRatePct.toFixed(2)}%`
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/page.tsx",
                        lineNumber: 40,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/page.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "card",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "label",
                        children: "Status"
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/page.tsx",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "value",
                        style: {
                            fontSize: 16
                        },
                        children: "Demo-ready baseline app"
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/page.tsx",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/page.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/page.tsx",
        lineNumber: 29,
        columnNumber: 5
    }, this);
}
}),
"[project]/455DeployedPipelineGroup4-5/web/src/app/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/455DeployedPipelineGroup4-5/web/src/app/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__02n00k2._.js.map