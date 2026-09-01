import Value from '../Value';
import { MobileProjectSettings } from './MobileProjectSettings';
import { WebProjectSettings } from './WebProjectSettings';
export type Wrapped<T> = {
    [K in keyof T]: Value<T[K]>;
};
export type ProjectSettings = MobileProjectSettings | WebProjectSettings;
export { MobileProjectSettings, WebProjectSettings };
