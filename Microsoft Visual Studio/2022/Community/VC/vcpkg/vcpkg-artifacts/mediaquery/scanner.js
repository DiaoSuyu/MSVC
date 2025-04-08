"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaQueryError = exports.Scanner = exports.Kind = exports.format = exports.messages = exports.MessageCategory = void 0;
const i18n_1 = require("../i18n");
const character_codes_1 = require("./character-codes");
var MessageCategory;
(function (MessageCategory) {
    MessageCategory[MessageCategory["Warning"] = 0] = "Warning";
    MessageCategory[MessageCategory["Error"] = 1] = "Error";
    MessageCategory[MessageCategory["Suggestion"] = 2] = "Suggestion";
    MessageCategory[MessageCategory["Message"] = 3] = "Message";
})(MessageCategory = exports.MessageCategory || (exports.MessageCategory = {}));
exports.messages = {
    DigitExpected: { code: 1100, category: MessageCategory.Error, text: 'Digit expected (0-9)' },
    HexDigitExpected: { code: 1101, category: MessageCategory.Error, text: 'Hex Digit expected (0-F,0-f)' },
    BinaryDigitExpected: { code: 1102, category: MessageCategory.Error, text: 'Binary Digit expected (0,1)' },
    UnexpectedEndOfFile: { code: 1103, category: MessageCategory.Error, text: 'Unexpected end of file while searching for \'{0}\'' },
    InvalidEscapeSequence: { code: 1104, category: MessageCategory.Error, text: 'Invalid escape sequence' },
};
function format(text, ...args) {
    return text.replace(/{(\d+)}/g, (_match, index) => '' + args[+index] || '<ARGMISSING>');
}
exports.format = format;
// All conflict markers consist of the same character repeated seven times.  If it is
// a <<<<<<< or >>>>>>> marker then it is also followed by a space.
const mergeConflictMarkerLength = 7;
var Kind;
(function (Kind) {
    Kind[Kind["Unknown"] = 0] = "Unknown";
    Kind[Kind["EndOfFile"] = 1] = "EndOfFile";
    Kind[Kind["SingleLineComment"] = 2] = "SingleLineComment";
    Kind[Kind["MultiLineComment"] = 3] = "MultiLineComment";
    Kind[Kind["NewLine"] = 4] = "NewLine";
    Kind[Kind["Whitespace"] = 5] = "Whitespace";
    // We detect and provide better error recovery when we encounter a git merge marker.  This
    // allows us to edit files with git-conflict markers in them in a much more pleasant manner.
    Kind[Kind["ConflictMarker"] = 6] = "ConflictMarker";
    // Literals
    Kind[Kind["NumericLiteral"] = 7] = "NumericLiteral";
    Kind[Kind["StringLiteral"] = 8] = "StringLiteral";
    // Boolean Literals
    Kind[Kind["BooleanLiteral"] = 9] = "BooleanLiteral";
    Kind[Kind["TrueKeyword"] = 10] = "TrueKeyword";
    Kind[Kind["FalseKeyword"] = 11] = "FalseKeyword";
    // Punctuation
    Kind[Kind["OpenBrace"] = 12] = "OpenBrace";
    Kind[Kind["CloseBrace"] = 13] = "CloseBrace";
    Kind[Kind["OpenParen"] = 14] = "OpenParen";
    Kind[Kind["CloseParen"] = 15] = "CloseParen";
    Kind[Kind["OpenBracket"] = 16] = "OpenBracket";
    Kind[Kind["CloseBracket"] = 17] = "CloseBracket";
    Kind[Kind["Dot"] = 18] = "Dot";
    Kind[Kind["Elipsis"] = 19] = "Elipsis";
    Kind[Kind["Semicolon"] = 20] = "Semicolon";
    Kind[Kind["Comma"] = 21] = "Comma";
    Kind[Kind["QuestionDot"] = 22] = "QuestionDot";
    Kind[Kind["LessThan"] = 23] = "LessThan";
    Kind[Kind["OpenAngle"] = 23] = "OpenAngle";
    Kind[Kind["LessThanSlash"] = 24] = "LessThanSlash";
    Kind[Kind["GreaterThan"] = 25] = "GreaterThan";
    Kind[Kind["CloseAngle"] = 25] = "CloseAngle";
    Kind[Kind["LessThanEquals"] = 26] = "LessThanEquals";
    Kind[Kind["GreaterThanEquals"] = 27] = "GreaterThanEquals";
    Kind[Kind["EqualsEquals"] = 28] = "EqualsEquals";
    Kind[Kind["ExclamationEquals"] = 29] = "ExclamationEquals";
    Kind[Kind["EqualsEqualsEquals"] = 30] = "EqualsEqualsEquals";
    Kind[Kind["ExclamationEqualsEquals"] = 31] = "ExclamationEqualsEquals";
    Kind[Kind["EqualsArrow"] = 32] = "EqualsArrow";
    Kind[Kind["Plus"] = 33] = "Plus";
    Kind[Kind["Minus"] = 34] = "Minus";
    Kind[Kind["Asterisk"] = 35] = "Asterisk";
    Kind[Kind["AsteriskAsterisk"] = 36] = "AsteriskAsterisk";
    Kind[Kind["Slash"] = 37] = "Slash";
    Kind[Kind["Percent"] = 38] = "Percent";
    Kind[Kind["PlusPlus"] = 39] = "PlusPlus";
    Kind[Kind["MinusMinus"] = 40] = "MinusMinus";
    Kind[Kind["LessThanLessThan"] = 41] = "LessThanLessThan";
    Kind[Kind["GreaterThanGreaterThan"] = 42] = "GreaterThanGreaterThan";
    Kind[Kind["GreaterThanGreaterThanGreaterThan"] = 43] = "GreaterThanGreaterThanGreaterThan";
    Kind[Kind["Ampersand"] = 44] = "Ampersand";
    Kind[Kind["Bar"] = 45] = "Bar";
    Kind[Kind["Caret"] = 46] = "Caret";
    Kind[Kind["Exclamation"] = 47] = "Exclamation";
    Kind[Kind["Tilde"] = 48] = "Tilde";
    Kind[Kind["AmpersandAmpersand"] = 49] = "AmpersandAmpersand";
    Kind[Kind["BarBar"] = 50] = "BarBar";
    Kind[Kind["Question"] = 51] = "Question";
    Kind[Kind["Colon"] = 52] = "Colon";
    Kind[Kind["At"] = 53] = "At";
    Kind[Kind["QuestionQuestion"] = 54] = "QuestionQuestion";
    // Assignments
    Kind[Kind["Equals"] = 55] = "Equals";
    Kind[Kind["PlusEquals"] = 56] = "PlusEquals";
    Kind[Kind["MinusEquals"] = 57] = "MinusEquals";
    Kind[Kind["AsteriskEquals"] = 58] = "AsteriskEquals";
    Kind[Kind["AsteriskAsteriskEquals"] = 59] = "AsteriskAsteriskEquals";
    Kind[Kind["SlashEquals"] = 60] = "SlashEquals";
    Kind[Kind["PercentEquals"] = 61] = "PercentEquals";
    Kind[Kind["LessThanLessThanEquals"] = 62] = "LessThanLessThanEquals";
    Kind[Kind["GreaterThanGreaterThanEquals"] = 63] = "GreaterThanGreaterThanEquals";
    Kind[Kind["GreaterThanGreaterThanGreaterThanEquals"] = 64] = "GreaterThanGreaterThanGreaterThanEquals";
    Kind[Kind["AmpersandEquals"] = 65] = "AmpersandEquals";
    Kind[Kind["BarEquals"] = 66] = "BarEquals";
    Kind[Kind["BarBarEquals"] = 67] = "BarBarEquals";
    Kind[Kind["AmpersandAmpersandEquals"] = 68] = "AmpersandAmpersandEquals";
    Kind[Kind["QuestionQuestionEquals"] = 69] = "QuestionQuestionEquals";
    Kind[Kind["CaretEquals"] = 70] = "CaretEquals";
    // Identifiers
    Kind[Kind["Identifier"] = 71] = "Identifier";
    // Keywords
    Kind[Kind["KeywordsStart"] = 1000] = "KeywordsStart";
    Kind[Kind["AndKeyword"] = 1001] = "AndKeyword";
    Kind[Kind["NotKeyword"] = 1002] = "NotKeyword";
    Kind[Kind["KeywordsEnd"] = 1003] = "KeywordsEnd";
    // Tokens that can represent elements
    Kind[Kind["Elements"] = 2000] = "Elements";
    Kind[Kind["Model"] = 2001] = "Model";
    Kind[Kind["Enum"] = 2002] = "Enum";
    Kind[Kind["EnumValue"] = 2003] = "EnumValue";
    Kind[Kind["Import"] = 2004] = "Import";
    Kind[Kind["TypeAlias"] = 2005] = "TypeAlias";
    Kind[Kind["ParameterAlias"] = 2006] = "ParameterAlias";
    Kind[Kind["ResponseAlias"] = 2007] = "ResponseAlias";
    Kind[Kind["Interface"] = 2008] = "Interface";
    Kind[Kind["Operation"] = 2009] = "Operation";
    Kind[Kind["Annotation"] = 2010] = "Annotation";
    Kind[Kind["Documentation"] = 2011] = "Documentation";
    Kind[Kind["Label"] = 2012] = "Label";
    Kind[Kind["Preamble"] = 2013] = "Preamble";
    Kind[Kind["Property"] = 2014] = "Property";
    Kind[Kind["Parameter"] = 2015] = "Parameter";
    Kind[Kind["TemplateDeclaration"] = 2016] = "TemplateDeclaration";
    Kind[Kind["TemplateParameters"] = 2017] = "TemplateParameters";
    Kind[Kind["Parent"] = 2018] = "Parent";
    Kind[Kind["Response"] = 2019] = "Response";
    Kind[Kind["ResponseExpression"] = 2020] = "ResponseExpression";
    Kind[Kind["Result"] = 2021] = "Result";
    Kind[Kind["TypeExpression"] = 2022] = "TypeExpression";
    Kind[Kind["Union"] = 2023] = "Union";
})(Kind = exports.Kind || (exports.Kind = {}));
const keywords = new Map([
    ['NOT', Kind.NotKeyword],
    ['not', Kind.NotKeyword],
    ['AND', Kind.AndKeyword],
    ['and', Kind.AndKeyword],
    ['true', Kind.BooleanLiteral],
    ['false', Kind.BooleanLiteral] // FalseKeyword
]);
class Scanner {
    #offset = 0;
    #line = 0;
    #column = 0;
    #map = new Array();
    #length;
    #text;
    #ch;
    #chNext;
    #chNextNext;
    #chSz;
    #chNextSz;
    #chNextNextSz;
    /** The assumed tab width. If this is set before scanning, it enables accurate Position tracking. */
    tabWidth = 2;
    // current token information
    /** the character offset within the document */
    offset;
    /** the token kind */
    kind;
    /** the text of the current token (when appropriate) */
    text;
    /** the string value of current string literal token (unquoted, unescaped) */
    stringValue;
    /** returns the Position (line/column) of the current token */
    get position() {
        return this.positionFromOffset(this.offset);
    }
    constructor(text) {
        this.#text = text;
        this.#length = text.length;
        this.advance(0);
        this.markPosition();
        // let's hide these, then we can clone this nicely.
        Object.defineProperty(this, 'tabWidth', { enumerable: false });
    }
    get eof() {
        return this.#offset > (this.#length);
    }
    advance(count) {
        let codeOrChar;
        let newOffset;
        let offsetAdvancedBy = 0;
        switch (count) {
            case undefined:
            case 1:
                offsetAdvancedBy = this.#chSz;
                this.#offset += this.#chSz;
                this.#ch = this.#chNext;
                this.#chSz = this.#chNextSz;
                this.#chNext = this.#chNextNext;
                this.#chNextSz = this.#chNextNextSz;
                newOffset = this.#offset + this.#chSz + this.#chNextSz;
                codeOrChar = this.#text.charCodeAt(newOffset);
                this.#chNextNext = (this.#chNextNextSz = (0, character_codes_1.sizeOf)(codeOrChar)) === 1 ? codeOrChar : this.#text.codePointAt(newOffset);
                return offsetAdvancedBy;
            case 2:
                offsetAdvancedBy = this.#chSz + this.#chNextSz;
                this.#offset += this.#chSz + this.#chNextSz;
                this.#ch = this.#chNextNext;
                this.#chSz = this.#chNextNextSz;
                newOffset = this.#offset + this.#chSz;
                codeOrChar = this.#text.charCodeAt(newOffset);
                this.#chNext = (this.#chNextSz = (0, character_codes_1.sizeOf)(codeOrChar)) === 1 ? codeOrChar : this.#text.codePointAt(newOffset);
                newOffset += this.#chNextSz;
                codeOrChar = this.#text.charCodeAt(newOffset);
                this.#chNextNext = (this.#chNextNextSz = (0, character_codes_1.sizeOf)(codeOrChar)) === 1 ? codeOrChar : this.#text.codePointAt(newOffset);
                return offsetAdvancedBy;
            default:
            case 3:
                offsetAdvancedBy = this.#chSz + this.#chNextSz + this.#chNextNextSz;
                count -= 3;
                while (count) {
                    // skip over characters while we work.
                    offsetAdvancedBy += (0, character_codes_1.sizeOf)(this.#text.charCodeAt(this.#offset + offsetAdvancedBy));
                }
                this.#offset += offsetAdvancedBy;
            // eslint-disable-next-line no-fallthrough
            case 0:
                newOffset = this.#offset;
                codeOrChar = this.#text.charCodeAt(newOffset);
                this.#ch = (this.#chSz = (0, character_codes_1.sizeOf)(codeOrChar)) === 1 ? codeOrChar : this.#text.codePointAt(newOffset);
                newOffset += this.#chSz;
                codeOrChar = this.#text.charCodeAt(newOffset);
                this.#chNext = (this.#chNextSz = (0, character_codes_1.sizeOf)(codeOrChar)) === 1 ? codeOrChar : this.#text.codePointAt(newOffset);
                newOffset += this.#chNextSz;
                codeOrChar = this.#text.charCodeAt(newOffset);
                this.#chNextNext = (this.#chNextNextSz = (0, character_codes_1.sizeOf)(codeOrChar)) === 1 ? codeOrChar : this.#text.codePointAt(newOffset);
                return offsetAdvancedBy;
        }
    }
    next(token, count = 1, value) {
        const originalOffset = this.#offset;
        const offsetAdvancedBy = this.advance(count);
        this.text = value || this.#text.substr(originalOffset, offsetAdvancedBy);
        this.#column += count;
        return this.kind = token;
    }
    /** adds the current position to the token to the offset:position map */
    markPosition() {
        this.#map.push({ offset: this.#offset, column: this.#column, line: this.#line });
    }
    /** updates the position and marks the location  */
    newLine(count = 1) {
        this.text = this.#text.substr(this.#offset, count);
        this.advance(count);
        this.#line++;
        this.#column = 0;
        this.markPosition(); // make sure the map has the new location
        return this.kind = Kind.NewLine;
    }
    start() {
        if (this.offset === undefined) {
            this.scan();
        }
        return this;
    }
    /**
     * Identifies and returns the next token type in the document
     *
     * @returns the state of the scanner will have the properties `token`, `value`, `offset` pointing to the current token at the end of this call.
     *
     * @notes before this call, `#offset` is pointing to the next character to be evaluated.
     *
     */
    scan() {
        // this token starts at
        this.offset = this.#offset;
        this.stringValue = undefined;
        if (!this.eof) {
            switch (this.#ch) {
                case 13 /* CharacterCodes.carriageReturn */:
                    return this.newLine(this.#chNext === 10 /* CharacterCodes.lineFeed */ ? 2 : 1);
                case 10 /* CharacterCodes.lineFeed */:
                    return this.newLine();
                case 9 /* CharacterCodes.tab */:
                case 11 /* CharacterCodes.verticalTab */:
                case 12 /* CharacterCodes.formFeed */:
                case 32 /* CharacterCodes.space */:
                case 160 /* CharacterCodes.nonBreakingSpace */:
                case 5760 /* CharacterCodes.ogham */:
                case 8192 /* CharacterCodes.enQuad */:
                case 8193 /* CharacterCodes.emQuad */:
                case 8194 /* CharacterCodes.enSpace */:
                case 8195 /* CharacterCodes.emSpace */:
                case 8196 /* CharacterCodes.threePerEmSpace */:
                case 8197 /* CharacterCodes.fourPerEmSpace */:
                case 8198 /* CharacterCodes.sixPerEmSpace */:
                case 8199 /* CharacterCodes.figureSpace */:
                case 8200 /* CharacterCodes.punctuationSpace */:
                case 8201 /* CharacterCodes.thinSpace */:
                case 8202 /* CharacterCodes.hairSpace */:
                case 8203 /* CharacterCodes.zeroWidthSpace */:
                case 8239 /* CharacterCodes.narrowNoBreakSpace */:
                case 8287 /* CharacterCodes.mathematicalSpace */:
                case 12288 /* CharacterCodes.ideographicSpace */:
                case 65279 /* CharacterCodes.byteOrderMark */:
                    return this.scanWhitespace();
                case 40 /* CharacterCodes.openParen */:
                    return this.next(Kind.OpenParen);
                case 41 /* CharacterCodes.closeParen */:
                    return this.next(Kind.CloseParen);
                case 44 /* CharacterCodes.comma */:
                    return this.next(Kind.Comma);
                case 58 /* CharacterCodes.colon */:
                    return this.next(Kind.Colon);
                case 59 /* CharacterCodes.semicolon */:
                    return this.next(Kind.Semicolon);
                case 91 /* CharacterCodes.openBracket */:
                    return this.next(Kind.OpenBracket);
                case 93 /* CharacterCodes.closeBracket */:
                    return this.next(Kind.CloseBracket);
                case 123 /* CharacterCodes.openBrace */:
                    return this.next(Kind.OpenBrace);
                case 125 /* CharacterCodes.closeBrace */:
                    return this.next(Kind.CloseBrace);
                case 126 /* CharacterCodes.tilde */:
                    return this.next(Kind.Tilde);
                case 64 /* CharacterCodes.at */:
                    return this.next(Kind.At);
                case 94 /* CharacterCodes.caret */:
                    return this.#chNext === 61 /* CharacterCodes.equals */ ? this.next(Kind.CaretEquals, 2) : this.next(Kind.Caret);
                case 37 /* CharacterCodes.percent */:
                    return this.#chNext === 61 /* CharacterCodes.equals */ ? this.next(Kind.PercentEquals, 2) : this.next(Kind.Percent);
                case 63 /* CharacterCodes.question */:
                    return this.#chNext === 46 /* CharacterCodes.dot */ && !(0, character_codes_1.isDigit)(this.#chNextNext) ?
                        this.next(Kind.QuestionDot, 2) :
                        this.#chNext === 63 /* CharacterCodes.question */ ?
                            this.#chNextNext === 61 /* CharacterCodes.equals */ ?
                                this.next(Kind.QuestionQuestionEquals, 3) :
                                this.next(Kind.QuestionQuestion, 2) :
                            this.next(Kind.Question);
                case 33 /* CharacterCodes.exclamation */:
                    return this.#chNext === 61 /* CharacterCodes.equals */ ?
                        this.#chNextNext === 61 /* CharacterCodes.equals */ ?
                            this.next(Kind.ExclamationEqualsEquals, 3) :
                            this.next(Kind.ExclamationEquals, 2) :
                        this.next(Kind.Exclamation);
                case 38 /* CharacterCodes.ampersand */:
                    return this.#chNext === 38 /* CharacterCodes.ampersand */ ?
                        this.#chNextNext === 61 /* CharacterCodes.equals */ ?
                            this.next(Kind.AmpersandAmpersandEquals, 3) :
                            this.next(Kind.AmpersandAmpersand, 2) :
                        this.#chNext === 61 /* CharacterCodes.equals */ ?
                            this.next(Kind.AmpersandEquals, 2) :
                            this.next(Kind.Ampersand);
                case 42 /* CharacterCodes.asterisk */:
                    return this.#chNext === 42 /* CharacterCodes.asterisk */ ?
                        this.#chNextNext === 61 /* CharacterCodes.equals */ ?
                            this.next(Kind.AsteriskAsteriskEquals, 3) :
                            this.next(Kind.AsteriskAsterisk, 2) :
                        this.#chNext === 61 /* CharacterCodes.equals */ ?
                            this.next(Kind.AsteriskEquals, 2) :
                            this.next(Kind.Asterisk);
                case 43 /* CharacterCodes.plus */:
                    return this.#chNext === 43 /* CharacterCodes.plus */ ?
                        this.next(Kind.PlusPlus, 2) :
                        this.#chNext === 61 /* CharacterCodes.equals */ ?
                            this.next(Kind.PlusEquals, 2) :
                            this.next(Kind.Plus);
                case 45 /* CharacterCodes.minus */:
                    return this.#chNext === 45 /* CharacterCodes.minus */ ?
                        this.next(Kind.MinusMinus, 2) :
                        this.#chNext === 61 /* CharacterCodes.equals */ ?
                            this.next(Kind.MinusEquals, 2) :
                            this.next(Kind.Minus);
                case 46 /* CharacterCodes.dot */:
                    return (0, character_codes_1.isDigit)(this.#chNext) ?
                        this.scanNumber() :
                        this.#chNext === 46 /* CharacterCodes.dot */ && this.#chNextNext === 46 /* CharacterCodes.dot */ ?
                            this.next(Kind.Elipsis, 3) :
                            this.next(Kind.Dot);
                case 47 /* CharacterCodes.slash */:
                    return this.#chNext === 47 /* CharacterCodes.slash */ ?
                        this.scanSingleLineComment() :
                        this.#chNext === 42 /* CharacterCodes.asterisk */ ?
                            this.scanMultiLineComment() :
                            this.#chNext === 61 /* CharacterCodes.equals */ ?
                                this.next(Kind.SlashEquals) :
                                this.next(Kind.Slash);
                case 48 /* CharacterCodes._0 */:
                    return this.#chNext === 120 /* CharacterCodes.x */ || this.#chNext === 88 /* CharacterCodes.X */ ?
                        this.scanHexNumber() :
                        this.#chNext === 66 /* CharacterCodes.B */ || this.#chNext === 66 /* CharacterCodes.B */ ?
                            this.scanBinaryNumber() :
                            this.scanNumber();
                case 49 /* CharacterCodes._1 */:
                case 50 /* CharacterCodes._2 */:
                case 51 /* CharacterCodes._3 */:
                case 52 /* CharacterCodes._4 */:
                case 53 /* CharacterCodes._5 */:
                case 54 /* CharacterCodes._6 */:
                case 55 /* CharacterCodes._7 */:
                case 56 /* CharacterCodes._8 */:
                case 57 /* CharacterCodes._9 */:
                    return this.scanNumber();
                case 60 /* CharacterCodes.lessThan */:
                    return this.isConflictMarker() ?
                        this.next(Kind.ConflictMarker, mergeConflictMarkerLength) :
                        this.#chNext === 60 /* CharacterCodes.lessThan */ ?
                            this.#chNextNext === 61 /* CharacterCodes.equals */ ?
                                this.next(Kind.LessThanLessThanEquals, 3) :
                                this.next(Kind.LessThanLessThan, 2) :
                            this.#chNext === 61 /* CharacterCodes.equals */ ?
                                this.next(Kind.LessThanEquals, 2) :
                                this.next(Kind.LessThan);
                case 62 /* CharacterCodes.greaterThan */:
                    return this.isConflictMarker() ?
                        this.next(Kind.ConflictMarker, mergeConflictMarkerLength) :
                        this.next(Kind.GreaterThan);
                case 61 /* CharacterCodes.equals */:
                    return this.isConflictMarker() ?
                        this.next(Kind.ConflictMarker, mergeConflictMarkerLength) :
                        this.#chNext === 61 /* CharacterCodes.equals */ ?
                            this.#chNextNext === 61 /* CharacterCodes.equals */ ?
                                this.next(Kind.EqualsEqualsEquals, 3) :
                                this.next(Kind.EqualsEquals, 2) :
                            this.#chNext === 62 /* CharacterCodes.greaterThan */ ?
                                this.next(Kind.EqualsArrow, 2) :
                                this.next(Kind.Equals);
                case 124 /* CharacterCodes.bar */:
                    return this.isConflictMarker() ?
                        this.next(Kind.ConflictMarker, mergeConflictMarkerLength) :
                        this.#chNext === 124 /* CharacterCodes.bar */ ?
                            this.#chNextNext === 61 /* CharacterCodes.equals */ ?
                                this.next(Kind.BarBarEquals, 3) :
                                this.next(Kind.BarBar, 2) :
                            this.#chNext === 61 /* CharacterCodes.equals */ ?
                                this.next(Kind.BarEquals, 2) :
                                this.next(Kind.Bar);
                case 39 /* CharacterCodes.singleQuote */:
                case 34 /* CharacterCodes.doubleQuote */:
                case 96 /* CharacterCodes.backtick */:
                    return this.scanString();
                default:
                    // FYI:
                    // Well-known characters that are currently not processed
                    //   # \
                    // will need to update the scanner if there is a need to recognize them
                    return (0, character_codes_1.isIdentifierStart)(this.#ch) ? this.scanIdentifier() : this.next(Kind.Unknown);
            }
        }
        this.text = '';
        return this.kind = Kind.EndOfFile;
    }
    take() {
        const result = { ...this };
        this.scan();
        return result;
    }
    takeWhitespace() {
        while (!this.eof && this.kind === Kind.Whitespace) {
            this.take();
        }
    }
    /**
   * When the current token is greaterThan, this will return any tokens with characters
   * after the greater than character. This has to be scanned separately because greater
   * thans appear in positions where longer tokens are incorrect, e.g. `model x<y>=y;`.
   * The solution is to call rescanGreaterThan from the parser in contexts where longer
   * tokens starting with `>` are allowed (i.e. when parsing binary expressions).
   */
    rescanGreaterThan() {
        if (this.kind === Kind.GreaterThan) {
            return this.#ch === 62 /* CharacterCodes.greaterThan */ ?
                this.#chNext === 61 /* CharacterCodes.equals */ ?
                    this.next(Kind.GreaterThanGreaterThanEquals, 3) :
                    this.next(Kind.GreaterThanGreaterThan, 2) :
                this.#ch === 61 /* CharacterCodes.equals */ ?
                    this.next(Kind.GreaterThanEquals, 2) :
                    this.next(Kind.GreaterThan);
        }
        return this.kind;
    }
    isConflictMarker() {
        // Conflict markers must be at the start of a line.
        if (this.#offset === 0 || (0, character_codes_1.isLineBreak)(this.#text.charCodeAt(this.#offset - 1))) {
            if ((this.#offset + mergeConflictMarkerLength) < this.#length) {
                for (let i = 0; i < mergeConflictMarkerLength; i++) {
                    if (this.#text.charCodeAt(this.#offset + i) !== this.#ch) {
                        return false;
                    }
                }
                return this.#ch === 61 /* CharacterCodes.equals */ || this.#text.charCodeAt(this.#offset + mergeConflictMarkerLength) === 32 /* CharacterCodes.space */;
            }
        }
        return false;
    }
    scanWhitespace() {
        // since whitespace are not always 1 character wide, we're going to mark the position before the whitespace.
        this.markPosition();
        do {
            // advance the position
            this.#column += this.widthOfCh;
            this.advance();
        } while ((0, character_codes_1.isWhiteSpaceSingleLine)(this.#ch));
        // and after...
        this.markPosition();
        this.text = this.#text.substring(this.offset, this.#offset);
        return this.kind = Kind.Whitespace;
    }
    scanDigits() {
        const start = this.#offset;
        while ((0, character_codes_1.isDigit)(this.#ch)) {
            this.advance();
        }
        return this.#text.substring(start, this.#offset);
    }
    scanNumber() {
        const start = this.#offset;
        const main = this.scanDigits();
        let decimal;
        let scientific;
        if (this.#ch === 46 /* CharacterCodes.dot */) {
            this.advance();
            decimal = this.scanDigits();
        }
        if (this.#ch === 69 /* CharacterCodes.E */ || this.#ch === 101 /* CharacterCodes.e */) {
            this.assert((0, character_codes_1.isDigit)(this.#chNext), (0, i18n_1.i) `ParseError: Digit expected (0-9)`);
            this.advance();
            scientific = this.scanDigits();
        }
        this.text = scientific ?
            decimal ?
                `${main}.${decimal}e${scientific}` :
                `${main}e${scientific}` :
            decimal ?
                `${main}.${decimal}` :
                main;
        // update the position
        this.#column += (this.#offset - start);
        return this.kind = Kind.NumericLiteral;
    }
    scanHexNumber() {
        this.assert((0, character_codes_1.isHexDigit)(this.#chNextNext), (0, i18n_1.i) `ParseError: Hex Digit expected (0-F,0-f)`);
        this.advance(2);
        this.text = `0x${this.scanUntil((ch) => !(0, character_codes_1.isHexDigit)(ch), 'Hex Digit')}`;
        return this.kind = Kind.NumericLiteral;
    }
    scanBinaryNumber() {
        this.assert((0, character_codes_1.isBinaryDigit)(this.#chNextNext), (0, i18n_1.i) `ParseError: Binary Digit expected (0,1)`);
        this.advance(2);
        this.text = `0b${this.scanUntil((ch) => !(0, character_codes_1.isBinaryDigit)(ch), 'Binary Digit')}`;
        return this.kind = Kind.NumericLiteral;
    }
    get widthOfCh() {
        return this.#ch === 9 /* CharacterCodes.tab */ ? (this.#column % this.tabWidth || this.tabWidth) : 1;
    }
    scanUntil(predicate, expectedClose, consumeClose) {
        const start = this.#offset;
        do {
            // advance the position
            if ((0, character_codes_1.isLineBreak)(this.#ch)) {
                this.advance(this.#ch === 13 /* CharacterCodes.carriageReturn */ && this.#chNext === 10 /* CharacterCodes.lineFeed */ ? 2 : 1);
                this.#line++;
                this.#column = 0;
                this.markPosition(); // make sure the map has the new location
            }
            else {
                this.#column += this.widthOfCh;
                this.advance();
            }
            if (this.eof) {
                this.assert(!expectedClose, (0, i18n_1.i) `Unexpected end of file while searching for '${expectedClose}'`);
                break;
            }
        } while (!predicate(this.#ch, this.#chNext, this.#chNextNext));
        if (consumeClose) {
            this.advance(consumeClose);
        }
        // and after...
        this.markPosition();
        return this.#text.substring(start, this.#offset);
    }
    scanSingleLineComment() {
        this.text = this.scanUntil(character_codes_1.isLineBreak);
        return this.kind = Kind.SingleLineComment;
    }
    scanMultiLineComment() {
        this.text = this.scanUntil((ch, chNext) => ch === 42 /* CharacterCodes.asterisk */ && chNext === 47 /* CharacterCodes.slash */, '*/', 2);
        return this.kind = Kind.MultiLineComment;
    }
    scanString() {
        const quote = this.#ch;
        const quoteLength = 1;
        const closing = String.fromCharCode(this.#ch);
        let escaped = false;
        let crlf = false;
        let isEscaping = false;
        const text = this.scanUntil((ch, chNext, chNextNext) => {
            if (isEscaping) {
                isEscaping = false;
                return false;
            }
            if (ch === 92 /* CharacterCodes.backslash */) {
                isEscaping = escaped = true;
                return false;
            }
            if (ch == 13 /* CharacterCodes.carriageReturn */) {
                if (chNext == 10 /* CharacterCodes.lineFeed */) {
                    crlf = true;
                }
                return false;
            }
            return ch === quote;
        }, closing, quoteLength);
        // TODO: optimize to single pass over string, easier if we refactor some bookkeeping first.
        // strip quotes
        let value = text.substring(quoteLength, text.length - quoteLength);
        // Normalize CRLF to LF when interpreting value of multi-line string
        // literals. Matches JavaScript behavior and ensures program behavior does
        // not change due to line-ending conversion.
        if (crlf) {
            value = value.replace(/\r\n/g, '\n');
        }
        if (escaped) {
            value = this.unescapeString(value);
        }
        this.text = text;
        this.stringValue = value;
        return this.kind = Kind.StringLiteral;
    }
    unescapeString(text) {
        let result = '';
        let start = 0;
        let pos = 0;
        const end = text.length;
        while (pos < end) {
            let ch = text.charCodeAt(pos);
            if (ch != 92 /* CharacterCodes.backslash */) {
                pos++;
                continue;
            }
            result += text.substring(start, pos);
            pos++;
            ch = text.charCodeAt(pos);
            switch (ch) {
                case 114 /* CharacterCodes.r */:
                    result += '\r';
                    break;
                case 110 /* CharacterCodes.n */:
                    result += '\n';
                    break;
                case 116 /* CharacterCodes.t */:
                    result += '\t';
                    break;
                case 39 /* CharacterCodes.singleQuote */:
                    result += '\'';
                    break;
                case 34 /* CharacterCodes.doubleQuote */:
                    result += '"';
                    break;
                case 92 /* CharacterCodes.backslash */:
                    result += '\\';
                    break;
                case 96 /* CharacterCodes.backtick */:
                    result += '`';
                    break;
                default:
                    throw new MediaQueryError((0, i18n_1.i) `Invalid escape sequence`, this.position.line, this.position.column);
            }
            pos++;
            start = pos;
        }
        result += text.substring(start, pos);
        return result;
    }
    scanIdentifier() {
        this.text = this.scanUntil((ch) => !(0, character_codes_1.isIdentifierPart)(ch));
        return this.kind = keywords.get(this.text) ?? Kind.Identifier;
    }
    /**
   * Returns the zero-based line/column from the given offset
   * (binary search thru the token start locations)
   * @param offset the character position in the document
   */
    positionFromOffset(offset) {
        let position = { line: 0, column: 0, offset: 0 };
        // eslint-disable-next-line keyword-spacing
        if (offset < 0 || offset > this.#length) {
            return { line: position.line, column: position.column };
        }
        let first = 0; //left endpoint
        let last = this.#map.length - 1; //right endpoint
        let middle = Math.floor((first + last) / 2);
        while (first <= last) {
            middle = Math.floor((first + last) / 2);
            position = this.#map[middle];
            if (position.offset === offset) {
                return { line: position.line, column: position.column };
            }
            if (position.offset < offset) {
                first = middle + 1;
                continue;
            }
            last = middle - 1;
            position = this.#map[last];
        }
        return { line: position.line, column: position.column + (offset - position.offset) };
    }
    static *TokensFrom(text) {
        const scanner = new Scanner(text).start();
        while (!scanner.eof) {
            yield scanner.take();
        }
    }
    assert(assertion, message) {
        if (!assertion) {
            const p = this.position;
            throw new MediaQueryError(message, p.line, p.column);
        }
    }
}
exports.Scanner = Scanner;
class MediaQueryError extends Error {
    line;
    column;
    constructor(message, line, column) {
        super(message);
        this.line = line;
        this.column = column;
    }
}
exports.MediaQueryError = MediaQueryError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nhbm5lci5qcyIsInNvdXJjZVJvb3QiOiJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbWljcm9zb2Z0L3ZjcGtnLXRvb2wvbWFpbi92Y3BrZy1hcnRpZmFjdHMvIiwic291cmNlcyI6WyJtZWRpYXF1ZXJ5L3NjYW5uZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHVDQUF1QztBQUN2QyxrQ0FBa0M7OztBQUVsQyxrQ0FBNEI7QUFDNUIsdURBQXlLO0FBRXpLLElBQVksZUFLWDtBQUxELFdBQVksZUFBZTtJQUN6QiwyREFBTyxDQUFBO0lBQ1AsdURBQUssQ0FBQTtJQUNMLGlFQUFVLENBQUE7SUFDViwyREFBTyxDQUFBO0FBQ1QsQ0FBQyxFQUxXLGVBQWUsR0FBZix1QkFBZSxLQUFmLHVCQUFlLFFBSzFCO0FBUVksUUFBQSxRQUFRLEdBQUc7SUFDdEIsYUFBYSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsZUFBZSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsc0JBQXNCLEVBQUU7SUFDNUYsZ0JBQWdCLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxlQUFlLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSw4QkFBOEIsRUFBRTtJQUN2RyxtQkFBbUIsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLGVBQWUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLDZCQUE2QixFQUFFO0lBQ3pHLG1CQUFtQixFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsZUFBZSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsb0RBQW9ELEVBQUU7SUFDaEkscUJBQXFCLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxlQUFlLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSx5QkFBeUIsRUFBRTtDQUN4RyxDQUFDO0FBRUYsU0FBZ0IsTUFB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
// SIG // Begin signature block
// SIG // MIIoNwYJKoZIhvcNAQcCoIIoKDCCKCQCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // IKb4TL0USl0iSoqPd5038gpBfiyL1dHSELDjcYRFI26g
// SIG // gg2FMIIGAzCCA+ugAwIBAgITMwAABAO91ZVdDzsYrQAA
// SIG // AAAEAzANBgkqhkiG9w0BAQsFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTI0MDkxMjIwMTExM1oX
// SIG // DTI1MDkxMTIwMTExM1owdDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // n3RnXcCDp20WFMoNNzt4s9fV12T5roRJlv+bshDfvJoM
// SIG // ZfhyRnixgUfGAbrRlS1St/EcXFXD2MhRkF3CnMYIoeMO
// SIG // MuMyYtxr2sC2B5bDRMUMM/r9I4GP2nowUthCWKFIS1RP
// SIG // lM0YoVfKKMaH7bJii29sW+waBUulAKN2c+Gn5znaiOxR
// SIG // qIu4OL8f9DCHYpME5+Teek3SL95sH5GQhZq7CqTdM0fB
// SIG // w/FmLLx98SpBu7v8XapoTz6jJpyNozhcP/59mi/Fu4tT
// SIG // 2rI2vD50Vx/0GlR9DNZ2py/iyPU7DG/3p1n1zluuRp3u
// SIG // XKjDfVKH7xDbXcMBJid22a3CPbuC2QJLowIDAQABo4IB
// SIG // gjCCAX4wHwYDVR0lBBgwFgYKKwYBBAGCN0wIAQYIKwYB
// SIG // BQUHAwMwHQYDVR0OBBYEFOpuKgJKc+OuNYitoqxfHlrE
// SIG // gXAZMFQGA1UdEQRNMEukSTBHMS0wKwYDVQQLEyRNaWNy
// SIG // b3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQx
// SIG // FjAUBgNVBAUTDTIzMDAxMis1MDI5MjYwHwYDVR0jBBgw
// SIG // FoAUSG5k5VAF04KqFzc3IrVtqMp1ApUwVAYDVR0fBE0w
// SIG // SzBJoEegRYZDaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraW9wcy9jcmwvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNybDBhBggrBgEFBQcBAQRVMFMwUQYIKwYB
// SIG // BQUHMAKGRWh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9w
// SIG // a2lvcHMvY2VydHMvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3
// SIG // DQEBCwUAA4ICAQBRaP+hOC1+dSKhbqCr1LIvNEMrRiOQ
// SIG // EkPc7D6QWtM+/IbrYiXesNeeCZHCMf3+6xASuDYQ+AyB
// SIG // TX0YlXSOxGnBLOzgEukBxezbfnhUTTk7YB2/TxMUcuBC
// SIG // P45zMM0CVTaJE8btloB6/3wbFrOhvQHCILx41jTd6kUq
// SIG // 4bIBHah3NG0Q1H/FCCwHRGTjAbyiwq5n/pCTxLz5XYCu
// SIG // 4RTvy/ZJnFXuuwZynowyju90muegCToTOwpHgE6yRcTv
// SIG // Ri16LKCr68Ab8p8QINfFvqWoEwJCXn853rlkpp4k7qzw
// SIG // lBNiZ71uw2pbzjQzrRtNbCFQAfmoTtsHFD2tmZvQIg1Q
// SIG // VkzM/V1KCjHL54ItqKm7Ay4WyvqWK0VIEaTbdMtbMWbF
// SIG // zq2hkRfJTNnFr7RJFeVC/k0DNaab+bpwx5FvCUvkJ3z2
// SIG // wfHWVUckZjEOGmP7cecefrF+rHpif/xW4nJUjMUiPsyD
// SIG // btY2Hq3VMLgovj+qe0pkJgpYQzPukPm7RNhbabFNFvq+
// SIG // kXWBX/z/pyuo9qLZfTb697Vi7vll5s/DBjPtfMpyfpWG
// SIG // 0phVnAI+0mM4gH09LCMJUERZMgu9bbCGVIQR7cT5YhlL
// SIG // t+tpSDtC6XtAzq4PJbKZxFjpB5wk+SRJ1gm87olbfEV9
// SIG // SFdO7iL3jWbjgVi1Qs1iYxBmvh4WhLWr48uouzCCB3ow
// SIG // ggVioAMCAQICCmEOkNIAAAAAAAMwDQYJKoZIhvcNAQEL
// SIG // BQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMT
// SIG // KU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhv
// SIG // cml0eSAyMDExMB4XDTExMDcwODIwNTkwOVoXDTI2MDcw
// SIG // ODIxMDkwOVowfjELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEoMCYG
// SIG // A1UEAxMfTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQQ0Eg
// SIG // MjAxMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoC
// SIG // ggIBAKvw+nIQHC6t2G6qghBNNLrytlghn0IbKmvpWlCq
// SIG // uAY4GgRJun/DDB7dN2vGEtgL8DjCmQawyDnVARQxQtOJ
// SIG // DXlkh36UYCRsr55JnOloXtLfm1OyCizDr9mpK656Ca/X
// SIG // llnKYBoF6WZ26DJSJhIv56sIUM+zRLdd2MQuA3WraPPL
// SIG // bfM6XKEW9Ea64DhkrG5kNXimoGMPLdNAk/jj3gcN1Vx5
// SIG // pUkp5w2+oBN3vpQ97/vjK1oQH01WKKJ6cuASOrdJXtjt
// SIG // 7UORg9l7snuGG9k+sYxd6IlPhBryoS9Z5JA7La4zWMW3
// SIG // Pv4y07MDPbGyr5I4ftKdgCz1TlaRITUlwzluZH9TupwP
// SIG // rRkjhMv0ugOGjfdf8NBSv4yUh7zAIXQlXxgotswnKDgl
// SIG // mDlKNs98sZKuHCOnqWbsYR9q4ShJnV+I4iVd0yFLPlLE
// SIG // tVc/JAPw0XpbL9Uj43BdD1FGd7P4AOG8rAKCX9vAFbO9
// SIG // G9RVS+c5oQ/pI0m8GLhEfEXkwcNyeuBy5yTfv0aZxe/C
// SIG // HFfbg43sTUkwp6uO3+xbn6/83bBm4sGXgXvt1u1L50kp
// SIG // pxMopqd9Z4DmimJ4X7IvhNdXnFy/dygo8e1twyiPLI9A
// SIG // N0/B4YVEicQJTMXUpUMvdJX3bvh4IFgsE11glZo+TzOE
// SIG // 2rCIF96eTvSWsLxGoGyY0uDWiIwLAgMBAAGjggHtMIIB
// SIG // 6TAQBgkrBgEEAYI3FQEEAwIBADAdBgNVHQ4EFgQUSG5k
// SIG // 5VAF04KqFzc3IrVtqMp1ApUwGQYJKwYBBAGCNxQCBAwe
// SIG // CgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB
// SIG // /wQFMAMBAf8wHwYDVR0jBBgwFoAUci06AjGQQ7kUBU7h
// SIG // 6qfHMdEjiTQwWgYDVR0fBFMwUTBPoE2gS4ZJaHR0cDov
// SIG // L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVj
// SIG // dHMvTWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNy
// SIG // bDBeBggrBgEFBQcBAQRSMFAwTgYIKwYBBQUHMAKGQmh0
// SIG // dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMv
// SIG // TWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNydDCB
// SIG // nwYDVR0gBIGXMIGUMIGRBgkrBgEEAYI3LgMwgYMwPwYI
// SIG // KwYBBQUHAgEWM2h0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2lvcHMvZG9jcy9wcmltYXJ5Y3BzLmh0bTBABggr
// SIG // BgEFBQcCAjA0HjIgHQBMAGUAZwBhAGwAXwBwAG8AbABp
// SIG // AGMAeQBfAHMAdABhAHQAZQBtAGUAbgB0AC4gHTANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAZ/KGpZjgVHkaLtPYdGcimwuW
// SIG // EeFjkplCln3SeQyQwWVfLiw++MNy0W2D/r4/6ArKO79H
// SIG // qaPzadtjvyI1pZddZYSQfYtGUFXYDJJ80hpLHPM8QotS
// SIG // 0LD9a+M+By4pm+Y9G6XUtR13lDni6WTJRD14eiPzE32m
// SIG // kHSDjfTLJgJGKsKKELukqQUMm+1o+mgulaAqPyprWElj
// SIG // HwlpblqYluSD9MCP80Yr3vw70L01724lruWvJ+3Q3fMO
// SIG // r5kol5hNDj0L8giJ1h/DMhji8MUtzluetEk5CsYKwsat
// SIG // ruWy2dsViFFFWDgycScaf7H0J/jeLDogaZiyWYlobm+n
// SIG // t3TDQAUGpgEqKD6CPxNNZgvAs0314Y9/HG8VfUWnduVA
// SIG // KmWjw11SYobDHWM2l4bf2vP48hahmifhzaWX0O5dY0Hj
// SIG // Wwechz4GdwbRBrF1HxS+YWG18NzGGwS+30HHDiju3mUv
// SIG // 7Jf2oVyW2ADWoUa9WfOXpQlLSBCZgB/QACnFsZulP0V3
// SIG // HjXG0qKin3p6IvpIlR+r+0cjgPWe+L9rt0uX4ut1eBrs
// SIG // 6jeZeRhL/9azI2h15q/6/IvrC4DqaTuv/DDtBEyO3991
// SIG // bWORPdGdVk5Pv4BXIqF4ETIheu9BCrE/+6jMpF3BoYib
// SIG // V3FWTkhFwELJm3ZbCoBIa/15n8G9bW1qyVJzEw16UM0x
// SIG // ghoKMIIaBgIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAAEA73VlV0POxitAAAAAAQDMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCDDSrQ0p50RRXKv
// SIG // FpdwPfiWkUxdfftWhgrxFTj+mJXpXzBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBABj3/P1KhfJSdv8wtg2xME2I/jQlWpNn
// SIG // JWvwC70pbqbcbfKx5UDnjL53q/9ubN+kPZmoG30Z+j2b
// SIG // FzuGRnvRJqqTwH/qTplTwBFd+SgVfQJojfvvTcE9dSeo
// SIG // dYpOjJaBR7sAhAx8mfyRhb9AP+oCgABPS4W/sDENV0+1
// SIG // uJPgu4Cq6FTP9CiU5wN/3veHp8ux+ijwyLdET3aZHwrg
// SIG // FBwWq7ZpalMP2+SuATItKb6C3NS/dNh9b0moAT/XtIVO
// SIG // XVqzLw1xzEfuco8X5Kd4ChTPiBE+idwTQgn3sQ6io79A
// SIG // BKW08elnWBlwonG5u4PS6RkUCZ9xIwxniZk+IvRDqs2V
// SIG // fyuhgheUMIIXkAYKKwYBBAGCNwMDATGCF4Awghd8Bgkq
// SIG // hkiG9w0BBwKgghdtMIIXaQIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBUgYLKoZIhvcNAQkQAQSgggFBBIIBPTCCATkC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // 0RC3LZdiFbkTeOLfQ21bE7l7K5hyqxIQqOBNtUzHu84C
// SIG // Bmc/NYYrfBgTMjAyNDEyMDkyMTAzMzQuNDU5WjAEgAIB
// SIG // 9KCB0aSBzjCByzELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMG
// SIG // A1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9u
// SIG // czEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjdGMDAt
// SIG // MDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloIIR6jCCByAwggUIoAMCAQIC
// SIG // EzMAAAHwKnwdWTvmH60AAQAAAfAwDQYJKoZIhvcNAQEL
// SIG // BQAwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwHhcN
// SIG // MjMxMjA2MTg0NTUxWhcNMjUwMzA1MTg0NTUxWjCByzEL
// SIG // MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
// SIG // EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
// SIG // c29mdCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9z
// SIG // b2Z0IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMe
// SIG // blNoaWVsZCBUU1MgRVNOOjdGMDAtMDVFMC1EOTQ3MSUw
// SIG // IwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2
// SIG // aWNlMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKC
// SIG // AgEAtR4tU6M4dztHMxPMX0Z68ppSTQmhlqJpj8tHiDX/
// SIG // uBCa+63/LUs5YBPCJeGY+PE+X00zgIepyE0X9pSu/rqX
// SIG // J2f8YNACqA2KQUDlqy/TmxUocpSB36/w0OD7EV/BkbSJ
// SIG // 7ibDJMEoOt23weENlIpDBD/wrWR4vMVuV7QCqfeXLN5r
// SIG // 1AjLyAAPNya/1MgAwAiV1VOJmmIrHM1M+ydddXg9Sqxv
// SIG // ZkPiE4J0Uf19sUwzAs/oqPGWRRxsBGYPnN75j6fO5uDq
// SIG // jilsoXKjFLqT73jv4EAvUb+LMyzRg2qHj3iuiFNCanBo
// SIG // 16sW3BKEv7NYQoD3e1MemFnlq1F2sW2/iaLIDms1IFBr
// SIG // NWqqZy489GCn1Kp/IuU25kdXahJUeEAPjmX3lYaU6J6z
// SIG // OLBPzJSdSS6UdhcACB1HjH6LVzUIsrWH0QVDiRxXiWBH
// SIG // 5WYFZNF8f+JGQXc4BUDzln1XdjaM15QtnqRrVI2pbgNq
// SIG // LDr0B2cxjqCk71lD1/fTLLBjmztMSR3dA8oD/yQFafm0
// SIG // RiamtruwKi5tvrQE9usiOb3nHA5jWbIN7w4dR3KQiWvU
// SIG // KUVvzA92vgBdsoFdbEZxlVFRt1Tg19wYRk/EzFPxolMt
// SIG // 4ewpVzsZmfsHgriDswpEw2yuTpQEvKkj6YKflxpTixD2
// SIG // jN9TIH+mE6aQGnj9KKYcd+OaIbcCAwEAAaOCAUkwggFF
// SIG // MB0GA1UdDgQWBBTQgrKnV0cvzJo2RlUwL8e2BVqbJTAf
// SIG // BgNVHSMEGDAWgBSfpxVdAF5iXYP05dJlpxtTNRnpcjBf
// SIG // BgNVHR8EWDBWMFSgUqBQhk5odHRwOi8vd3d3Lm1pY3Jv
// SIG // c29mdC5jb20vcGtpb3BzL2NybC9NaWNyb3NvZnQlMjBU
// SIG // aW1lLVN0YW1wJTIwUENBJTIwMjAxMCgxKS5jcmwwbAYI
// SIG // KwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAChlBodHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01p
// SIG // Y3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQQ0ElMjAyMDEw
// SIG // KDEpLmNydDAMBgNVHRMBAf8EAjAAMBYGA1UdJQEB/wQM
// SIG // MAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQEAwIHgDANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAOCL0m56+IxD4KOVuMY9//tHQ
// SIG // hsLM/Ot0BmdpgfWeEsLRhizL8H7EVLNzSJTw/y7FgMXV
// SIG // WB5JQM8C08EOTPj0Xcvdgxn7chDhjB37rexqvC90VHL6
// SIG // 769AC/zTbXxKWwBJAhc7HnsbWObN4c49619sL6AWZtsr
// SIG // YcHC3mZjIB0Apo2af9tHx1iYK4z2I7HukQybVE5b1LI6
// SIG // /vO/P7fr60BCKpZnmwnhIvlUFcXO8BdC7jE8P4AlnXKh
// SIG // 6Ki+diaLcSs2PI2UkO3HDR4QuHhxhUaWinokkNBl7ZWx
// SIG // iGz+JFtTtyc5So38ButjQkr35jNYjw/dF2IhZu//JoEd
// SIG // egJqnnw7H4wQlsH96oXiDH4Gc1qnhM/JWhZjPA3ZF47j
// SIG // gkBP9i9E8Ya41LXTJAE313WY2EZbHAQ8q/MxjJaaxQuy
// SIG // 3Magl5YcYbXdgjPpqXE3PEQdg9xKK9FHaD9+kPa+F1gl
// SIG // Vf9ip9AF7b1sbyH8jhZuWi5dHhM5IX7/15lJQXjghJUu
// SIG // 43XXVqQZUIybhx1B4zlRl5ayU+1+IYnBdaNt8eVPo+6j
// SIG // ygXHq8j9v9aMX5h3OrgV5VwSrpFf0AmQVQIgTGCYZ5LW
// SIG // pFh6aPbiHkp2E+kMe8H9kWrmByBEfEi0Zm5TMzzrPiR0
// SIG // M674e8Urcd9dCzqftA2jl7PMY2b4aZ/lrmYo+UZmYoww
// SIG // ggdxMIIFWaADAgECAhMzAAAAFcXna54Cm0mZAAAAAAAV
// SIG // MA0GCSqGSIb3DQEBCwUAMIGIMQswCQYDVQQGEwJVUzET
// SIG // MBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVk
// SIG // bW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0
// SIG // aW9uMTIwMAYDVQQDEylNaWNyb3NvZnQgUm9vdCBDZXJ0
// SIG // aWZpY2F0ZSBBdXRob3JpdHkgMjAxMDAeFw0yMTA5MzAx
// SIG // ODIyMjVaFw0zMDA5MzAxODMyMjVaMHwxCzAJBgNVBAYT
// SIG // AlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQH
// SIG // EwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
// SIG // cG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1l
// SIG // LVN0YW1wIFBDQSAyMDEwMIICIjANBgkqhkiG9w0BAQEF
// SIG // AAOCAg8AMIICCgKCAgEA5OGmTOe0ciELeaLL1yR5vQ7V
// SIG // gtP97pwHB9KpbE51yMo1V/YBf2xK4OK9uT4XYDP/XE/H
// SIG // ZveVU3Fa4n5KWv64NmeFRiMMtY0Tz3cywBAY6GB9alKD
// SIG // RLemjkZrBxTzxXb1hlDcwUTIcVxRMTegCjhuje3XD9gm
// SIG // U3w5YQJ6xKr9cmmvHaus9ja+NSZk2pg7uhp7M62AW36M
// SIG // EBydUv626GIl3GoPz130/o5Tz9bshVZN7928jaTjkY+y
// SIG // OSxRnOlwaQ3KNi1wjjHINSi947SHJMPgyY9+tVSP3PoF
// SIG // VZhtaDuaRr3tpK56KTesy+uDRedGbsoy1cCGMFxPLOJi
// SIG // ss254o2I5JasAUq7vnGpF1tnYN74kpEeHT39IM9zfUGa
// SIG // RnXNxF803RKJ1v2lIH1+/NmeRd+2ci/bfV+Autuqfjbs
// SIG // Nkz2K26oElHovwUDo9Fzpk03dJQcNIIP8BDyt0cY7afo
// SIG // mXw/TNuvXsLz1dhzPUNOwTM5TI4CvEJoLhDqhFFG4tG9
// SIG // ahhaYQFzymeiXtcodgLiMxhy16cg8ML6EgrXY28MyTZk
// SIG // i1ugpoMhXV8wdJGUlNi5UPkLiWHzNgY1GIRH29wb0f2y
// SIG // 1BzFa/ZcUlFdEtsluq9QBXpsxREdcu+N+VLEhReTwDwV
// SIG // 2xo3xwgVGD94q0W29R6HXtqPnhZyacaue7e3PmriLq0C
// SIG // AwEAAaOCAd0wggHZMBIGCSsGAQQBgjcVAQQFAgMBAAEw
// SIG // IwYJKwYBBAGCNxUCBBYEFCqnUv5kxJq+gpE8RjUpzxD/
// SIG // LwTuMB0GA1UdDgQWBBSfpxVdAF5iXYP05dJlpxtTNRnp
// SIG // cjBcBgNVHSAEVTBTMFEGDCsGAQQBgjdMg30BATBBMD8G
// SIG // CCsGAQUFBwIBFjNodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
// SIG // b20vcGtpb3BzL0RvY3MvUmVwb3NpdG9yeS5odG0wEwYD
// SIG // VR0lBAwwCgYIKwYBBQUHAwgwGQYJKwYBBAGCNxQCBAwe
// SIG // CgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB
// SIG // /wQFMAMBAf8wHwYDVR0jBBgwFoAU1fZWy4/oolxiaNE9
// SIG // lJBb186aGMQwVgYDVR0fBE8wTTBLoEmgR4ZFaHR0cDov
// SIG // L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVj
// SIG // dHMvTWljUm9vQ2VyQXV0XzIwMTAtMDYtMjMuY3JsMFoG
// SIG // CCsGAQUFBwEBBE4wTDBKBggrBgEFBQcwAoY+aHR0cDov
// SIG // L3d3dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNS
// SIG // b29DZXJBdXRfMjAxMC0wNi0yMy5jcnQwDQYJKoZIhvcN
// SIG // AQELBQADggIBAJ1VffwqreEsH2cBMSRb4Z5yS/ypb+pc
// SIG // FLY+TkdkeLEGk5c9MTO1OdfCcTY/2mRsfNB1OW27DzHk
// SIG // wo/7bNGhlBgi7ulmZzpTTd2YurYeeNg2LpypglYAA7AF
// SIG // vonoaeC6Ce5732pvvinLbtg/SHUB2RjebYIM9W0jVOR4
// SIG // U3UkV7ndn/OOPcbzaN9l9qRWqveVtihVJ9AkvUCgvxm2
// SIG // EhIRXT0n4ECWOKz3+SmJw7wXsFSFQrP8DJ6LGYnn8Atq
// SIG // gcKBGUIZUnWKNsIdw2FzLixre24/LAl4FOmRsqlb30mj
// SIG // dAy87JGA0j3mSj5mO0+7hvoyGtmW9I/2kQH2zsZ0/fZM
// SIG // cm8Qq3UwxTSwethQ/gpY3UA8x1RtnWN0SCyxTkctwRQE
// SIG // cb9k+SS+c23Kjgm9swFXSVRk2XPXfx5bRAGOWhmRaw2f
// SIG // pCjcZxkoJLo4S5pu+yFUa2pFEUep8beuyOiJXk+d0tBM
// SIG // drVXVAmxaQFEfnyhYWxz/gq77EFmPWn9y8FBSX5+k77L
// SIG // +DvktxW/tM4+pTFRhLy/AsGConsXHRWJjXD+57XQKBqJ
// SIG // C4822rpM+Zv/Cuk0+CQ1ZyvgDbjmjJnW4SLq8CdCPSWU
// SIG // 5nR0W2rRnj7tfqAxM328y+l7vzhwRNGQ8cirOoo6CGJ/
// SIG // 2XBjU02N7oJtpQUQwXEGahC0HVUzWLOhcGbyoYIDTTCC
// SIG // AjUCAQEwgfmhgdGkgc4wgcsxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJTAjBgNVBAsTHE1pY3Jvc29mdCBBbWVyaWNhIE9w
// SIG // ZXJhdGlvbnMxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVT
// SIG // Tjo3RjAwLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgU2VydmljZaIjCgEBMAcGBSsO
// SIG // AwIaAxUAwigGSir+ZbHQtsqDBimIkMu/af+ggYMwgYCk
// SIG // fjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1N
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDANBgkq
// SIG // hkiG9w0BAQsFAAIFAOsBbb0wIhgPMjAyNDEyMDkxMzIz
// SIG // MDlaGA8yMDI0MTIxMDEzMjMwOVowdDA6BgorBgEEAYRZ
// SIG // CgQBMSwwKjAKAgUA6wFtvQIBADAHAgEAAgITejAHAgEA
// SIG // AgITRzAKAgUA6wK/PQIBADA2BgorBgEEAYRZCgQCMSgw
// SIG // JjAMBgorBgEEAYRZCgMCoAowCAIBAAIDB6EgoQowCAIB
// SIG // AAIDAYagMA0GCSqGSIb3DQEBCwUAA4IBAQAvPo+XWO3H
// SIG // Cag0AgJbOiR2/v7R1tmFIpAkgOqUEfo8s+4SwkMRA7ex
// SIG // kYYd8yW61GKqIN8tiNRzkhuFbtfP7Tcr/cNE8B9zla2V
// SIG // uWmQU3riQSeoJcTxL/8WP8CN+YS3E0c1a70Mo71o+yW5
// SIG // Tdd0lGwmKbXC4L3orAxO/x2PKAgLjLtOdHsSKOnplZob
// SIG // nV7BBLSeBYW9Lu6aHHgEdnf36lvYh0W+BQQoDuzgB+Qd
// SIG // RjIZjnozS+7Cis+ybaAZRRmfJqrTXVF3uUaqwJ51d3Jl
// SIG // FoZmPp+7yoHBCFi55aXZuXU7je8os2Vlvh/WhwGfmiMy
// SIG // /Qq5AUM9fjKWimijT2H0JwPoMYIEDTCCBAkCAQEwgZMw
// SIG // fDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTACEzMAAAHw
// SIG // KnwdWTvmH60AAQAAAfAwDQYJYIZIAWUDBAIBBQCgggFK
// SIG // MBoGCSqGSIb3DQEJAzENBgsqhkiG9w0BCRABBDAvBgkq
// SIG // hkiG9w0BCQQxIgQga8KWIUdPqn3nBkS007peRIJ0dZny
// SIG // HtlZxm5r+2/PASQwgfoGCyqGSIb3DQEJEAIvMYHqMIHn
// SIG // MIHkMIG9BCBcAZqjpXL95FO5gAebFke+EBQIkupm/gjO
// SIG // mrJxQGVLizCBmDCBgKR+MHwxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1w
// SIG // IFBDQSAyMDEwAhMzAAAB8Cp8HVk75h+tAAEAAAHwMCIE
// SIG // IFVYqiZXn3QDBm4WRtpor4004rMlY3NRYzlh9uqfwJy0
// SIG // MA0GCSqGSIb3DQEBCwUABIICAFASJQsqKnAzo5YZB9vR
// SIG // 7DHjZsMjgLyTEg13bPK/Wg6F6wOszMTGJzkoWsb/l9ma
// SIG // PLdliunD8/sWRFt73BXybPoxyDefmVeWj6jRA5PneXGK
// SIG // KlVeLgv7dBn6RetYjA9fsxFML+mmgXs6V2J7pMdBBlcE
// SIG // 8E85UdbpsJVRKSVjl8gPGkW9N8LBiP409lNIYL07w5v/
// SIG // YaTaV/Q7SdC/YikuPhmlby0LK22XCOfvUXMnSWby7RQ7
// SIG // rCfXtaP2qTMU4VEVfazJcZPVSEsu/ZMVD5DbwTAw9/f3
// SIG // 5Sn0FNOU++NNgvwcBe1orST72+fEeYWnmLfzv1u7ZRUR
// SIG // sJorw3tTZX5wj3hw9HkOMDUF6y/UJuTvU/HEwwNxy2R2
// SIG // UQM77Hpdpas6XFqxvw6Jo/quVk5ueaQhrLcGWrvd+yVi
// SIG // cpKt716DTDfhIL0sKDxiCTtP5FlUq6JOHBLfKaaGKxwt
// SIG // 4k/rrHBLAr3w6VWyGhrRfMqP3LGnfZT8n2QaoRxNbdF0
// SIG // o+Xovsk60A0l/UySf7i/bmEI8O9dNQIMlcDI7/s9ynQu
// SIG // oIXNJE/voml524oXOWhECaeczYL5fuhPmM5WYjE/rOSJ
// SIG // 3+VChqPV7pnGpJbh7rpcIQ4BM+CyJx+MRigO7wzMfBeW
// SIG // AjTSdXmQKF2fjtmx0tGhT+DsovB0rnaQOTl3W4hAcY1T
// SIG // tA0Y
// SIG // End signature block
