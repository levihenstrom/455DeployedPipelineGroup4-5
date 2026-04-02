import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";

export async function GET() {
  const reportsDir = join(process.cwd(), "..", "ml", "reports");
  const monitoringDir = join(process.cwd(), "..", "ml", "monitoring");

  let retrainLog = null;
  const retrainLogPath = join(reportsDir, "retrain_log.jsonl");
  if (existsSync(retrainLogPath)) {
    const content = readFileSync(retrainLogPath, "utf-8").trim();
    if (content) {
        const lines = content.split("\n");
        try { retrainLog = JSON.parse(lines[lines.length - 1]); } catch(e) {}
    }
  }

  let metricsSummary = null;
  const metricsPath = join(reportsDir, "metrics_summary.json");
  if (existsSync(metricsPath)) {
    try { metricsSummary = JSON.parse(readFileSync(metricsPath, "utf-8")); } catch(e) {}
  }

  let retrainTrigger = null;
  const triggerPath = join(monitoringDir, "retrain_trigger.json");
  if (existsSync(triggerPath)) {
    try { retrainTrigger = JSON.parse(readFileSync(triggerPath, "utf-8")); } catch(e) {}
  }

  return NextResponse.json({ retrainLog, metricsSummary, retrainTrigger });
}

export async function POST() {
  const isVercelRuntime = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
  
  if (isVercelRuntime) {
    // Vercel Serverless environment - trigger GitHub Action webhook
    const githubToken = process.env.GITHUB_PAT;
    const repo = process.env.GITHUB_REPO; // e.g. "levihenstrom/455DeployedPipelineGroup4-5"
    
    if (githubToken && repo) {
      const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
        method: "POST",
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "Authorization": `token ${githubToken}`
        },
        body: JSON.stringify({ event_type: "retrain_pipeline" })
      });
      if (res.ok) {
        return NextResponse.json({
          status: "started",
          message: "Pipeline retraining triggered via GitHub Actions",
          started_at: new Date().toISOString()
        });
      }
    }
    
    return NextResponse.json({
      status: "error",
      message: "Background python subprocesses are not supported on Vercel. Please configure GITHUB_PAT and GITHUB_REPO to trigger retraining on Vercel."
    }, { status: 501 });
    
  } else {
    // Local dev: spawn Python subprocess
    const pythonBin = process.env.PYTHON_BIN || "python3";
    const scriptPath = join(process.cwd(), "..", "ml", "src", "retrain_pipeline.py");

    const child = spawn(pythonBin, [scriptPath], {
      detached: true,
      stdio: 'ignore'
    });
    
    child.unref();

    return NextResponse.json({
      status: "started",
      message: "Running python pipeline locally",
      run_id: child.pid,
      started_at: new Date().toISOString()
    });
  }
}
