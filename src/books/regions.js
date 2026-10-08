// Each book has five island slots (lake, grove, huts, cave, ridge) that the engine keeps for its chapters,
// anchors and saves. Books 1 and 2 teach the subject of the same name in each slot; Book 3 maps its slots to
// its own subjects (ratios, negative numbers...). These two helpers convert between the two.
import { BOOK } from './current.js';

export const domainOf = (region) => BOOK.regionDomain?.[region] ?? region;
export const regionOf = (domain) => Object.keys(BOOK.regionDomain ?? {}).find((r) => BOOK.regionDomain[r] === domain) ?? domain;
