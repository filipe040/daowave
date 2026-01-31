"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, HelpCircle } from "lucide-react";

interface HealthStatus {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  environment: string;
  services: {
    database: {
      status: string;
      latency?: number;
      error?: string;
    };
    storage: {
      status: string;
      latency?: number;
      error?: string;
    };
    email: {
      status: string;
      latency?: number;
      error?: string;
    };
    payments: {
      stripe: boolean;
      mock: boolean;
    };
  };
}

interface CriticalError {
  id: string;
  message: string;
  level: string;
  timestamp: string;
  context?: Record<string, any>;
}

export default function SystemStatusPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [errors, setErrors] = useState<CriticalError[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
    } catch (error) {
      console.error("Failed to fetch health status:", error);
    }
  };

  const fetchErrors = async () => {
    try {
      const res = await fetch("/api/admin/system/errors");
      if (res.ok) {
        const data = await res.json();
        setErrors(data.errors || []);
      }
    } catch (error) {
      console.error("Failed to fetch errors:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchHealth(), fetchErrors()]);
      setLoading(false);
    };

    loadData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchHealth();
        fetchErrors();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "text-green-600 bg-green-50";
      case "error":
        return "text-red-600 bg-red-50";
      case "degraded":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusBadge = (status: string) => {
    const cls = "h-5 w-5 shrink-0";
    switch (status) {
      case "ok":
        return <CheckCircle className={cls} strokeWidth={1.5} />;
      case "error":
        return <XCircle className={cls} strokeWidth={1.5} />;
      case "degraded":
        return <AlertTriangle className={cls} strokeWidth={1.5} />;
      default:
        return <HelpCircle className={cls} strokeWidth={1.5} />;
    }
  };

  if (loading) {
    return (
      <div className="w-full min-w-0 max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-700 rounded w-1/4"></div>
          <div className="h-32 bg-zinc-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Sistema</h1>
          <p className="text-base md:text-lg text-zinc-400">Estado dos serviços e erros críticos</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-zinc-400">Auto-refresh (30s)</span>
          </label>
          <button
            onClick={() => {
              setLoading(true);
              Promise.all([fetchHealth(), fetchErrors()]).then(() => setLoading(false));
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      {health && (
        <div className={`mb-6 p-4 rounded-lg ${getStatusColor(health.status)}`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getStatusBadge(health.status)}</span>
            <div>
              <h2 className="font-semibold text-lg">Overall Status: {health.status.toUpperCase()}</h2>
              <p className="text-sm">
                Environment: {health.environment} | Last checked: {new Date(health.timestamp).toLocaleString("pt-PT")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Services Status */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Database */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Database</h3>
              <span className={`px-2 py-1 rounded text-sm ${getStatusColor(health.services.database.status)}`}>
                {getStatusBadge(health.services.database.status)} {health.services.database.status}
              </span>
            </div>
            {health.services.database.latency !== undefined && (
              <p className="text-sm text-gray-600">Latency: {health.services.database.latency}ms</p>
            )}
            {health.services.database.error && (
              <p className="text-sm text-red-600 mt-1">Error: {health.services.database.error}</p>
            )}
          </div>

          {/* Storage */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Storage</h3>
              <span className={`px-2 py-1 rounded text-sm ${getStatusColor(health.services.storage.status)}`}>
                {getStatusBadge(health.services.storage.status)} {health.services.storage.status}
              </span>
            </div>
            {health.services.storage.latency !== undefined && (
              <p className="text-sm text-gray-600">Latency: {health.services.storage.latency}ms</p>
            )}
            {health.services.storage.error && (
              <p className="text-sm text-red-600 mt-1">Error: {health.services.storage.error}</p>
            )}
          </div>

          {/* Email */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Email</h3>
              <span className={`px-2 py-1 rounded text-sm ${getStatusColor(health.services.email.status)}`}>
                {getStatusBadge(health.services.email.status)} {health.services.email.status}
              </span>
            </div>
            {health.services.email.latency !== undefined && (
              <p className="text-sm text-gray-600">Latency: {health.services.email.latency}ms</p>
            )}
            {health.services.email.error && (
              <p className="text-sm text-red-600 mt-1">Error: {health.services.email.error}</p>
            )}
          </div>

          {/* Payments */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Payments</h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-sm bg-gray-100 text-gray-700">
                {health.services.payments.stripe ? <><CheckCircle className="h-4 w-4" /> Stripe</> : <><XCircle className="h-4 w-4" /> Stripe</>} |{" "}
                {health.services.payments.mock ? <><CheckCircle className="h-4 w-4" /> Mock</> : <><XCircle className="h-4 w-4" /> Mock</>}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Stripe: {health.services.payments.stripe ? "Enabled" : "Disabled"}
            </p>
            <p className="text-sm text-gray-600">
              Mock: {health.services.payments.mock ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>
      )}

      {/* Critical Errors */}
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Últimos Erros Críticos</h2>
        {errors.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum erro crítico recente</p>
        ) : (
          <div className="space-y-2">
            {errors.map((error) => (
              <div key={error.id} className="border-l-4 border-red-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-red-600">{error.message}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(error.timestamp).toLocaleString("pt-PT")}
                    </p>
                    {error.context && (
                      <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(error.context, null, 2)}
                      </pre>
                    )}
                  </div>
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                    {error.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

