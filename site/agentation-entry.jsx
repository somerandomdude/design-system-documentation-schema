import React from "react";
import { createRoot } from "react-dom/client";
import { Agentation } from "agentation";

/**
 * Agentation entry point for the DSDS spec site.
 *
 * This mounts the Agentation feedback tool onto any page in the spec site.
 * It creates its own React root in a dedicated container element so it
 * doesn't interfere with the existing vanilla web-component DOM.
 *
 * Load the built bundle with:
 *   <script src="agentation-bundle.js"></script>
 *
 * The bundle is self-initializing — it waits for DOMContentLoaded,
 * creates its mount point, and renders.
 */

function AgentationMount() {
  const handleAnnotationAdd = React.useCallback((annotation) => {
    console.log("[agentation] annotation added:", annotation);
  }, []);

  const handleAnnotationDelete = React.useCallback((annotation) => {
    console.log("[agentation] annotation deleted:", annotation);
  }, []);

  const handleAnnotationUpdate = React.useCallback((annotation) => {
    console.log("[agentation] annotation updated:", annotation);
  }, []);

  const handleCopy = React.useCallback((markdown) => {
    console.log("[agentation] copied to clipboard:\n", markdown);
  }, []);

  const handleSubmit = React.useCallback((output, annotations) => {
    console.log("[agentation] submitted:", { output, annotations });
  }, []);

  return (
    <Agentation
      onAnnotationAdd={handleAnnotationAdd}
      onAnnotationDelete={handleAnnotationDelete}
      onAnnotationUpdate={handleAnnotationUpdate}
      onCopy={handleCopy}
      onSubmit={handleSubmit}
    />
  );
}

function init() {
  const container = document.createElement("div");
  container.id = "agentation-root";
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AgentationMount />
    </React.StrictMode>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
