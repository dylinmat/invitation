/**
 * Scene Graph Validation Module
 * 
 * Validates scene graph structure according to the EIOS editor schema.
 * Based on Konva.js node structure with custom component types.
 */

const VALID_NODE_TYPES = [
  "group",
  "text",
  "image",
  "shape",
  "rect",
  "circle",
  "line",
  "path"
];

const VALID_COMPONENT_TYPES = [
  "RSVP",
  "TEXT",
  "IMAGE",
  "GALLERY",
  "COUNTDOWN",
  "MAP",
  "REGISTRY",
  "MUSIC",
  "VIDEO",
  "GUESTBOOK",
  "SOCIAL_LINKS",
  "SCHEDULE",
  "ACCOMMODATIONS",
  "DRESS_CODE",
  "FAQ",
  "CUSTOM_HTML"
];

const SCENE_GRAPH_VERSION = 1;

/**
 * Validates a complete scene graph object
 * @param {object} sceneGraph - The scene graph to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
const validateSceneGraph = (sceneGraph) => {
  const errors = [];

  if (!sceneGraph || typeof sceneGraph !== "object") {
    return { valid: false, errors: ["Scene graph must be an object"] };
  }

  // Validate version
  if (sceneGraph.version !== SCENE_GRAPH_VERSION) {
    errors.push(`Scene graph version must be ${SCENE_GRAPH_VERSION}`);
  }

  // Validate canvas
  if (!sceneGraph.canvas) {
    errors.push("Missing required field: canvas");
  } else {
    const canvasErrors = validateCanvas(sceneGraph.canvas);
    errors.push(...canvasErrors);
  }

  // Validate assets (optional)
  if (sceneGraph.assets) {
    const assetErrors = validateAssets(sceneGraph.assets);
    errors.push(...assetErrors);
  }

  // Validate nodes (optional but recommended)
  if (sceneGraph.nodes) {
    if (!Array.isArray(sceneGraph.nodes)) {
      errors.push("nodes must be an array");
    } else {
      const nodeIds = new Set();
      for (const node of sceneGraph.nodes) {
        const nodeErrors = validateNode(node, nodeIds);
        errors.push(...nodeErrors);
      }
    }
  }

  // Validate components (optional)
  if (sceneGraph.components) {
    if (!Array.isArray(sceneGraph.components)) {
      errors.push("components must be an array");
    } else {
      const componentIds = new Set();
      for (const component of sceneGraph.components) {
        const componentErrors = validateComponent(component, componentIds);
        errors.push(...componentErrors);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validates canvas configuration
 */
const validateCanvas = (canvas) => {
  const errors = [];

  if (typeof canvas.width !== "number" || canvas.width <= 0) {
    errors.push("canvas.width must be a positive number");
  }

  if (typeof canvas.height !== "number" || canvas.height <= 0) {
    errors.push("canvas.height must be a positive number");
  }

  if (canvas.background !== undefined) {
    if (typeof canvas.background !== "string") {
      errors.push("canvas.background must be a string");
    } else if (!isValidColor(canvas.background)) {
      errors.push("canvas.background must be a valid color string");
    }
  }

  return errors;
};

/**
 * Validates assets section
 */
const validateAssets = (assets) => {
  const errors = [];

  if (assets.images) {
    for (const [id, image] of Object.entries(assets.images)) {
      if (!image.url || typeof image.url !== "string") {
        errors.push(`assets.images.${id}.url must be a valid string`);
      }
      if (image.width !== undefined && typeof image.width !== "number") {
        errors.push(`assets.images.${id}.width must be a number`);
      }
      if (image.height !== undefined && typeof image.height !== "number") {
        errors.push(`assets.images.${id}.height must be a number`);
      }
    }
  }

  if (assets.fonts) {
    for (const [id, font] of Object.entries(assets.fonts)) {
      if (!font.family || typeof font.family !== "string") {
        errors.push(`assets.fonts.${id}.family must be a valid string`);
      }
      if (!font.url || typeof font.url !== "string") {
        errors.push(`assets.fonts.${id}.url must be a valid string`);
      }
    }
  }

  return errors;
};

/**
 * Validates a node in the scene graph
 */
