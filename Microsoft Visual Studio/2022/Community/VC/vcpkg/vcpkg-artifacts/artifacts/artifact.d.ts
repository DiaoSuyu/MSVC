import { MetadataFile } from '../amf/metadata-file';
import { RegistriesDeclaration } from '../amf/registries';
import { InstallEvents } from '../interfaces/events';
import { Registry, RegistryResolver } from '../registries/registries';
import { Session } from '../session';
import { Uri } from '../util/uri';
import { Activation } from './activation';
import { SetOfDemands } from './SetOfDemands';
export type Selections = Map<string, string>;
export declare function parseArtifactDependency(id: string): [string | undefined, string];
export declare function buildRegistryResolver(session: Session, registries: RegistriesDeclaration | undefined): Promise<RegistryResolver>;
export declare abstract class ArtifactBase {
    protected session: Session;
    readonly metadata: MetadataFile;
    readonly applicableDemands: SetOfDemands;
    constructor(session: Session, metadata: MetadataFile);
    buildRegistryByName(name: string): Promise<Registry | undefined>;
    abstract loadActivationSettings(activation: Activation): Promise<boolean>;
}
export declare function checkDemands(session: Session, thisDisplayName: string, applicableDemands: SetOfDemands): boolean;
export declare enum InstallStatus {
    Installed = 0,
    AlreadyInstalled = 1,
    Failed = 2
}
export declare class Artifact extends ArtifactBase {
    shortName: string;
    targetLocation: Uri;
    constructor(session: Session, metadata: MetadataFile, shortName: string, targetLocation: Uri);
    get id(): string;
    get version(): string;
    get registryUri(): Uri;
    get isInstalled(): Promise<boolean>;
    get uniqueId(): string;
    install(thisDisplayName: string, events: Partial<InstallEvents>, options: {
        force?: boolean;
        allLanguages?: boolean;
        language?: string;
    }): Promise<InstallStatus>;
    writeManifest(): Promise<void>;
    uninstall(): Promise<void>;
    loadActivationSettings(activation: Activation): Promise<boolean>;
    sanitizeAndValidatePath(path: string): Promise<Uri | undefined>;
}
export declare function sanitizePath(path: string): string;
export declare function sanitizeUri(u: string): string;
export declare class ProjectManifest extends ArtifactBase {
    loadActivationSettings(activation: Activation): Promise<boolean>;
}
export declare class InstalledArtifact extends Artifact {
    constructor(session: Session, metadata: MetadataFile);
}
export interface ResolvedArtifact {
    artifact: ArtifactBase;
    uniqueId: string;
    initialSelection: boolean;
    depth: number;
    priority: number;
}
export declare function resolveDependencies(session: Session, registryResolver: RegistryResolver, initialParents: Array<ArtifactBase>, dependencyDepth: number): Promise<Array<ResolvedArtifact>>;
//# sourceMappingURL=artifact.d.ts.map