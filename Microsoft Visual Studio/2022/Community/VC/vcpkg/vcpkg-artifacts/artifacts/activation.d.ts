import { Exports } from '../interfaces/metadata/exports';
import { Session } from '../session';
import { Uri } from '../util/uri';
export interface XmlWriter {
    startDocument(version: string | undefined, encoding: string | undefined): XmlWriter;
    writeElement(name: string, content: string): XmlWriter;
    writeAttribute(name: string, value: string): XmlWriter;
    startElement(name: string): XmlWriter;
    endElement(): XmlWriter;
}
export interface UndoFile {
    environment: Record<string, string | undefined> | undefined;
    aliases: Array<string> | undefined;
    stack: Array<string> | undefined;
}
export type Tuple<K, V> = [K, V];
export declare class Activation {
    #private;
    private readonly allowStacking;
    private readonly channels;
    private readonly environment;
    private readonly postscriptFile;
    private readonly undoFile;
    private readonly nextUndoEnvironmentFile;
    private constructor();
    static start(session: Session, allowStacking: boolean): Promise<Activation>;
    addExports(exports: Exports, targetFolder: Uri): void;
    /** a collection of #define declarations that would assumably be applied to all compiler calls. */
    addDefine(name: string, value: string): void;
    get defines(): AsyncGenerator<Promise<Tuple<string, string>>, any, unknown>;
    getDefine(name: string): Promise<string | undefined>;
    /** a collection of tool locations from artifacts */
    addTool(name: string, value: string): void;
    get tools(): AsyncGenerator<Promise<Tuple<string, string>>, any, unknown>;
    getTool(name: string): Promise<string | undefined>;
    /** Aliases are tools that get exposed to the user as shell aliases */
    addAlias(name: string, value: string): void;
    getAlias(name: string, refcheck?: Set<string>): Promise<string | undefined>;
    get aliases(): AsyncGenerator<Promise<Tuple<string, string>>, any, unknown>;
    get aliasCount(): number;
    /** a collection of 'published locations' from artifacts */
    addLocation(name: string, location: string | Uri): void;
    get locations(): AsyncGenerator<Promise<Tuple<string, string>>, any, unknown>;
    getLocation(name: string): Promise<string> | undefined;
    /** a collection of environment variables from artifacts that are intended to be combinined into variables that have PATH delimiters */
    addPath(name: string, location: string | Iterable<string> | Uri | Iterable<Uri>): void;
    get paths(): AsyncGenerator<Promise<Tuple<string, Set<string>>>, any, unknown>;
    getPath(name: string): Promise<Set<string> | undefined>;
    /** environment variables from artifacts */
    addEnvironmentVariable(name: string, value: string | Iterable<string>): void;
    /** a collection of arbitrary properties from artifacts */
    addProperty(name: string, value: string | Iterable<string>): void;
    get properties(): AsyncGenerator<Promise<Tuple<string, Set<string>>>, any, unknown>;
    getProperty(name: string): Promise<Set<string> | undefined>;
    msBuildProcessPropertyValue(value: string, targetFolder: Uri): string;
    addMSBuildProperty(name: string, value: string, targetFolder: Uri): void;
    resolveAndVerify(value: string, locals?: Array<string>, refcheck?: Set<string>): Promise<string>;
    resolveAndVerify(value: Set<string>, locals?: Array<string>, refcheck?: Set<string>): Promise<Set<string>>;
    private resolveVariables;
    private getValueForVariableSubstitution;
    private validatePath;
    expandPathLikeVariableExpressions(value: string): Array<string>;
    generateMSBuild(): string;
    protected generateEnvironmentVariables(): Promise<[Record<string, string>, Record<string, string>]>;
    activate(thisStackEntries: Array<string>, msbuildFile: Uri | undefined, json: Uri | undefined): Promise<boolean>;
}
export declare function deactivate(session: Session, warnIfNoActivation: boolean): Promise<boolean>;
//# sourceMappingURL=activation.d.ts.map