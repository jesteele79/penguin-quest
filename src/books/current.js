// The book being played, as hooks for the shared systems (see book1/hooks.js).
import { isBook2 } from './active.js';
import { HOOKS as AURORA_RESCUE } from './book1/hooks.js';
import { HOOKS as EMBER_ISLES } from './book2/hooks.js';

export const BOOK = isBook2 ? EMBER_ISLES : AURORA_RESCUE;
