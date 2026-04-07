import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, 'spec');

// Properties that move into metadata
const METADATA_PROPS = new Set([
  'name', 'displayName', 'extends', 'aliases', 'summary',
  'thumbnail', 'description', 'preview', 'status', 'since',
  'tags', 'category', 'source', 'tokenType'
]);

// Properties that stay on the entity (plus 'kind' which always stays)
const STAY_PROPS = new Set([
  'kind', 'documentBlock', 'links', '$extensions', 'children', 'overrides'
]);

function transformEntity(entity) {
  if (!entity || typeof entity !== 'object' || !entity.kind) return entity;

  const metadata = {};
  const result = {};

  // Always put kind first
  result.kind = entity.kind;

  // Collect metadata properties in their original order
  for (const key of Object.keys(entity)) {
    if (key === 'kind') continue;
    if (METADATA_PROPS.has(key)) {
      metadata[key] = entity[key];
    }
  }

  // Insert metadata object right after kind if there's anything to put in it
  if (Object.keys(metadata).length > 0) {
    result.metadata = metadata;
  }

  // Copy remaining non-metadata, non-kind properties in original order
  for (const key of Object.keys(entity)) {
    if (key === 'kind') continue;
    if (METADATA_PROPS.has(key)) continue;
    result[key] = entity[key];
  }

  // Recursively transform children arrays (token-group nesting)
  if (result.children && Array.isArray(result.children)) {
    result.children = result.children.map(child => transformEntity(child));
  }

  return result;
}

function transformDocumentation(doc) {
  const entityArrays = ['components', 'tokenGroups', 'themes', 'styles', 'patterns'];
  for (const arrayName of entityArrays) {
    if (doc[arrayName] && Array.isArray(doc[arrayName])) {
      doc[arrayName] = doc[arrayName].map(entity => transformEntity(entity));
    }
  }
  return doc;
}

function transformFile(relPath) {
  const fullPath = join(BASE, relPath);
  const raw = readFileSync(fullPath, 'utf8');
  let data = JSON.parse(raw);

  // Determine if this is a DSDS document or an entity file
  if (data.dsdsVersion && data.documentation) {
    // DSDS document — transform all documentation groups
    data.documentation = data.documentation.map(group => transformDocumentation(group));
  } else if (data.component) {
    data.component = transformEntity(data.component);
  } else if (data.token) {
    data.token = transformEntity(data.token);
  } else if (data.tokenGroup) {
    data.tokenGroup = transformEntity(data.tokenGroup);
  } else if (data.theme) {
    data.theme = transformEntity(data.theme);
  } else if (data.style) {
    data.style = transformEntity(data.style);
  } else if (data.pattern) {
    data.pattern = transformEntity(data.pattern);
  } else if (data.kind) {
    // Top-level entity (minimal examples like minimal/component.json)
    data = transformEntity(data);
  }

  writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`✓ ${relPath}`);
}

// --- Transform the root schema ---
function transformSchema() {
  const schemaPath = join(BASE, 'schema/dsds.schema.json');
  const raw = readFileSync(schemaPath, 'utf8');
  const schema = JSON.parse(raw);

  // Update project description to mention metadata/
  schema.description = schema.description.replace(
    'Entity schemas are in entities/. Document block schemas are in document-blocks/. Common schemas are in common/.',
    'Entity schemas are in entities/. Document block schemas are in document-blocks/. Common schemas are in common/. Metadata schemas are in metadata/.'
  );

  // Update documentation array description to mention the metadata directory
  if (schema.properties.documentation) {
    schema.properties.documentation.description =
      'One or more documentation groups. Each group is a named collection that organizes entities into separate typed arrays — components, tokenGroups, themes, styles, and patterns. Multiple groups let a single DSDS file organize entities into logical sections (e.g., one group for foundations, another for components). All entity arrays are optional; a group only needs a name. Entity metadata schemas are defined in the metadata/ directory.';
  }

  // Update metadata property description to mention the metadata directory
  if (schema.properties.metadata) {
    schema.properties.metadata.description =
      'Document-level metadata. Metadata schemas are defined in the metadata/ directory.';
  }

  writeFileSync(schemaPath, JSON.stringify(schema, null, 2) + '\n', 'utf8');
  console.log('✓ schema/dsds.schema.json');
}

// --- Run all transformations ---

const entityFiles = [
  'examples/entities/component.json',
  'examples/entities/token.json',
  'examples/entities/token-group.json',
  'examples/entities/theme.json',
  'examples/entities/style.json',
  'examples/entities/pattern.json',
  'examples/entities/empty-state-pattern.json',
  'examples/minimal/component.json',
  'examples/minimal/token.json',
  'examples/minimal/token-group.json',
  'examples/minimal/theme.json',
  'examples/minimal/style.json',
  'examples/minimal/pattern.json',
];

const dsdsFiles = [
  'examples/starter-kit.dsds.json',
  'examples/extension-system.dsds.json',
  'examples/minimal/minimal.dsds.json',
];

console.log('Transforming schema...');
transformSchema();

console.log('\nTransforming entity files...');
for (const f of entityFiles) {
  transformFile(f);
}

console.log('\nTransforming DSDS document files...');
for (const f of dsdsFiles) {
  transformFile(f);
}

console.log('\nDone!');
