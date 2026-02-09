// Item data utilities for fetching and displaying item names and descriptions from Data Dragon

interface ItemData {
  name: string;
  description: string;
  plaintext: string;
}

let itemDataCache: Map<number, ItemData> | null = null;
let latestVersion: string | null = null;

/**
 * Get latest Data Dragon version
 */
async function getLatestVersion(): Promise<string> {
  if (latestVersion) return latestVersion;
  
  try {
    const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions: string[] = await response.json();
    latestVersion = versions[0] || '14.1.1';
    return latestVersion;
  } catch (error) {
    console.error('Failed to fetch Data Dragon version:', error);
    return '14.1.1';
  }
}

/**
 * Fetch and cache item data from Data Dragon
 */
async function fetchItemData(): Promise<void> {
  if (itemDataCache) return;

  try {
    const version = await getLatestVersion();
    const response = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch item data: ${response.status}`);
    }

    const data: { data: Record<string, ItemData & { id: string }> } = await response.json();
    
    itemDataCache = new Map();
    Object.values(data.data).forEach((item) => {
      const itemId = parseInt(item.id, 10);
      if (!isNaN(itemId)) {
        itemDataCache!.set(itemId, {
          name: item.name,
          description: item.description,
          plaintext: item.plaintext,
        });
      }
    });
    
    console.log(`[fetchItemData] Loaded ${itemDataCache.size} items from Data Dragon version ${version}`);
  } catch (error) {
    console.error('Failed to fetch item data:', error);
    itemDataCache = new Map();
  }
}

/**
 * Preload item data (call this early in the app lifecycle)
 */
export async function preloadItemData(): Promise<void> {
  await fetchItemData();
}

/**
 * Get item name by item ID
 */
export async function getItemName(itemId: number): Promise<string> {
  await fetchItemData();
  return itemDataCache?.get(itemId)?.name || `Item ${itemId}`;
}

/**
 * Get item description by item ID
 */
export async function getItemDescription(itemId: number): Promise<string> {
  await fetchItemData();
  const item = itemDataCache?.get(itemId);
  if (!item) return `No description available for item ${itemId}`;
  
  // Return plaintext if available, otherwise use description (strip HTML tags for tooltip)
  return item.plaintext || item.description.replace(/<[^>]*>/g, '').substring(0, 200);
}

/**
 * Get item data (name and description) by item ID
 */
export async function getItemData(itemId: number): Promise<{ name: string; description: string }> {
  await fetchItemData();
  const item = itemDataCache?.get(itemId);
  if (!item) {
    return {
      name: `Item ${itemId}`,
      description: `No description available for item ${itemId}`,
    };
  }
  
  return {
    name: item.name,
    description: item.plaintext || item.description.replace(/<[^>]*>/g, '').substring(0, 200),
  };
}
