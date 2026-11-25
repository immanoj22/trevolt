import { parseDocument } from "htmlparser2";
import render from "dom-serializer";
import { hasChildren, isTag, isText } from "domhandler";

// A large CMS document (Terms of Service, Privacy Policy) handed whole to
// react-native-render-html gets parsed and turned into its full element tree
// in one synchronous JS-thread burst before anything paints - that's the
// freeze on opening those screens. Splitting it into per-section HTML
// strings lets a FlatList render only the sections near the visible screen
// and defer the rest until the user actually scrolls to them.

// Below this, a chunk (e.g. a single short paragraph) isn't worth its own
// FlatList row - grouping keeps the row count reasonable for documents made
// of many short top-level blocks.
const MIN_CHUNK_LENGTH = 800;

// A single node bigger than this ON ITS OWN (one huge <table>, or a WYSIWYG
// export's root <div> wrapping the ENTIRE document as its only top-level
// node) defeats the sibling-grouping above entirely - it never gets split
// because there's nothing next to it to draw a boundary between. Explode
// nodes at least this big by their own children instead.
const LARGE_NODE_LENGTH = MIN_CHUNK_LENGTH * 4;

// Only these are safe to unwrap: pure layout containers a WYSIWYG editor
// wraps content in, never meant to carry meaning of their own. Deliberately
// excludes inline-flow tags (p, span, b, a, li, ...) - unwrapping one of
// those would scatter a single sentence's words across separate FlatList
// rows and break its reading flow.
const CONTAINER_TAGS = new Set(["div", "section", "article", "main", "body"]);

const isMeaningful = (node: any) => (isText(node) ? !!node.data && node.data.trim().length > 0 : true);

const serializeOpenTag = (node: any) => {
    const attrs = Object.entries(node.attribs || {})
        .map(([key, value]) => (value === "" ? key : `${key}="${String(value).replace(/"/g, "&quot;")}"`))
        .join(" ");
    return attrs ? `<${node.name} ${attrs}>` : `<${node.name}>`;
};

// A CMS export often wraps the ENTIRE document in one outer container (e.g.
// a WYSIWYG editor's root <div>) - if that's the only top-level node, the
// real content never reaches the sibling-grouping in nodesToChunks() at all.
// Unwrap it (and any further single-wrapper nesting) before chunking.
const unwrapSingleContainer = (nodes: any[], depth = 3): any[] => {
    const meaningful = nodes.filter(isMeaningful);
    const only = meaningful.length === 1 ? meaningful[0] : null;
    if (depth > 0 && only && isTag(only) && CONTAINER_TAGS.has(only.name) && hasChildren(only) && only.children.length > 0) {
        return unwrapSingleContainer(only.children, depth - 1);
    }
    return meaningful;
};

// Turns a list of sibling DOM nodes into an array of HTML-string chunks,
// each roughly MIN_CHUNK_LENGTH long. A node that's on its own bigger than
// LARGE_NODE_LENGTH is split by ITS children instead, with each resulting
// group re-wrapped in a clone of the parent's own opening/closing tag - so
// markup that only makes sense inside that tag (<tr>, <li>) stays
// structurally valid on its own. This deliberately recurses even into a
// SINGLE child (e.g. <table>'s one <tbody>) rather than requiring more than
// one - a table's actual rows are one level further down than the table
// itself, and the depth guard below still bounds the recursion.
const nodesToChunks = (nodes: any[], depth = 3): string[] => {
    const meaningful = nodes.filter(isMeaningful);
    const chunks: string[] = [];
    let buffer: string[] = [];
    let bufferLength = 0;

    const flush = () => {
        if (buffer.length) {
            chunks.push(buffer.join(""));
            buffer = [];
            bufferLength = 0;
        }
    };

    for (const node of meaningful) {
        const rendered = render(node);
        if (depth > 0 && rendered.length >= LARGE_NODE_LENGTH && isTag(node) && hasChildren(node) && node.children.length > 0) {
            flush();
            const openTag = serializeOpenTag(node);
            const closeTag = `</${node.name}>`;
            for (const inner of nodesToChunks(node.children, depth - 1)) {
                chunks.push(`${openTag}${inner}${closeTag}`);
            }
            continue;
        }
        buffer.push(rendered);
        bufferLength += rendered.length;
        if (bufferLength >= MIN_CHUNK_LENGTH) flush();
    }
    flush();
    return chunks;
};

// Splits an HTML string into a list of smaller HTML strings, unwrapping a
// single all-encompassing wrapper container first and exploding any
// individually oversized node by its own children after. Falls back to a
// single-item array (the original whole-document render) for malformed
// markup or a document with nothing left to split.
export const splitHtmlIntoChunks = (html?: string): string[] => {
    if (!html) return [];
    try {
        const topLevel = unwrapSingleContainer(parseDocument(html).children);
        if (topLevel.length === 0) return [html];
        const chunks = nodesToChunks(topLevel);
        return chunks.length ? chunks : [html];
    } catch (e) {
        // Malformed markup or a parser edge case - fall back to the original
        // single-blob render rather than showing nothing.
        return [html];
    }
};
