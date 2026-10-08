// The story of the book being played: chapters, side quests, quest sites and chatter.
import { byBook } from '../books/active.js';
import * as auroraRescue from '../books/book1/story.js';
import * as emberIsles from '../books/book2/story.js';
import * as skyreach from '../books/book3/story.js';

const S = byBook({ book1: auroraRescue, book2: emberIsles, book3: skyreach });

export const MAIN = S.MAIN;
export const SIDE = S.SIDE;
export const SITE_SETS = S.SITE_SETS;
export const CHATTER = S.CHATTER;
export const RESONANCE_NEED = S.RESONANCE_NEED;
export const CRYSTAL_GOAL = S.CRYSTAL_GOAL;
export const SPIRE_TOP = S.SPIRE_TOP;
export const FESTIVAL_SPOT = S.FESTIVAL_SPOT;
