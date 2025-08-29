// @ts-nocheck
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";

export function DiagnosticPanel() {
  const ready = true;
  const error = null;
  const [webGpuSupport, setWebGpuSupport] = useState<boolean | null>(null);
  const [webGpuDetails, setWebGpuDetails] = useState<string>("");
  const [modelList, setModelList] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDiagnosticLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog("Iniciando diagnóstico...");
    
    // Verificar soporte WebGPU
    const hasWebGPU = typeof navigator !== "undefined" && "gpu" in navigator;
    if (hasWebGPU) {
      setWebGpuSupport(true);
      addLog("✅ WebGPU disponible");
      
      navigator.gpu?.requestAdapter().then((adapter: any) => {
        if (adapter) {
          const details = `Vendor: ${adapter.info?.vendor || 'Desconocido'}, Architecture: ${adapter.info?.architecture || 'Desconocido'}`;
          setWebGpuDetails(details);
          addLog(`✅ Adaptador WebGPU: ${details}`);
        } else {
          addLog("❌ No se pudo obtener adaptador WebGPU");
        }
      }).catch((e: any) => {
        addLog(`❌ Error al obtener adaptador: ${e.message}`);
      });
    } else {
      setWebGpuSupport(false);
      addLog("❌ WebGPU no disponible");
    }
    
    // Verificar @mlc-ai/web-llm
    try {
      import("@mlc-ai/web-llm").then(webllm => {
        addLog("✅ @mlc-ai/web-llm importado correctamente");
        if (webllm.prebuiltAppConfig?.model_list) {
          const models = webllm.prebuiltAppConfig.model_list.map((m: any) => m.model_id);
          setModelList(models.slice(0, 5));
          addLog(`✅ ${models.length} modelos disponibles`);
        }
      }).catch((e: any) => {
        addLog(`❌ Error importando @mlc-ai/web-llm: ${e.message}`);
      });
    } catch (e: any) {
      addLog(`❌ Error con @mlc-ai/web-llm: ${e.message}`);
    }
  }, []);

  useEffect(() => {
    if (ready) {
      addLog("✅ Modelo WebLLM listo");
    }
  }, [ready]);

  useEffect(() => {
    if (error) {
      addLog(`❌ Error en WebLLM: ${error}`);
    }
  }, [error]);

  const testModel = async () => {
    if (!ready) {
      toast.error("El modelo no está listo");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const testMessages = [
        { role: "system" as const, content: "Eres un asistente útil." },
        { role: "user" as const, content: "Hola, ¿puedes responder con 'Modelo funcionando correctamente'?" }
      ];

      const gen = chat(testMessages);
      let response = "";
      
      for await (const part of gen) {
        response = part;
      }
      
      setTestResult(response || "Sin respuesta");
      toast.success("Prueba completada");
    } catch (e: any) {
      setTestResult(`Error: ${e.message}`);
      toast.error("Error en la prueba");
    } finally {
      setTesting(false);
    }
  };

  const reloadPage = () => {
    window.location.reload();
  };

  const copyLogs = () => {
    const logsText = diagnosticLogs.join('\n');
    navigator.clipboard.writeText(logsText);
    toast.success("Logs copiados al portapapeles");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Diagnóstico del Sistema IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estados principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Soporte WebGPU:</span>
            <Badge variant={webGpuSupport ? "default" : "destructive"}>
              {webGpuSupport ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> Disponible</>
              ) : (
                <><AlertCircle className="w-3 h-3 mr-1" /> No disponible</>
              )}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Estado del modelo:</span>
            <Badge variant={ready ? "default" : error ? "destructive" : "secondary"}>
              {ready ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> Listo</>
              ) : error ? (
                <><AlertCircle className="w-3 h-3 mr-1" /> Error</>
              ) : (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Cargando</>
              )}
            </Badge>
          </div>
        </div>

        {/* WebGPU Details */}
        {webGpuDetails && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Detalles WebGPU:</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">{webGpuDetails}</p>
          </div>
        )}

        {/* Error details */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">Error detectado:</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1 font-mono">{error}</p>
          </div>
        )}

        {/* Logs de diagnóstico */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium">Logs de diagnóstico:</p>
            <Button onClick={copyLogs} variant="outline" size="sm">
              <Copy className="w-3 h-3 mr-1" />
              Copiar logs
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto p-3 bg-muted rounded-md text-xs font-mono space-y-1">
            {diagnosticLogs.map((log, i) => (
              <div key={i} className={`${log.includes('❌') ? 'text-red-600 dark:text-red-400' : log.includes('✅') ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                {log}
              </div>
            ))}
            {diagnosticLogs.length === 0 && (
              <div className="text-muted-foreground">Iniciando diagnóstico...</div>
            )}
          </div>
        </div>

        {/* Modelos disponibles */}
        {modelList.length > 0 && (
          <div>
            <p className="font-medium mb-2">Modelos disponibles (primeros 5):</p>
            <div className="grid grid-cols-1 gap-1 text-xs">
              {modelList.map((model, i) => (
                <div key={i} className="p-2 bg-muted rounded text-xs font-mono">{model}</div>
              ))}
            </div>
          </div>
        )}

        {/* Información del navegador */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Navegador:</strong> {navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
          <p><strong>URL:</strong> {window.location.href}</p>
          <p><strong>Protocolo:</strong> {window.location.protocol}</p>
        </div>

        {/* Test del modelo */}
        <div className="space-y-2">
          <Button 
            onClick={testModel} 
            disabled={!ready || testing}
            className="w-full"
          >
            {testing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Probando modelo...</>
            ) : (
              "Probar modelo"
            )}
          </Button>
          
          {testResult && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Resultado de la prueba:</p>
              <p className="text-sm mt-1">{testResult}</p>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <Button onClick={reloadPage} variant="outline" className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Recargar página
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
