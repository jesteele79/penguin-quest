// The book being played, as hooks for the shared systems (see book1/hooks.js).
import { byBook } from './active.js';
import { HOOKS as AURORA_RESCUE } from './book1/hooks.js';
import { HOOKS as EMBER_ISLES } from './book2/hooks.js';
import { HOOKS as SKYREACH } from './book3/hooks.js';

export const BOOK = byBook({ book1: AURORA_RESCUE, book2: EMBER_ISLES, book3: SKYREACH });
