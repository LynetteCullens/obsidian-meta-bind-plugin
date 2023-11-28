import { type IMetadataSubscription } from './IMetadataSubscription';

export type Metadata = Record<string, unknown>;

export interface IMetadataManagerCache {
	metadata: Metadata;
	memory: Metadata;
	subscriptions: IMetadataSubscription[];
}

export interface MetadataManagerCacheItem extends IMetadataManagerCache {
	extraCache: unknown;
	metadata: Metadata;
	memory: Metadata;
	subscriptions: IMetadataSubscription[];
	/**
	 * The cycles since the last change to the cache by the plugin.
	 */
	cyclesSinceLastChange: number;
	/**
	 * Whether the cache was changed by th plugin. If this is true, the frotmatter should be updated.
	 */
	changed: boolean;
	/**
	 * The cycles that the cache has been inactive, meaning no listener registered to it.
	 */
	cyclesSinceInactive: number;
	/**
	 * Whether the there are no subscribers to the cache.
	 */
	inactive: boolean;
}

export interface MetadataManagerGlobalCache extends IMetadataManagerCache {
	memory: Metadata;
	subscriptions: IMetadataSubscription[];
}
