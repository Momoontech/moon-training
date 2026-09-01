export type Br<Type, Tag> = Type & {
    readonly __brand?: Tag;
};
export type BrHard<Type, Tag> = Type & {
    readonly __brand: Tag;
};
export type UUID = BrHard<string, 'UUID'>;
export type UuidType = 'v4' | 'v7' | 'bigint';
export type Nominal<Type, Tag> = Br<Type, Tag>;
export type NominalStr<Tag> = Br<string, Tag>;
export type NominalNum<Tag> = Br<number, Tag>;
export type NominalHard<Type, Tag> = BrHard<Type, Tag>;
export type NominalHardStr<Tag, BaseType = string> = BrHard<BaseType, Tag>;
export type NominalHardNum<Tag> = BrHard<number, Tag>;
export type b<T extends BrHard<any, any>> = T extends BrHard<any, infer Brand> ? Brand : never;
export type NominalStrTuple1<t1> = NominalHardStr<[t1, ...string[]]>;
export type NominalStrTuple2<t1, t2> = NominalHardStr<[t1, t2, ...string[]]>;
export type NominalStrTuple3<t1, t2, t3> = NominalHardStr<[t1, t2, t3, ...string[]]>;
export type NominalStrTuple4<t1, t2, t3, t4> = NominalHardStr<[t1, t2, t3, t4, ...string[]]>;
export type NominalStrTuple5<t1, t2, t3, t4, t5> = NominalHardStr<[t1, t2, t3, t4, t5, ...string[]]>;
export type NominalNumTuple1<t1> = NominalHardNum<[t1, ...string[]]>;
export type NominalNumTuple2<t1, t2> = NominalHardNum<[t1, t2, ...string[]]>;
export type NominalNumTuple3<t1, t2, t3> = NominalHardNum<[t1, t2, t3, ...string[]]>;
export type NominalNumTuple4<t1, t2, t3, t4> = NominalHardNum<[t1, t2, t3, t4, ...string[]]>;
export type NominalNumTuple5<t1, t2, t3, t4, t5> = NominalHardNum<[t1, t2, t3, t4, t5, ...string[]]>;
export type ArrayCounter = NominalHardNum<'ArrayCounter'>;
