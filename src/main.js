// Application entry point.
// Bootstraps the UI shell, registers all routes, and starts the router.

import { renderShell } from './ui/shell.js';
import { addRoute, startRouter } from './ui/router.js';
import { showCreatureList } from './ui/creature-list.js';
import { showCreatureForm } from './ui/creature-form.js';
import { showCreatureCardExport } from './ui/creature-card-export.js';
import { showItemList } from './ui/item-list.js';
import { showItemForm } from './ui/item-form.js';
import { showItemCardExport } from './ui/item-card-export.js';
import { showSpellList } from './ui/spell-list.js';
import { showSpellForm } from './ui/spell-form.js';
import { showSpellCardExport } from './ui/spell-card-export.js';
import { showSettings } from './ui/settings.js';

// Render the persistent nav and view container before dispatching any routes
renderShell();

// Register routes — more-specific patterns must come before general ones.
// '#/creature/new' must be registered before '#/creature/:id' so the
// literal string "new" is not parsed as an ID.
addRoute('#/',             () => showCreatureList());
addRoute('#/creature/new',  () => showCreatureForm(null));
addRoute('#/creature/:id',  ({ id }) => showCreatureForm(id));
addRoute('#/export-creatures', () => showCreatureCardExport());
addRoute('#/items',         () => showItemList());
addRoute('#/item/new',      () => showItemForm(null));
addRoute('#/item/:id',      ({ id }) => showItemForm(id));
addRoute('#/export-items',  () => showItemCardExport());
addRoute('#/spells',        () => showSpellList());
addRoute('#/spell/new',     () => showSpellForm(null));
addRoute('#/spell/:id',     ({ id }) => showSpellForm(id));
addRoute('#/export-spells', () => showSpellCardExport());
addRoute('#/settings',      () => showSettings());

// Start listening to hash changes and dispatch the initial route
startRouter();
