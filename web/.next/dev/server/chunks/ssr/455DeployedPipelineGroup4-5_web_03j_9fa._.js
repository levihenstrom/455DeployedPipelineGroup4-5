module.exports = [
"[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FraudPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/455DeployedPipelineGroup4-5/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/455DeployedPipelineGroup4-5/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function FraudPage() {
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    async function onSubmit(formData) {
        setLoading(true);
        const payload = Object.fromEntries(formData.entries());
        const res = await fetch("/api/predict/fraud", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        setResult(data);
        setLoading(false);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "card",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "Fraud Prediction"
            }, void 0, false, {
                fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                lineNumber: 26,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                action: onSubmit,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "order_total",
                        type: "number",
                        step: "0.01",
                        placeholder: "order_total",
                        defaultValue: "120.50",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 28,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "order_subtotal",
                        type: "number",
                        step: "0.01",
                        placeholder: "order_subtotal",
                        defaultValue: "110.00",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "shipping_fee",
                        type: "number",
                        step: "0.01",
                        placeholder: "shipping_fee",
                        defaultValue: "5.00",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 30,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "tax_amount",
                        type: "number",
                        step: "0.01",
                        placeholder: "tax_amount",
                        defaultValue: "5.50",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 31,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "risk_score",
                        type: "number",
                        step: "0.01",
                        placeholder: "risk_score",
                        defaultValue: "60.00",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 32,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        name: "payment_method",
                        defaultValue: "card",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "card",
                                children: "card"
                            }, void 0, false, {
                                fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                                lineNumber: 34,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "paypal",
                                children: "paypal"
                            }, void 0, false, {
                                fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                                lineNumber: 35,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "bank",
                                children: "bank"
                            }, void 0, false, {
                                fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                                lineNumber: 36,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "crypto",
                                children: "crypto"
                            }, void 0, false, {
                                fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                                lineNumber: 37,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 33,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        name: "device_type",
                        defaultValue: "mobile",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "mobile",
                                children: "mobile"
                            }, void 0, false, {
                                fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                                lineNumber: 40,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "desktop",
                                children: "desktop"
                            }, void 0, false, {
                                fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                                lineNumber: 41,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "tablet",
                                children: "tablet"
                            }, void 0, false, {
                                fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                                lineNumber: 42,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "ip_country",
                        defaultValue: "US",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "promo_used",
                        type: "number",
                        min: "0",
                        max: "1",
                        defaultValue: "0",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 45,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "customer_segment",
                        defaultValue: "standard",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 46,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "loyalty_tier",
                        defaultValue: "silver",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 47,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "gender",
                        defaultValue: "Female",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 48,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "state",
                        defaultValue: "CA",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "shipping_state",
                        defaultValue: "CA",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 50,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "shipping_method",
                        defaultValue: "standard",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 51,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "distance_band",
                        defaultValue: "regional",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 52,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "promised_days",
                        type: "number",
                        defaultValue: "3",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 53,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "actual_days",
                        type: "number",
                        defaultValue: "3",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 54,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "items_per_order",
                        type: "number",
                        defaultValue: "2",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 55,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "unique_products",
                        type: "number",
                        defaultValue: "2",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 56,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "avg_item_price",
                        type: "number",
                        step: "0.01",
                        defaultValue: "55.00",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "customer_age",
                        type: "number",
                        step: "0.1",
                        defaultValue: "31",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "account_age_days",
                        type: "number",
                        defaultValue: "250",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "shipping_to_subtotal_ratio",
                        type: "number",
                        step: "0.0001",
                        defaultValue: "0.0455",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 60,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "tax_to_subtotal_ratio",
                        type: "number",
                        step: "0.0001",
                        defaultValue: "0.0500",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "submit",
                        children: loading ? "Predicting..." : "Predict Fraud"
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 62,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                lineNumber: 27,
                columnNumber: 7
            }, this),
            result && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: [
                    "Prediction: ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$455DeployedPipelineGroup4$2d$5$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: result.prediction === 1 ? "Fraud Risk" : "Not Fraud"
                    }, void 0, false, {
                        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                        lineNumber: 66,
                        columnNumber: 23
                    }, this),
                    " (",
                    (result.probability * 100).toFixed(2),
                    "%)"
                ]
            }, void 0, true, {
                fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
                lineNumber: 65,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/455DeployedPipelineGroup4-5/web/src/app/fraud/page.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
}),
"[project]/455DeployedPipelineGroup4-5/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/455DeployedPipelineGroup4-5/web/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime;
}),
];

//# sourceMappingURL=455DeployedPipelineGroup4-5_web_03j_9fa._.js.map