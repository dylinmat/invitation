/**
 * Module Loader Plugin
 * Plugin system for loading domain modules in the modular monolith architecture
 */

const path = require("path");
const fs = require("fs");
const { MODULES } = require("../config");

/**
 * Validate module structure
 * @param {Object} module
 * @param {string} moduleName
 * @returns {boolean}
 */
function validateModule(module, moduleName) {
  // Check for required exports
  if (typeof module !== "object" || module === null) {
    throw new Error(`Module "${moduleName}" must export an object`);
  }
  
  // Check for register function (optional - modules can be simple route files)
  if (module.register && typeof module.register !== "function") {
    throw new Error(`Module "${moduleName}" register must be a function`);
  }
  
  // Check for plugin metadata
  if (module.name && typeof module.name !== "string") {
    throw new Error(`Module "${moduleName}" name must be a string`);
  }
  
  if (module.prefix && typeof module.prefix !== "string") {
    throw new Error(`Module "${moduleName}" prefix must be a string`);
  }
  
  return true;
}

/**
 * Get list of modules to load
 * @returns {string[]}
 */
function getModuleList() {
  const modulesPath = MODULES.AUTOLOAD_PATH;
  
  // If specific modules are enabled, use those
  if (MODULES.ENABLED.length > 0) {
    return MODULES.ENABLED;
  }
  
  // Auto-discover modules from modules directory
  try {
    const entries = fs.readdirSync(modulesPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .filter(name => !name.startsWith("_")) // Skip private directories
      .sort();
  } catch (error) {
    console.warn(`Could not read modules directory: ${modulesPath}`, error.message);
    return [];
  }
}

/**
 * Load a single module
 * @param {import('fastify').FastifyInstance} fastify
 * @param {string} moduleName
 * @param {Object} options
 */
async function loadModule(fastify, moduleName, options = {}) {
  const modulePath = path.join(MODULES.AUTOLOAD_PATH, moduleName);
  
  // Check if module directory exists
  if (!fs.existsSync(modulePath)) {
    fastify.log.warn(`Module directory not found: ${moduleName}`);
    return false;
  }
  
  // Look for index.js or moduleName.js
  const indexPath = path.join(modulePath, "index.js");
  const mainPath = path.join(modulePath, `${moduleName}.js`);
  const routesPath = path.join(modulePath, "routes.js");
  
  let entryPoint = null;
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
  
  // Load module
  const module = require(entryPoint);
  
  // Validate module structure
  validateModule(module, moduleName);
  
  // Determine prefix for routes
  const prefix = options.prefix ?? module.prefix ?? `/${moduleName}`;
  
  // Register module
  if (module.register) {
    // Module has explicit register function
    await fastify.register(async (instance, opts) => {
      await module.register(instance, opts);
    }, {
      prefix,
      ...options,
    });
  } else if (module.routes) {
    // Module exports routes directly
    await fastify.register(async (instance) => {
      for (const route of module.routes) {
        instance.route(route);
      }
    }, {
      prefix,
      ...options,
    });
  }
  
  fastify.log.info(`Module loaded: ${module.name || moduleName} (prefix: ${prefix})`);
  
  return true;
}

/**
 * Auto-load all modules
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
async function loadAllModules(fastify, options = {}) {
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
        fastify.log.error(
          { err: result.reason },
          `Failed to load module: ${modules[index]}`
        );
      }
    });
  }
  
  fastify.log.info(`Modules loaded: ${loaded}/${modules.length}`);
}

/**
 * Register module loader plugin
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
async function registerModuleLoader(fastify, options = {}) {
  // Decorate fastify with module utilities
  fastify.decorate("loadModule", (name, opts) => loadModule(fastify, name, opts));
  fastify.decorate("loadAllModules", () => loadAllModules(fastify, options));
  
  // Load all modules
  await loadAllModules(fastify, options);
  
  fastify.log.debug("Module loader plugin registered");
}

module.exports = {
  registerModuleLoader,
  loadModule,
  loadAllModules,
  getModuleList,
  validateModule,
};