const validateNode = (node, nodeIds) => {
  const errors = [];

  if (!node.id || typeof node.id !== "string") {
    errors.push("Each node must have a string id");
  } else {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node id: ${node.id}`);
    }
    nodeIds.add(node.id);
  }

  if (!node.type || !VALID_NODE_TYPES.includes(node.type)) {
    errors.push(`Invalid node type: ${node.type}. Must be one of: ${VALID_NODE_TYPES.join(", ")}`);
  }

  // Validate position
  if (node.position) {
    if (typeof node.position.x !== "number") {
      errors.push(`Node ${node.id}: position.x must be a number`);
    }
    if (typeof node.position.y !== "number") {
      errors.push(`Node ${node.id}: position.y must be a number`);
    }
  }

  // Validate size
  if (node.size) {
    if (typeof node.size.w !== "number" || node.size.w < 0) {
      errors.push(`Node ${node.id}: size.w must be a non-negative number`);
    }
    if (typeof node.size.h !== "number" || node.size.h < 0) {
      errors.push(`Node ${node.id}: size.h must be a non-negative number`);
    }
  }

  // Validate rotation
  if (node.rotation !== undefined && typeof node.rotation !== "number") {
    errors.push(`Node ${node.id}: rotation must be a number`);
  }

  // Validate zIndex
  if (node.zIndex !== undefined && !Number.isInteger(node.zIndex)) {
    errors.push(`Node ${node.id}: zIndex must be an integer`);
  }

  // Validate visibility
  if (node.visible !== undefined && typeof node.visible !== "boolean") {
    errors.push(`Node ${node.id}: visible must be a boolean`);
  }

  // Validate locked
  if (node.locked !== undefined && typeof node.locked !== "boolean") {
    errors.push(`Node ${node.id}: locked must be a boolean`);
  }

  // Validate children
  if (node.children) {
    if (!Array.isArray(node.children)) {
      errors.push(`Node ${node.id}: children must be an array`);
    } else {
      for (const childId of node.children) {
        if (typeof childId !== "string") {
          errors.push(`Node ${node.id}: children must be string ids`);
        }
      }
    }
  }

  return errors;
};

/**
 * Validates a component in the scene graph
 */
const validateComponent = (component, componentIds) => {
  const errors = [];

  if (!component.id || typeof component.id !== "string") {
    errors.push("Each component must have a string id");
  } else {
    if (componentIds.has(component.id)) {
      errors.push(`Duplicate component id: ${component.id}`);
    }
    componentIds.add(component.id);
  }

  if (!component.type || !VALID_COMPONENT_TYPES.includes(component.type)) {
    errors.push(`Invalid component type: ${component.type}. Must be one of: ${VALID_COMPONENT_TYPES.join(", ")}`);
  }

  // Validate position
  if (component.position) {
    if (typeof component.position.x !== "number") {
      errors.push(`Component ${component.id}: position.x must be a number`);
    }
    if (typeof component.position.y !== "number") {
      errors.push(`Component ${component.id}: position.y must be a number`);
    }
  }

  // Validate size
  if (component.size) {
    if (typeof component.size.w !== "number" || component.size.w < 0) {
      errors.push(`Component ${component.id}: size.w must be a non-negative number`);
    }
    if (typeof component.size.h !== "number" || component.size.h < 0) {
      errors.push(`Component ${component.id}: size.h must be a non-negative number`);
    }
  }

  // Validate props
  if (component.props && typeof component.props !== "object") {
    errors.push(`Component ${component.id}: props must be an object`);
  }

  // Type-specific validation
  if (component.type === "RSVP" && component.props) {
    if (component.props.formId && typeof component.props.formId !== "string") {
      errors.push(`Component ${component.id}: props.formId must be a string`);
    }
  }

  return errors;
};

/**
 * Validates asset references in the scene graph
 * @param {object} sceneGraph - The scene graph to validate
 * @param {string[]} availableAssetIds - Array of available asset IDs
 * @returns {object} - { valid: boolean, errors: string[] }
 */
const validateAssetReferences = (sceneGraph, availableAssetIds) => {
  const errors = [];
  const assetIdSet = new Set(availableAssetIds);

  if (!sceneGraph.nodes) {
    return { valid: true, errors: [] };
  }

  for (const node of sceneGraph.nodes) {
    if (node.type === "image" && node.props?.assetId) {
      if (!assetIdSet.has(node.props.assetId)) {
        errors.push(`Node ${node.id} references unknown asset: ${node.props.assetId}`);
      }
    }

    if (node.style?.fontFamily) {
      const fontId = node.style.fontFamily;
      if (!assetIdSet.has(fontId) && sceneGraph.assets?.fonts?.[fontId] === undefined) {
        // Font might be a system font, so we only warn if it's in assets but not available
        if (sceneGraph.assets?.fonts && !sceneGraph.assets.fonts[fontId]) {
          errors.push(`Node ${node.id} references unknown font: ${fontId}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Helper to check if a string is a valid color
 */
const isValidColor = (color) => {
  // Simple check for hex colors and basic color names
  const hexRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
  const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
  const rgbaRegex = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;
  const basicColors = ["transparent", "white", "black", "red", "green", "blue", "yellow", "purple", "orange"];
  
  return hexRegex.test(color) || 
         rgbRegex.test(color) || 
         rgbaRegex.test(color) || 
         basicColors.includes(color.toLowerCase());
};

/**
 * Sanitizes a scene graph before storage
 * Removes any fields that shouldn't be stored
 */
const sanitizeSceneGraph = (sceneGraph) => {
  if (!sceneGraph || typeof sceneGraph !== "object") {
    return null;
  }

  return {
    version: sceneGraph.version || SCENE_GRAPH_VERSION,
    canvas: sceneGraph.canvas || { width: 1440, height: 900, background: "#ffffff" },
    assets: sceneGraph.assets || {},
    nodes: Array.isArray(sceneGraph.nodes) ? sceneGraph.nodes : [],
    components: Array.isArray(sceneGraph.components) ? sceneGraph.components : [],
    // Preserve any additional metadata fields
    ...(sceneGraph.metadata && { metadata: sceneGraph.metadata })
  };
};

/**
 * Creates a minimal valid scene graph
 */
const createMinimalSceneGraph = () => ({
  version: SCENE_GRAPH_VERSION,
  canvas: { width: 1440, height: 900, background: "#ffffff" },
  assets: {},
  nodes: [],
  components: []
});

module.exports = {
  SCENE_GRAPH_VERSION,
  VALID_NODE_TYPES,
  VALID_COMPONENT_TYPES,
  validateSceneGraph,
  validateAssetReferences,
  sanitizeSceneGraph,
  createMinimalSceneGraph
};
