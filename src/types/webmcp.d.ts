interface ModelContextRegisterOptions {
  signal?: AbortSignal;
}

interface ModelContextToolDefinition {
  name: string;
  title?: string;
  description: string;
  inputSchema?: object;
  execute: (...args: unknown[]) => Promise<unknown> | unknown;
  annotations?: {
    readOnlyHint?: boolean;
  };
}

interface ModelContext {
  registerTool?: (
    tool: ModelContextToolDefinition,
    options?: ModelContextRegisterOptions,
  ) => void;
  provideContext?: (context: {tools: readonly ModelContextToolDefinition[]}) => void;
}

interface Navigator {
  modelContext?: ModelContext;
}
