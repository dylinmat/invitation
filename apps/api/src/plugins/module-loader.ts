/**
 * Module Loader Plugin
 * Plugin system for loading domain modules in the modular monolith architecture
 */

import { FastifyInstance, FastifyPluginAsync } from "fastify";
import * as path from "path";
import * as fs from "fs";
import { MODULES } from "../config";

interface ModuleDefinition {
  name?: string;
  prefix?: string;
  register?: FastifyPluginAsync;
  routes?: Array<{ method: import("fastify").HTTPMethods | import("fastify").HTTPMethods[]; url: string; handler: import("fastify").RouteHandlerMethod }>;
  [key: string]: unknown;
}

interface ModuleOptions {
  prefix?: string;
}

/**
 * Validate module structure
 */
function validateModule(module: unknown, moduleName: string): module is ModuleDefinition {
  if (typeof module !== "object" || module === null) {
    throw new Error(`Module "${moduleName}" must export an object`);
  }
  
  const mod = module as ModuleDefinition;
  
  if (mod.register && typeof mod.register !== "function") {
    throw new Error(`Module "${moduleName}" register must be a function`);
  }
  
  if (mod.name && typeof mod.name !== "string") {
    throw new Error(`Module "${moduleName}" name must be a string`);
  }
  
  if (mod.prefix && typeof mod.prefix !== "string") {
    throw new Error(`Module "${moduleName}" prefix must be a string`);
  }
  
  return true;
}

/**
 * Get list of modules to load
 */
function getModuleList(): string[] {
  const modulesPath = MODULES.AUTOLOAD_PATH;
  
  if (MODULES.ENABLED.length > 0) {
    return MODULES.ENABLED;
  }
  
  try {
    const entries = fs.readdirSync(modulesPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .filter(name => !name.startsWith("_"))
      .sort();
  } catch (error) {
    console.warn(`Could not read modules directory: ${modulesPath}`, (error as Error).message);
    return [];
  }
}

/**
 * Load a single module
 */
async function loadModule(
  fastify: FastifyInstance,
  moduleName: string,
  options: ModuleOptions = {}
): Promise<boolean> {
  const modulePath = path.join(MODULES.AUTOLOAD_PATH, moduleName);
  
  if (!fs.existsSync(modulePath)) {
    fastify.log.warn(`Module directory not found: ${moduleName}`);
    return false;
  }
  
  const indexPath = path.join(modulePath, "index.js");
  const mainPath = path.join(modulePath, `${moduleName}.js`);
  const routesPath = path.join(modulePath, "routes.js");
  
  let entryPoint: string | null = null;
  if (fs.existsSync(indexPath)) {
    entryPoint = indexPath;
  } else if (fs.existsSync(mainPath)) {
    entryPoint = mainPath;
  } else if (fs.existsSync(routesPath)) {
    entryPoint = routesPath;
  }
  
  if (!entryPoint) {
    fastify.log.warn(`No entry point found for module: ${moduleName}`);
    return false;
  }
  
  // Clear require cache for hot reloading (dev mode)
  if (process.env.NODE_ENV === "development" && require.cache[entryPoint]) {
    delete require.cache[entryPoint];
  }
  
  const module = require(entryPoint) as ModuleDefinition | FastifyPluginAsync;
  
  const prefix = options.prefix ?? `/${moduleName}`;
  
  // Handle different export patterns
  if (typeof module === "function") {
    // Direct function export - use as Fastify plugin
    await fastify.register(module as FastifyPluginAsync, { prefix });
  } else if (typeof module === "object" && module !== null) {
    validateModule(module, moduleName);
    
    if (module.register) {
      await fastify.register(module.register, { prefix, ...options });
    } else if (module.routes) {
      await fastify.register(async (instance) => {
        for (const route of module.routes || []) {
          instance.route(route);
        }
      }, { prefix, ...options });
    }
  } else {
    throw new Error(`Module "${moduleName}" must export a function or an object with register/routes`);
  }
  
  fastify.log.info(`Module loaded: ${(module as ModuleDefinition).name || moduleName} (prefix: ${prefix})`);
  
  return true;
}

/**
 * Auto-load all modules
 */
async function loadAllModules(fastify: FastifyInstance, options: ModuleOptions = {}): Promise<void> {
  const modules = getModuleList();
  
  if (modules.length === 0) {
    fastify.log.warn("No modules found to load");
    return;
  }
  
  fastify.log.info(`Loading ${modules.length} module(s)...`);
  
  const results = await Promise.allSettled(
    modules.map(name => loadModule(fastify, name, options))
  );
  
  const loaded = results.filter(r => r.status === "fulfilled" && r.value).length;
  const failed = results.filter(r => r.status === "rejected").length;
  
  if (failed > 0) {
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        fastify.log.error({ err: result.reason }, `Failed to load module: ${modules[index]}`);
      }
    });
  }
  
  fastify.log.info(`Modules loaded: ${loaded}/${modules.length}`);
}

/**
 * Register module loader plugin
 */
export async function registerModuleLoader(
  fastify: FastifyInstance,
  options: ModuleOptions = {}
): Promise<void> {
  fastify.decorate("loadModule", (name: string, opts?: ModuleOptions) => loadModule(fastify, name, opts));
  fastify.decorate("loadAllModules", () => loadAllModules(fastify, options));
  
  await loadAllModules(fastify, options);
  
  fastify.log.debug("Module loader plugin registered");
}
