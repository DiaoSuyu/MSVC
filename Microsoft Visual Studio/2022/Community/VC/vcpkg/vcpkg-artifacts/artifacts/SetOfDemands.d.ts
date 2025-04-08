import { MetadataFile } from '../amf/metadata-file';
import { Demands } from '../interfaces/metadata/demands';
import { VersionReference } from '../interfaces/metadata/version-reference';
import { Session } from '../session';
export declare class SetOfDemands {
    _demands: Map<string, Demands>;
    constructor(metadata: MetadataFile, session: Session);
    get installer(): import("../interfaces/collections").Sequence<import("../interfaces/metadata/installers/Installer").Installer>;
    get errors(): string[];
    get warnings(): string[];
    get messages(): string[];
    get exports(): import("../interfaces/metadata/exports").Exports[];
    get requires(): Record<string, VersionReference>;
}
//# sourceMappingURL=SetOfDemands.d.ts.map