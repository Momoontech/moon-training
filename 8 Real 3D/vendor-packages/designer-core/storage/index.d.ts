import { ICoreStorage } from '../declarations';
export declare class CoreStorage {
    private hash;
    get<T extends keyof ICoreStorage>(key: T): ICoreStorage[T];
    set<T extends keyof ICoreStorage>(key: T, value: ICoreStorage[T]): void;
    dispose(): void;
}
